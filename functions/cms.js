const {
  logger, admin, db, pubsub, onDocumentUpdated, onDocumentWritten, onDocumentDeleted, onDocumentCreated, onMessagePublished,
} = require('./config.js')

const { createKvMirrorHandler } = require('./kv/kvMirror')

const SITE_AI_TOPIC = 'site-ai-bootstrap'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const getTimestampMillis = (value) => {
  if (!value)
    return null
  if (typeof value.toMillis === 'function')
    return value.toMillis()
  if (typeof value === 'number')
    return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  if (typeof value === 'object') {
    if (admin?.firestore?.Timestamp && value instanceof admin.firestore.Timestamp)
      return value.toMillis()
    if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number')
      return value.seconds * 1000 + value.nanoseconds / 1e6
  }
  return null
}

const cloneValue = (val) => {
  if (val === null || typeof val !== 'object')
    return val
  if (admin?.firestore?.Timestamp && val instanceof admin.firestore.Timestamp)
    return val
  if (val instanceof Date)
    return new Date(val.getTime())
  if (Array.isArray(val))
    return val.map(cloneValue)
  const cloned = {}
  for (const [key, value] of Object.entries(val)) {
    cloned[key] = cloneValue(value)
  }
  return cloned
}

const replaceSyncedBlockIfOlder = (blocks, blockId, sourceBlock, sourceMillis) => {
  let updated = false
  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i]
    if (currentBlock?.blockId !== blockId)
      continue
    const currentMillis = getTimestampMillis(currentBlock.blockUpdatedAt)
    if (currentMillis !== null && currentMillis >= sourceMillis)
      continue
    blocks[i] = cloneValue(sourceBlock)
    updated = true
  }
  return updated
}

const collectSyncedBlocks = (content, postContent) => {
  const syncedBlocks = new Map()
  const blocks = [
    ...(Array.isArray(content) ? content : []),
    ...(Array.isArray(postContent) ? postContent : []),
  ]

  for (const block of blocks) {
    if (!block?.synced || !block.blockId)
      continue
    const millis = getTimestampMillis(block.blockUpdatedAt)
    if (millis === null)
      continue
    const existing = syncedBlocks.get(block.blockId)
    if (!existing || millis > existing.millis)
      syncedBlocks.set(block.blockId, { block, millis })
  }

  return syncedBlocks
}

const BLOCK_META_EXCLUDE_KEYS = new Set(['queryItems', 'limit'])

const updateBlocksInArray = (blocks, blockId, afterData) => {
  let touched = false
  for (const block of blocks) {
    if (block?.blockId !== blockId)
      continue

    if (afterData.content !== undefined)
      block.content = afterData.content

    block.meta = block.meta || {}
    const srcMeta = afterData.meta || {}
    for (const key of Object.keys(srcMeta)) {
      block.meta[key] = block.meta[key] || {}
      const src = srcMeta[key] || {}
      for (const metaKey of Object.keys(src)) {
        if (BLOCK_META_EXCLUDE_KEYS.has(metaKey))
          continue
        block.meta[key][metaKey] = src[metaKey]
      }
    }

    touched = true
  }
  return touched
}

const buildPageBlockUpdate = (pageData, blockId, afterData) => {
  const pageContent = Array.isArray(pageData.content) ? [...pageData.content] : []
  const pagePostContent = Array.isArray(pageData.postContent) ? [...pageData.postContent] : []

  const contentTouched = updateBlocksInArray(pageContent, blockId, afterData)
  const postContentTouched = updateBlocksInArray(pagePostContent, blockId, afterData)

  return {
    touched: contentTouched || postContentTouched,
    content: pageContent,
    postContent: pagePostContent,
  }
}

exports.blockUpdated = onDocumentUpdated({ document: 'organizations/{orgId}/blocks/{blockId}', timeoutSeconds: 180 }, async (event) => {
  const change = event.data
  const blockId = event.params.blockId
  const orgId = event.params.orgId
  const afterData = change.after.data() || {}

  const sites = await db.collection('organizations').doc(orgId).collection('sites').get()
  if (sites.empty)
    logger.log(`No sites found in org ${orgId}`)

  const processedSiteIds = new Set()

  const updatePagesForSite = async (siteId, { updatePublished = true, scopeLabel }) => {
    const pagesSnap = await db.collection('organizations').doc(orgId)
      .collection('sites').doc(siteId)
      .collection('pages')
      .where('blockIds', 'array-contains', blockId)
      .get()

    if (pagesSnap.empty) {
      logger.log(`No pages found using block ${blockId} in ${scopeLabel}`)
      return
    }

    for (const pageDoc of pagesSnap.docs) {
      const pageData = pageDoc.data() || {}
      const { touched, content, postContent } = buildPageBlockUpdate(pageData, blockId, afterData)

      if (!touched) {
        logger.log(`Page ${pageDoc.id} has no matching block ${blockId} in ${scopeLabel}`)
        continue
      }

      await pageDoc.ref.update({ content, postContent })

      if (updatePublished) {
        const publishedRef = db.collection('organizations').doc(orgId)
          .collection('sites').doc(siteId)
          .collection('published').doc(pageDoc.id)

        const publishedDoc = await publishedRef.get()
        if (publishedDoc.exists) {
          await publishedRef.update({ content, postContent })
        }
      }

      logger.log(`Updated page ${pageDoc.id} in ${scopeLabel} with new block ${blockId} content`)
    }
  }

  for (const siteDoc of sites.docs) {
    const siteId = siteDoc.id
    processedSiteIds.add(siteId)
    await updatePagesForSite(siteId, {
      updatePublished: siteId !== 'templates',
      scopeLabel: siteId === 'templates'
        ? `templates site (org ${orgId})`
        : `site ${siteId} (org ${orgId})`,
    })
  }

  if (!processedSiteIds.has('templates')) {
    await updatePagesForSite('templates', {
      updatePublished: false,
      scopeLabel: `templates site (org ${orgId})`,
    })
  }
})

const slug = s => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
const yyyyMM = (d) => {
  const dt = d ? new Date(d) : new Date()
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const h = String(dt.getUTCHours()).padStart(2, '0')
  const min = String(dt.getUTCMinutes()).padStart(2, '0')
  return `${y}${m}${h}${min}`
}
// Canonical + indices for posts
exports.onPostWritten = createKvMirrorHandler({
  document: 'organizations/{orgId}/sites/{siteId}/published_posts/{postId}',

  makeCanonicalKey: ({ orgId, siteId, postId }) =>
    `posts:${orgId}:${siteId}:${postId}`,

  makeIndexKeys: ({ orgId, siteId, postId }, data) => {
    const keys = []

    // by tag
    const tags = Array.isArray(data?.tags) ? data.tags : []
    for (const t of tags) {
      const st = slug(t)
      if (st)
        keys.push(`idx:posts:tags:${orgId}:${siteId}:${st}:${postId}`)
    }

    // by date (archive buckets)
    const pub = data?.publishedAt || data?.doc_created_at || data?.createdAt || null
    if (pub)
      keys.push(`idx:posts:dates:${orgId}:${siteId}:${yyyyMM(pub)}:${postId}`)

    // by slug (direct lookup)
    if (data?.name)
      keys.push(`idx:posts:slugs:${orgId}:${siteId}:${data.name}`)

    return keys
  },

  // store full document as-is
  serialize: data => JSON.stringify(data),

  // tiny metadata so you can render lists without N GETs (stored in meta:{key})
  makeMetadata: data => ({
    title: data?.title || '',
    blurb: data?.blurb || '',
    doc_created_at: data?.doc_created_at || '',
    featuredImage: data?.featuredImage || '',
    name: data?.name || '',
  }),

  timeoutSeconds: 180,
})

exports.onSiteWritten = createKvMirrorHandler({
  document: 'organizations/{orgId}/published-site-settings/{siteId}',
  makeCanonicalKey: ({ orgId, siteId }) =>
    `sites:${orgId}:${siteId}`,
  makeIndexKeys: ({ orgId }, data) => {
    const keys = []
    const domains = Array.isArray(data?.domains) ? data.domains : []
    for (const domain of domains) {
      const st = slug(domain)
      keys.push(`idx:sites:domains:${st}`)
    }
    return keys
  },
  serialize: data => JSON.stringify(data),
  timeoutSeconds: 180,
})

exports.onAgentWritten = createKvMirrorHandler({
  document: 'organizations/{orgId}/users/{agentId}',
  makeCanonicalKey: ({ orgId, agentId }) =>
    `agents:${orgId}:${agentId}`,
  serialize: data => JSON.stringify(data),
  timeoutSeconds: 180,
})

exports.onThemeWritten = createKvMirrorHandler({
  document: 'organizations/{orgId}/themes/{themeId}',
  makeCanonicalKey: ({ orgId, themeId }) =>
    `themes:${orgId}:${themeId}`,
  serialize: data => JSON.stringify({ theme: JSON.parse(data.theme), headJSON: JSON.parse(data.headJSON) }),
  timeoutSeconds: 180,
})

exports.onPublishedPageWritten = createKvMirrorHandler({
  document: 'organizations/{orgId}/sites/{siteId}/published/{pageId}',
  makeCanonicalKey: ({ orgId, siteId, pageId }) =>
    `pages:${orgId}:${siteId}:${pageId}`,
  timeoutSeconds: 180,
})

exports.syncPublishedSyncedBlocks = onDocumentWritten({ document: 'organizations/{orgId}/sites/{siteId}/published/{pageId}', timeoutSeconds: 180 }, async (event) => {
  const change = event.data
  if (!change.after.exists)
    return

  const orgId = event.params.orgId
  const siteId = event.params.siteId
  const pageId = event.params.pageId
  const data = change.after.data() || {}
  const syncedBlocks = collectSyncedBlocks(data.content, data.postContent)

  if (!syncedBlocks.size)
    return

  const publishedRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId).collection('published')
  const draftRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId).collection('pages')

  for (const [blockId, { block: sourceBlock, millis: sourceMillis }] of syncedBlocks.entries()) {
    const publishedSnap = await publishedRef.where('blockIds', 'array-contains', blockId).get()
    if (publishedSnap.empty)
      continue

    for (const publishedDoc of publishedSnap.docs) {
      if (publishedDoc.id === pageId)
        continue

      const publishedData = publishedDoc.data() || {}
      const publishedContent = Array.isArray(publishedData.content) ? [...publishedData.content] : []
      const publishedPostContent = Array.isArray(publishedData.postContent) ? [...publishedData.postContent] : []

      const updatedContent = replaceSyncedBlockIfOlder(publishedContent, blockId, sourceBlock, sourceMillis)
      const updatedPostContent = replaceSyncedBlockIfOlder(publishedPostContent, blockId, sourceBlock, sourceMillis)

      if (!updatedContent && !updatedPostContent)
        continue

      await publishedDoc.ref.update({ content: publishedContent, postContent: publishedPostContent })

      logger.log(`Synced published block ${blockId} from page ${pageId} to published page ${publishedDoc.id} in site ${siteId} (org ${orgId})`)
    }

    const draftSnap = await draftRef.where('blockIds', 'array-contains', blockId).get()
    if (!draftSnap.empty) {
      for (const draftDoc of draftSnap.docs) {
        if (draftDoc.id === pageId)
          continue

        const draftData = draftDoc.data() || {}
        const draftContent = Array.isArray(draftData.content) ? [...draftData.content] : []
        const draftPostContent = Array.isArray(draftData.postContent) ? [...draftData.postContent] : []

        const updatedDraftContent = replaceSyncedBlockIfOlder(draftContent, blockId, sourceBlock, sourceMillis)
        const updatedDraftPostContent = replaceSyncedBlockIfOlder(draftPostContent, blockId, sourceBlock, sourceMillis)

        if (!updatedDraftContent && !updatedDraftPostContent)
          continue

        await draftDoc.ref.update({ content: draftContent, postContent: draftPostContent })
        logger.log(`Synced published block ${blockId} from page ${pageId} to draft page ${draftDoc.id} in site ${siteId} (org ${orgId})`)
      }
    }
  }
})

exports.onPageUpdated = onDocumentWritten({ document: 'organizations/{orgId}/sites/{siteId}/pages/{pageId}', timeoutSeconds: 180 }, async (event) => {
  const change = event.data
  const orgId = event.params.orgId
  const siteId = event.params.siteId
  const pageId = event.params.pageId
  const content = change.after.exists ? change.after.data().content : []
  const postContent = change.after.exists ? change.after.data().postContent : []

  const syncedBlocks = collectSyncedBlocks(content, postContent)

  if (!syncedBlocks.size)
    return

  const pagesRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId).collection('pages')

  for (const [blockId, { block: sourceBlock, millis: sourceMillis }] of syncedBlocks.entries()) {
    const pagesSnap = await pagesRef.where('blockIds', 'array-contains', blockId).get()
    if (pagesSnap.empty)
      continue

    for (const pageDoc of pagesSnap.docs) {
      if (pageDoc.id === pageId)
        continue

      const pageData = pageDoc.data() || {}
      const pageContent = Array.isArray(pageData.content) ? [...pageData.content] : []
      const pagePostContent = Array.isArray(pageData.postContent) ? [...pageData.postContent] : []

      const updatedContent = replaceSyncedBlockIfOlder(pageContent, blockId, sourceBlock, sourceMillis)
      const updatedPostContent = replaceSyncedBlockIfOlder(pagePostContent, blockId, sourceBlock, sourceMillis)

      if (!updatedContent && !updatedPostContent)
        continue

      await pageDoc.ref.update({ content: pageContent, postContent: pagePostContent })

      logger.log(`Synced block ${blockId} to page ${pageDoc.id} in site ${siteId} (org ${orgId})`)
    }
  }
})

exports.onPageDeleted = onDocumentDeleted({ document: 'organizations/{orgId}/sites/{siteId}/pages/{pageId}', timeoutSeconds: 180 }, async (event) => {
  const orgId = event.params.orgId
  const siteId = event.params.siteId
  const pageId = event.params.pageId
  const publishedRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId).collection('published').doc(pageId)
  await publishedRef.delete()
})

exports.onSiteDeleted = onDocumentDeleted({ document: 'organizations/{orgId}/sites/{siteId}', timeoutSeconds: 180 }, async (event) => {
  // delete documents in sites/{siteId}/published
  const orgId = event.params.orgId
  const siteId = event.params.siteId

  // delete documents in sites/{siteId}/pages
  const pagesRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId).collection('pages')
  const pagesDocs = await pagesRef.listDocuments()
  for (const doc of pagesDocs) {
    await doc.delete()
  }

  // delete the published-site-settings document
  const siteSettingsRef = db.collection('organizations').doc(orgId).collection('published-site-settings').doc(siteId)
  await siteSettingsRef.delete()
})

const isFillableMeta = (meta) => {
  if (!meta)
    return false
  if (meta.api || meta.collection)
    return false
  return true
}

const normalizeOptionValue = (value, options = [], valueKey = 'value', titleKey = 'title') => {
  if (value === null || value === undefined)
    return null
  const stringVal = String(value).trim().toLowerCase()
  for (const option of options) {
    const optValue = option?.[valueKey]
    const optTitle = option?.[titleKey]
    if (stringVal === String(optValue).trim().toLowerCase() || stringVal === String(optTitle).trim().toLowerCase())
      return optValue
  }
  return null
}

const sanitizeArrayWithSchema = (schema = [], arr) => {
  if (!Array.isArray(arr))
    return []
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object')
        return null
      const clean = {}
      for (const schemaItem of schema) {
        const val = item[schemaItem.field]
        if (val === null || val === undefined)
          continue
        if (typeof val === 'string')
          clean[schemaItem.field] = val
        else if (typeof val === 'number')
          clean[schemaItem.field] = val
        else if (typeof val === 'boolean')
          clean[schemaItem.field] = val
        else
          clean[schemaItem.field] = JSON.stringify(val)
      }
      return Object.keys(clean).length ? clean : null
    })
    .filter(Boolean)
}

const sanitizeValueForMeta = (type, value, meta) => {
  switch (type) {
    case 'number': {
      const num = Number(value)
      return Number.isFinite(num) ? num : null
    }
    case 'json': {
      if (value == null)
        return null
      if (typeof value === 'object')
        return JSON.stringify(value)
      const str = String(value).trim()
      if (!str)
        return null
      try {
        JSON.parse(str)
        return str
      }
      catch {
        return str
      }
    }
    case 'array': {
      if (meta?.schema)
        return sanitizeArrayWithSchema(meta.schema, value)
      if (!Array.isArray(value))
        return []
      return value.map(v => String(v || '')).filter(Boolean)
    }
    case 'option': {
      if (meta?.option?.options)
        return normalizeOptionValue(value, meta.option.options, meta.option.optionsValue, meta.option.optionsKey)
      return typeof value === 'string' ? value : null
    }
    case 'richtext':
    case 'textarea':
    case 'text':
    default:
      return typeof value === 'string' ? value : (value === null || value === undefined ? null : String(value))
  }
}

const buildFieldsList = (pagesSnap) => {
  const descriptors = []
  const descriptorMap = new Map()

  for (const pageDoc of pagesSnap.docs) {
    const pageId = pageDoc.id
    const pageData = pageDoc.data() || {}
    const pageName = pageData.name || pageId
    const metaTargets = [
      ['metaTitle', 'text', 'Meta Title'],
      ['metaDescription', 'text', 'Meta Description'],
      ['structuredData', 'json', 'Structured Data (JSON-LD)'],
    ]
    for (const [field, type, title] of metaTargets) {
      const path = `${pageId}.meta.${field}`
      const descriptor = {
        path,
        pageId,
        pageName,
        location: 'pageMeta',
        blockIndex: -1,
        blockId: 'meta',
        field,
        type,
        title,
        option: null,
        schema: null,
      }
      descriptors.push(descriptor)
      descriptorMap.set(path, descriptor)
    }

    const locations = [
      ['content', Array.isArray(pageData.content) ? pageData.content : []],
      ['postContent', Array.isArray(pageData.postContent) ? pageData.postContent : []],
    ]

    for (const [location, blocks] of locations) {
      blocks.forEach((block, blockIndex) => {
        const meta = block?.meta || {}
        const values = block?.values || {}
        const blockId = block?.blockId || `block-${blockIndex}`
        for (const [field, cfg] of Object.entries(meta)) {
          if (!isFillableMeta(cfg))
            continue
          const type = cfg.type || 'text'
          const path = `${pageId}.${location}.${blockId}.${field}`
          const descriptor = {
            path,
            pageId,
            pageName,
            location,
            blockIndex,
            blockId,
            field,
            type,
            title: cfg.title || field,
            option: cfg.option || null,
            schema: Array.isArray(cfg.schema) ? cfg.schema : null,
          }
          descriptors.push(descriptor)
          descriptorMap.set(path, descriptor)
        }
      })
    }
  }

  return { descriptors, descriptorMap }
}

const formatFieldPrompt = (descriptor) => {
  const parts = [
    `- path: ${descriptor.path}`,
    `  page: ${descriptor.pageName}`,
    `  field: ${descriptor.title || descriptor.field}`,
    `  type: ${descriptor.type}`,
  ]
  if (descriptor.option?.options?.length) {
    const opts = descriptor.option.options
      .map(opt => `${opt?.[descriptor.option.optionsValue || 'value']} (${opt?.[descriptor.option.optionsKey || 'title'] || ''})`)
      .join(', ')
    parts.push(`  options: ${opts}`)
  }
  if (descriptor.schema?.length) {
    const schemaFields = descriptor.schema.map(s => `${s.field}:${s.type}`).join(', ')
    parts.push(`  array schema: ${schemaFields}`)
  }
  return parts.join('\n')
}

const summarizeAgentMeta = (meta = {}) => {
  const entries = []
  for (const [key, val] of Object.entries(meta)) {
    if (val == null)
      continue
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    if (!str.trim())
      continue
    // Trim extremely long fields to avoid prompt bloat
    const trimmed = str.length > 400 ? `${str.slice(0, 400)}...` : str
    entries.push(`${key}: ${trimmed}`)
  }
  return entries
}

const summarizeAgentRoot = (agent = {}) => {
  const entries = []
  for (const [key, val] of Object.entries(agent)) {
    if (key === 'meta' || key === 'userId' || key === 'uid')
      continue
    if (val == null)
      continue
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    if (!str.trim())
      continue
    const trimmed = str.length > 400 ? `${str.slice(0, 400)}...` : str
    entries.push(`${key}: ${trimmed}`)
  }
  return entries
}

const callOpenAiForSiteBootstrap = async ({ siteData, agentData, instructions, fields }) => {
  if (!OPENAI_API_KEY)
    throw new Error('OPENAI_API_KEY not set')
  if (!fields || fields.length === 0)
    return {}

  const siteSummary = [
    `Site name: ${siteData?.name || 'n/a'}`,
    `Domains: ${(Array.isArray(siteData?.domains) ? siteData.domains.join(', ') : '') || 'n/a'}`,
  ].join('\n')

  const rootLines = agentData ? summarizeAgentRoot(agentData) : []
  const metaLines = agentData ? summarizeAgentMeta(agentData.meta || {}) : []
  const agentSummary = agentData
    ? [
    `Agent name: ${agentData.meta?.name || agentData.name || agentData.userId || ''}`,
    `Title: ${agentData.meta?.title || ''}`,
    `Bio: ${agentData.meta?.bio || ''}`,
    `Phone: ${agentData.meta?.phone || ''}`,
    `Email: ${agentData.meta?.email || ''}`,
    rootLines.length ? 'Additional agent fields:' : '',
    ...rootLines,
    metaLines.length ? 'Additional agent meta:' : '',
    ...metaLines,
      ].filter(Boolean).join('\n')
    : 'Agent data: n/a'

  const fieldPrompts = fields.map(formatFieldPrompt).join('\n')

  const system = [
    'You are a website copywriter tasked with pre-filling CMS blocks for a brand-new site.',
    'Use the provided site/agent context and instructions.',
    'Keep outputs concise, professional, and free of placeholder words like "lorem ipsum".',
    'Return JSON only, with this shape: {"fields": {"<path>": <value>}}.',
    'For text/richtext/textarea: short, readable copy. For numbers: numeric only.',
    'For arrays without schema: array of short strings. For arrays with schema: array of objects matching the schema fields.',
    'For option fields: return one of the allowed option values (not the label).',
    'If you truly cannot infer a value, return an empty string for that key.',
    'All content, including meta titles/descriptions and structured data, should be optimized for maximum SEO performance.',
  ].join(' ')

  const user = [
    siteSummary,
    `AI instructions: ${instructions || 'n/a'}`,
    agentSummary,
    '',
    'Fields to fill:',
    fieldPrompts,
  ].join('\n')

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`OpenAI error ${resp.status}: ${txt}`)
  }

  const json = await resp.json()
  const content = json?.choices?.[0]?.message?.content || '{}'
  try {
    return JSON.parse(content)
  }
  catch (err) {
    logger.error('Failed to parse OpenAI response', err)
    return {}
  }
}

const applyAiResults = (descriptorMap, pagesSnap, aiResults) => {
  if (!aiResults || typeof aiResults.fields !== 'object')
    return {}

  const updates = {}
  const pageDocsMap = new Map()
  for (const doc of pagesSnap.docs)
    pageDocsMap.set(doc.id, doc.data() || {})

  for (const [path, value] of Object.entries(aiResults.fields)) {
    const descriptor = descriptorMap.get(path)
    if (!descriptor)
      continue
    const pageData = pageDocsMap.get(descriptor.pageId) || {}
    if (!updates[descriptor.pageId]) {
      updates[descriptor.pageId] = {
        content: Array.isArray(pageData.content) ? JSON.parse(JSON.stringify(pageData.content)) : [],
        postContent: Array.isArray(pageData.postContent) ? JSON.parse(JSON.stringify(pageData.postContent)) : [],
        metaTitle: pageData.metaTitle || '',
        metaDescription: pageData.metaDescription || '',
        structuredData: pageData.structuredData || '',
      }
    }

    const sanitized = sanitizeValueForMeta(descriptor.type, value, { option: descriptor.option, schema: descriptor.schema })
    if (sanitized === null || sanitized === undefined)
      continue
    if (Array.isArray(sanitized) && sanitized.length === 0)
      continue
    if (typeof sanitized === 'string' && sanitized.trim().length === 0)
      continue

    if (descriptor.location === 'pageMeta') {
      if (descriptor.field === 'metaTitle')
        updates[descriptor.pageId].metaTitle = sanitized
      else if (descriptor.field === 'metaDescription')
        updates[descriptor.pageId].metaDescription = sanitized
      else if (descriptor.field === 'structuredData')
        updates[descriptor.pageId].structuredData = sanitized
      continue
    }

    const targetBlocks = descriptor.location === 'postContent' ? updates[descriptor.pageId].postContent : updates[descriptor.pageId].content
    const block = targetBlocks[descriptor.blockIndex]
    if (!block)
      continue
    block.values = block.values || {}
    block.values[descriptor.field] = sanitized
  }

  return updates
}

exports.siteAiBootstrapEnqueue = onDocumentCreated(
  { document: 'organizations/{orgId}/sites/{siteId}', timeoutSeconds: 180 },
  async (event) => {
    const { orgId, siteId } = event.params
    if (!orgId || !siteId || siteId === 'templates')
      return
    const data = event.data?.data() || {}
    if (!data.aiAgentUserId && !data.aiInstructions)
      return
    const siteRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId)
    await siteRef.set({ aiBootstrapStatus: 'queued' }, { merge: true })
    await pubsub.topic(SITE_AI_TOPIC).publishMessage({ json: { orgId, siteId, attempt: 0 } })
    logger.info('Enqueued AI bootstrap for site', { orgId, siteId })
  },
)

const setAiStatus = async (siteRef, status) => {
  try {
    await siteRef.set({ aiBootstrapStatus: status }, { merge: true })
  }
  catch (err) {
    logger.warn('Failed to set AI status', { status, error: err?.message })
  }
}

exports.siteAiBootstrapWorker = onMessagePublished(
  { topic: SITE_AI_TOPIC, retry: true, timeoutSeconds: 540, memory: '1GiB' },
  async (event) => {
    const msg = event.data?.message?.json || {}
    const { orgId, siteId } = msg
    const attempt = msg.attempt || 0
    if (!orgId || !siteId || siteId === 'templates')
      return

    const siteRef = db.collection('organizations').doc(orgId).collection('sites').doc(siteId)
    const siteSnap = await siteRef.get()
    if (!siteSnap.exists)
      return
    const siteData = siteSnap.data() || {}
    if (!siteData.aiAgentUserId && !siteData.aiInstructions)
      return
    await setAiStatus(siteRef, 'running')

    const pagesRef = siteRef.collection('pages')
    let pagesSnap = await pagesRef.get()
    if (pagesSnap.empty) {
      await sleep(5000)
      pagesSnap = await pagesRef.get()
    }
    if (pagesSnap.empty) {
      if (attempt < 5) {
        await pubsub.topic(SITE_AI_TOPIC).publishMessage({ json: { orgId, siteId, attempt: attempt + 1 } })
        logger.warn('No pages found yet for AI bootstrap, requeued', { orgId, siteId, attempt })
      }
      else {
        await setAiStatus(siteRef, 'failed')
      }
      return
    }

    let agentData = null
    if (siteData.aiAgentUserId) {
      const usersRef = db.collection('organizations').doc(orgId).collection('users')
      const agentQuery = await usersRef.where('userId', '==', siteData.aiAgentUserId).limit(1).get()
      if (!agentQuery.empty) {
        agentData = agentQuery.docs[0].data()
      }
    }

    const { descriptors, descriptorMap } = buildFieldsList(pagesSnap)
    if (!descriptors.length) {
      logger.info('No eligible fields to fill for AI bootstrap', { orgId, siteId })
      return
    }

    let aiResults = {}
    try {
      aiResults = await callOpenAiForSiteBootstrap({
        siteData,
        agentData,
        instructions: siteData.aiInstructions,
        fields: descriptors,
      })
    }
    catch (err) {
      logger.error('AI bootstrap failed', { orgId, siteId, error: err?.message })
      await setAiStatus(siteRef, 'failed')
      return
    }

    const updates = applyAiResults(descriptorMap, pagesSnap, aiResults)
    const pageIds = Object.keys(updates)
    if (!pageIds.length) {
      logger.info('AI bootstrap returned no applicable updates', { orgId, siteId })
      await setAiStatus(siteRef, 'completed')
      return
    }

    for (const pageId of pageIds) {
      const update = updates[pageId]
      await siteRef.collection('pages').doc(pageId).update({
        content: update.content,
        postContent: update.postContent,
        metaTitle: update.metaTitle,
        metaDescription: update.metaDescription,
        structuredData: update.structuredData,
      })
    }

    logger.info('AI bootstrap applied', { orgId, siteId, pagesUpdated: pageIds.length })
    await setAiStatus(siteRef, 'completed')
  },
)
