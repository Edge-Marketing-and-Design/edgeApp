# Edge App Agent Guide

This project is Nuxt 3 + Vue 3, SPA mode. Follow these rules so new code matches how we already build apps.

## Core stack and style
- Use `<script setup>` with JavaScript only (no TypeScript, no Options API).
- Components and composables from `edge/composables/**` are auto-imported; avoid manual imports unless needed.
- Utilities: use `cn` from `@/lib/utils` for class merging, `lucide-vue-next` for icons, Tailwind for layout/styling. Keep comments minimal and useful.
- Components under `edge/components` are globally registered with the `edge-` prefix (e.g., `edge-dashboard`, `edge-editor`, `edge-shad-button`).
- Check the project's lint tooling (package.json scripts + config files) before coding and follow its rules; avoid using functions before they are defined.

## Firebase and data access
- Never import Firebase SDKs directly. All Auth/Firestore/Functions/Storage access goes through the injected `edgeFirebase` plugin (`plugins/firebase.client.ts` from `@edgedev/firebase`).
- Get the instance via `const edgeFirebase = inject('edgeFirebase')`. Use the wrapper methods already used in the codebase: `startSnapshot/stopSnapshot`, `startUsersSnapshot`, `SearchStaticData`, `getDocData`, `storeDoc`, `changeDoc`, `removeDoc`, `runFunction`, `setUserMeta`, `addUser`, `removeUserRoles`, etc.
- Always scope Firestore paths to the active org using `edgeGlobal.edgeState.organizationDocPath` (e.g., ``${edgeGlobal.edgeState.organizationDocPath}/things``). Organization is set via `projectSetOrg`/`edgeGlobal.setOrganization` and lives in `edgeGlobal.edgeState.currentOrganization`.
- For reads that should live-update, start a snapshot; for static one-off queries, use `new edgeFirebase.SearchStaticData().getData(path, query, order, limit)`. Clean up snapshots when appropriate.
- Auth state comes from `edgeFirebase.user` (see `edge/components/auth.vue` patterns). Use provided helpers instead of rolling your own auth flows.

## Preferred UI building blocks
- Lists/tables: use `edge-dashboard`. Pass `collection`, `filter`/`filters`, search/sort props, and point it at the org-scoped collection path. It handles snapshots, search, pagination, delete dialogs, and navigation to item routes.
- Editing/creation: use `edge-editor`. Provide `collection`, `docId` (`'new'` when creating), `newDocSchema` (fields with default values), and optional `schema`/overrides. It manages working copy, validation hooks, unsaved-change guards, and redirects.
- Surrounding layout: `pages/app.vue` already wires the sidebar, menu, and panels. Put new dashboard/edit pages under `/pages/app/dashboard/...` and keep them lean—compose existing Edge components rather than building new scaffolding.
- Form controls: prefer the Edge shadcn wrappers in `edge/components/shad` (e.g., `edge-shad-input`, `edge-shad-select`, `edge-shad-button`) and specialized controls like `edge-g-input`, `edge-auto-file-upload`, etc., instead of raw HTML inputs.

## Typical collection pattern
```vue
<script setup>
const edgeFirebase = inject('edgeFirebase')
const route = useRoute()

const collection = 'things'
const docId = computed(() => route.params.docId || 'new')

const newDocSchema = {
  name: { value: '' },
  description: { value: '' },
}
</script>

<template>
  <edge-dashboard
    v-if="!route.params.docId"
    :collection="collection"
    class="h-full"
    header-class="bg-secondary"
  />

  <edge-editor
    v-else
    :collection="collection"
    :doc-id="docId"
    :new-doc-schema="newDocSchema"
  />
</template>
```
Adjust props (search, filters, pagination, save overrides) using the existing component APIs rather than reinventing logic.

### Slots and layout flexibility
- Both `edge-dashboard` and `edge-editor` expose many slots (headers, footers, actions, item rendering, etc.)—use them to build richer UI without replacing the core components. You can significantly change look/behavior via slots while keeping Edge logic intact.
- Dashboard and editor don’t need to live on the same page; feel free to separate list/detail routes or co-locate them as needed, but always compose using the Edge components.
- Nuxt page structure can be rearranged to meet requirements, as long as navigation/layout still leans on the shared Edge tools (sidebar/menu, shadcn components, dashboard/editor, cms pieces).

## Routing, state, and menus
- Organization-aware pages assume `edgeGlobal.edgeState.currentOrganization` is set; if you need menu items, extend `edgeGlobal.edgeState.menuItems` (see `pages/app.vue`).
- Use `useState('auth')` and other Nuxt composables already present for global auth/route handling. Keep SSR considerations minimal (app runs client-side).

## Shadcn usage
- shadcn components live under `components/ui` and Edge-wrapped variants under `edge/components/shad`. Prefer the Edge variants to keep styling consistent and take advantage of shared props/slots.
- Styling: stick to Tailwind utility classes alongside the Edge components; when building new components, use Tailwind + `cn` for class composition instead of custom CSS where possible.

## CMS Block System Contract
- Treat the Block Editor help in `edge/components/cms/blockEditor.vue` as the source-of-truth for CMS block behavior.
- A block is HTML plus special tags; tags with a `field` create editable inputs.
- Only triple-brace tags create CMS inputs (for example `{{{#text ...}}}`); plain `{{...}}` placeholders do not.
- Tag config must be valid JSON (double quotes, commas, and exact opening/closing tag format).
- `field` is the stored key, `value` is the default, and `title` is the editor label.
- Field order in the editor follows first appearance order in the template.
- On edit, template meta and stored meta are merged; persisted filters/limits should be preserved.
- If a field is removed from template markup, existing stored data remains and returns when the field is added back.

### Block fields and rendering
- Core field types used by CMS blocks: `text`, `textarea`, `richtext`, `number`, `image`, `array`.
- `text` and `textarea` are HTML-escaped on render.
- `richtext` renders as HTML.
- Inline formatter output is HTML-escaped by default.
- Image field values store URL strings; optional `tags` limits media picker scope.
- Validation supports `required`, `min`, `max` (numeric bounds for numbers, length/count for text/arrays).
- Preview behavior: empty fields use placeholders; empty arrays may show sample items.
- The JSON Field Editor is line-driven in the code editor and is the preferred fix path for broken tag JSON.

### Inline formatter support
- Supported formatters: `date`, `datetime`, `money`, `lower`, `upper`, `trim`, `slug`, `title`, `deslug`, `default`.
- Use inline formatters directly in placeholders (for example `{{ date(post.publishDate) }}`).
- Existing schema/meta formatting behavior remains valid alongside inline formatters.

### Array blocks
- Manual arrays can use scalar values or object schemas; supported schema field types include `text`, `textarea`, `richtext`, `image`, `number`, `option`.
- Manual array UI includes add, reorder, and delete controls; `limit` caps rendered item count.
- Array loop aliases use `as` (for example `{{{#array {"field":"items","as":"card"}}}}`).
- Use `subarray` for nested arrays and `entries` for object key/value iteration.
- Use `renderBlocks` when an item contains nested CMS block content (for example post body content).

### Array data loading (Firestore/API)
- Firestore arrays use `collection` config with `path`, `uniqueKey`, `query`, `order`, `limit`.
- `path` is org-scoped under `organizations/{orgId}`.
- `uniqueKey` supports template tokens like `{orgId}` and `{siteId}`.
- API arrays use `api`, optional `apiQuery`, and `apiField`.
- `queryOptions` creates CMS filter controls; selected values are stored in `meta.queryItems`.
- Loading state tokens are supported while async array data resolves: `{{loading}}` and `{{loaded}}`.

### Array query execution model (critical)
- Each `queryItems` entry performs its own KV index lookup via `kvClient.queryIndex`.
- Query keys only work if the field is present in KV mirror config: include keys in `indexKeys`, and also in `metadataKeys` when needed for rendering/sorting.
- Multiple `queryItems` are unioned first (OR behavior at lookup stage).
- Candidate duplicates are removed by canonical key.
- `collection.query` then runs in JavaScript as final filtering (AND behavior across rules).
- `collection.order` sorts the filtered result set.
- Final output is written to `values[field]`.
- If load fails, runtime falls back to inline `value` or `[]` when no fallback value exists.

### Firestore index + KV mirror requirements
- Any Firestore compound query used by blocks (for example array contains + order) requires matching composite indexes in `firestore.indexes.json`.
- Fast CMS filtering requires KV mirroring in Functions with both index and metadata coverage.
- Mirror pattern example:
```js
exports.onListingWritten = createKvMirrorHandlerFromFields({
  documentPath: 'organizations/{orgId}/listings',
  uniqueKey: '{orgId}',
  indexKeys: ['name', 'city', 'state', 'status'],
  metadataKeys: ['name', 'city', 'state', 'status', 'price', 'doc_created_at'],
})
```

### Conditional/template logic
- `if/else` conditionals are supported in templates with `cond`.
- Array/subarray conditionals can reference `item.*` and alias objects.
- Supported conditional operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.

### CMS interactive helper systems
- Carousel blocks: runtime auto-inits Embla from `[data-carousel]` markup, with `[data-carousel-track]` and slide basis classes required.
- Carousel options are class/data-attribute driven (`data-carousel-autoplay`, interval, loop, fade, responsive `slides-to-scroll`).
- Carousel behavior details: when loop is off use trim snaps behavior, dot count is snap-based, controls/dots are rebuilt on `reInit`, and initialized roots are tagged (`data-embla="true"`).
- Nav blocks: runtime helper classes (`cms-nav-root`, `cms-nav-toggle`, `cms-nav-panel`) drive interactive menu behavior in preview/runtime.
- Nav helper classes also support folder dropdowns, sticky behavior, hide-on-scroll behavior, and left/right/center positioning.
- Nav class contract to remember: `cms-nav-root` + `cms-nav-toggle` + `cms-nav-panel` are required; `cms-nav-overlay`, `cms-nav-close`, `cms-nav-link`, `cms-nav-folder*`, `cms-nav-main`, `cms-nav-layout`, `cms-nav-logo`, `cms-nav-desktop` are optional hooks.
- Nav root attributes supported by runtime include: open state/class, close-on-link, position, scrolled/top class pairs, row class pairs, scroll threshold (default 10), hide-on-down toggles/thresholds/delta (defaults 80/6), and hidden/visible/transition class overrides.
- Form helpers: `form.cms-form` or `[data-cms-form]` submits to `/api/contact` with anti-bot checks and history tracking.
- Form helper hooks include required markers, submit trigger, and message containers; context IDs are inherited automatically from block wrapper.
- Form helper defaults: endpoint defaults to `/api/contact`; success/error/required copy and state classes are configurable through `data-cms-*` attributes; Block Editor preview is structure/UX only, not delivery verification.
- Scroll reveal helpers use class contracts (`sr`, `sr-group`, `sr-item`) plus utility classes for direction, duration, distance, stagger, viewport trigger, reset/cleanup, device targeting, easing, and optional callbacks.
- Scroll reveal defaults to remember: `origin: bottom`, `distance: 24px`, `duration: 700`, `viewFactor: 0.15`, `reset: false`, `cleanup: false`, `mobile: true`, `desktop: true`; callback hook classes map to `window.__srCallbacks`.

## Do/Don't
- Do reuse Edge components (`dashboard`, `editor`, `cms` blocks, auth widgets) before adding new ones.
- Do keep Firestore paths, queries, and role checks consistent with `edgeGlobal` helpers (`isAdminGlobal`, `getRoleName`, etc.).
- Do use the `edge-*.sh` scripts (like `edge-pull.sh` and `edge-components-update.sh`) to sync/update the `edge` subtree instead of manual edits.
- Don’t introduce TypeScript, Options API, raw Firebase SDK calls, or ad-hoc forms/tables when an Edge component exists.
- Don’t edit code inside the `edge` folder (including `edge/components/cms/*`) unless absolutely required and you have asked for and received user permission for that specific edit every time; it is a shared repo.
- If an `edge/*` change is unavoidable, keep it generic (no project-specific hacks) and call out the suggestion instead of making the edit when possible.
- Don’t modify `storage.rules` or `firestore.rules`.

## Firebase Functions guidance
- Review `functions/config.js`, `functions/edgeFirebase.js`, and `functions/cms.js` to mirror established patterns.
- Only edit `functions/config.js`, `functions/edgeFirebase.js`, or `functions/cms.js` when absolutely required and only after asking for and receiving user permission each time.
- When adding new cloud functions, create a new JS file under `functions/` and export handlers using the shared imports from `config.js`. Wire it up by requiring it in `functions/index.js` (same pattern as `stripe.js`), instead of modifying restricted files.
- For every `onCall` function, always enforce both checks up front: `request.auth?.uid` must exist, and `request.data?.uid` must exactly match `request.auth.uid`. Throw `HttpsError('unauthenticated', ...)` when auth is missing and `HttpsError('permission-denied', ...)` when the uid does not match.

## Public Publications Contract
- Public publication rendering is callable-only in this repo: `pages/publications/[org]/[pub].vue` should use `publicAccess-getOrgBySlug`, `publicAccess-getMagazineBySlug`, and `publicAccess-getArticles`, and should not rely on `/api/publications`.
- Organization docs should include Glossee-compatible profile fields maintained by `functions/organizations.js`: `docId`, `slug`, `about`, `location`, `logo_url`, `website`, `social_links`.
- `functions/publicAccess.js` is the source of truth for unauthenticated publication visibility (`published` + flipbook detection). Keep this logic centralized; do not duplicate access rules in page code.
- `functions/publications.js` controls KV mirroring/indexing for files. Preserve status/slug/name/flipbook indexes when refactoring.
- When changing any of these files, run:
  - `npm run test:publications-public-access`
  - `npm run test:model-import`
