# Tian Zhou — Photography Portfolio

A static photography portfolio built with SvelteKit and Tailwind CSS. Deployed automatically to GitHub Pages on every push to `main`.

**Live site:** https://hydrotian.github.io/photos/

---

## Features

- Static site — no server, no runtime API calls
- Category-based gallery with album cover cards
- Photo detail pages with EXIF data, location, and prev/next navigation
- Interactive map on photo detail pages when GPS data is present
- Automated photo import from Lightroom exports: resizes, converts to WebP, extracts EXIF, reverse-geocodes GPS coordinates

---

## Local Development

```bash
npm install       # install dependencies
npm run dev       # dev server at http://localhost:5173
npm run check     # TypeScript/Svelte type checks
npm run build     # production build into build/
npm run preview   # preview the production build
```

---

## Photo Import

### 1. Import photos from Lightroom exports

Organize exports into category subfolders under one root directory:

```
/path/to/LR_processed/
├── Birds/
│   ├── IMG_001.jpg
│   └── IMG_002.jpg
└── Travel/
    └── IMG_003.jpg
```

Then run:

```bash
npm run process-photos -- /path/to/LR_processed
```

Each first-level subfolder becomes a category. The script:
- Converts and resizes images to WebP (full: max 2400px, quality 82; thumb: 800×800, quality 82)
- Names files sequentially: `Birds_01.webp`, `Birds_02.webp`, ...
- Extracts EXIF: camera, lens, ISO/aperture/shutter/focal length, date taken
- Extracts GPS coordinates and reverse-geocodes them to a location name (e.g. `"Portland, United States"`)
- Skips already-imported photos (tracked by source path)
- Updates `src/lib/photo-data.json`

### 2. Fill GPS for a category imported without GPS

If photos were imported before GPS extraction was added, or your camera didn't record coordinates:

```bash
npm run process-photos -- --fill-gps Birds --lat 45.5051 --lng -122.6750
```

This sets `lat`/`lng` on all photos in the category that are missing them, and reverse-geocodes once to fill `location` on any photo where it was empty.

### 3. Delete a category

Removes images from `static/images/<category>/` and all matching entries from `photo-data.json`:

```bash
npm run process-photos -- --delete-category 2024_China_Huangshan
```

### 4. Set an album cover

On the homepage, each category shows a cover card. By default the first photo in the category is used. Use the `set-cover` script to change it:

```bash
# List all categories and their current covers
npm run set-cover

# List photos in a category and pick interactively
npm run set-cover -- Birds

# Set directly if you know the slug
npm run set-cover -- Birds Birds_07
```

The interactive mode shows each photo's slug, title, and thumbnail filename so you can find and preview the image. The choice is stored as `isCategoryCover: true` in `photo-data.json` and survives future photo imports.

### 5. Manually edit metadata

After import, open `src/lib/photo-data.json` to add or edit:
- `location` — human-readable place name (auto-filled from GPS if available)
- `description` — caption shown on the photo detail page
- `title` — defaults to the generated filename; edit freely

---

## Deployment

Push to `main` — GitHub Actions builds and deploys automatically.

**One-time setup:**
1. Repository **Settings** → **Pages** → Source: **GitHub Actions**
2. **Settings** → **Actions** → **General** → Workflow permissions: **Read and write**

The workflow runs `npm run build` and publishes the `build/` folder. Takes ~2 minutes.

---

## File Structure

```
photos/
├── scripts/
│   ├── process-photos.js     # photo import CLI
│   └── set-cover.js          # album cover picker CLI
├── src/
│   ├── lib/
│   │   └── photo-data.json   # photo database (source of truth)
│   └── routes/
│       ├── +page.svelte      # gallery homepage
│       ├── +page.ts          # data loader + Photo/CategoryCover types
│       ├── photo/[slug]/     # photo detail page
│       └── about/
├── static/
│   └── images/
│       └── <category>/       # WebP images + thumbnails (auto-created)
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Pages deployment
```

---

© Tian Zhou. All rights reserved.
