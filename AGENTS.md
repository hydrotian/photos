# Repository Guidelines

## Project Structure & Module Organization
This is a SvelteKit static portfolio site.

- `src/routes/`: Page routes (`+page.svelte`, `+page.ts`, and dynamic route `photo/[slug]/`).
- `src/lib/photo-data.json`: Canonical photo metadata used to render the gallery.
- `scripts/process-photos.js`: CLI helper to import `.webp` files, create thumbnails, and update metadata.
- `static/images/<category>/`: Full-size images and `-thumb.webp` thumbnails served as static assets.
- `temp-photos/`: Local staging folder for new exports before processing (not committed).
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy pipeline.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start local dev server (Vite).
- `npm run check`: Run Svelte/TypeScript checks (`svelte-check`).
- `npm run build`: Build static output into `build/` for production.
- `npm run preview`: Preview the production build locally.
- `npm run process-photos`: Process files from `temp-photos/` into `static/images/` and update `src/lib/photo-data.json`.

Example flow:
```bash
npm run process-photos
npm run check
npm run build
```

## Coding Style & Naming Conventions
- Follow existing SvelteKit + TypeScript style with tabs for indentation.
- Use PascalCase for TypeScript interfaces/types (for example, `Photo`), camelCase for variables/functions, and kebab-case for image slugs/files.
- Keep route conventions standard (`+page.svelte`, `+page.ts`, `+layout.svelte`).
- No dedicated formatter/linter is configured; match surrounding style and keep imports/type usage clean.

## Testing Guidelines
- There is no dedicated unit test framework in this repository currently.
- Minimum validation for each change: run `npm run check` and `npm run build` before opening a PR.
- For photo ingestion changes, also run `npm run process-photos` on sample files and verify gallery/detail pages locally.

## Commit & Pull Request Guidelines
- Prefer short, imperative commit messages (for example, `Add category filter`, `Fix static build error`).
- Avoid placeholder commits like `test`; squash noisy iterative commits before merge when possible.
- PRs should include:
  - What changed and why.
  - Any data/content updates (`src/lib/photo-data.json`, `static/images/...`).
  - Screenshots for UI-visible changes (gallery, filters, photo detail pages).
  - Confirmation that `npm run check` and `npm run build` pass.
