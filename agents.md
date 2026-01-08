# Edge App Agent Guide

This project is Nuxt 3 + Vue 3, SPA mode. Follow these rules so new code matches how we already build apps.

## Core stack and style
- Use `<script setup>` with JavaScript only (no TypeScript, no Options API).
- Components and composables from `edge/composables/**` are auto-imported; avoid manual imports unless needed.
- Utilities: use `cn` from `@/lib/utils` for class merging, `lucide-vue-next` for icons, Tailwind for layout/styling. Keep comments minimal and useful.
- Components under `edge/components` are globally registered with the `edge-` prefix (e.g., `edge-dashboard`, `edge-editor`, `edge-shad-button`).

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

## Do/Don't
- Do reuse Edge components (`dashboard`, `editor`, `cms` blocks, auth widgets) before adding new ones.
- Do keep Firestore paths, queries, and role checks consistent with `edgeGlobal` helpers (`isAdminGlobal`, `getRoleName`, etc.).
- Do use the `edge-*.sh` scripts (like `edge-pull.sh` and `edge-components-update.sh`) to sync/update the `edge` subtree instead of manual edits.
- Don’t introduce TypeScript, Options API, raw Firebase SDK calls, or ad-hoc forms/tables when an Edge component exists.
- Don’t edit code inside the `edge` folder unless absolutely required; it is a shared repo. If a change is unavoidable, keep it generic (no project-specific hacks) and call out the suggestion instead of making the edit when possible.
- Don’t modify `storage.rules` or `firestore.rules`.

## Firebase Functions guidance
- Review `functions/config.js`, `functions/edgeFirebase.js`, and `functions/cms.js` to mirror established patterns, but do not edit those files.
- When adding new cloud functions, create a new JS file under `functions/` and export handlers using the shared imports from `config.js`. Wire it up by requiring it in `functions/index.js` (same pattern as `stripe.js`), instead of modifying restricted files.
