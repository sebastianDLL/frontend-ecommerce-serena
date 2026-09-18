## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Copy `.env.example` to `.env` before running the dev server (`PUBLIC_API_URL` is required and validated
by the env schema in `astro.config.mjs`).

## Architecture

Read `README.md` for the full architecture. Key rules:

- Static content lives in `.astro` components (zero JS). Interactive UI lives in Vue islands under
  `src/components/catalog` and `src/components/cart`, hydrated with `client:visible` / `client:idle`.
- Never call `fetch` inside components: use the typed client in `src/lib/api.ts`.
- Shared state lives in `src/stores` (module-scope reactive singletons shared across islands). Cart
  persistence is hydrated on mount, not at module load, to keep SSR hydration stable.
- Overlays rendered from the sticky header must be teleported to `body` (the header uses
  `backdrop-filter`, which breaks `position: fixed` descendants).

## Verification

Run before finishing any change:

```
npm run check
npm run build
npm run lint
```

**Do not run `npm run build` while the background dev server is running.** The Astro/Vite build
regenerates `node_modules/.vite/deps` with production settings, and the dev server then serves a Vue
bundle without `__VUE_HMR_RUNTIME__`. The symptom is `[astro-island] Error hydrating ... ReferenceError:
__VUE_HMR_RUNTIME__ is not defined`, islands stay unhydrated (catalog stuck on "Preparando la
colección...") and the site looks disconnected from the API.

If it happens, recover with:

```
astro dev stop
Remove-Item -Recurse -Force node_modules\.vite
astro dev --background
```

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
