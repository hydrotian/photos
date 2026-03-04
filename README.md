# Tian Zhou - Photography Portfolio

A modern, fast photography portfolio website built with SvelteKit and Tailwind CSS.

## Features

- 🚀 **Blazing Fast**: Static site generation with SvelteKit
- 📱 **Responsive**: Works beautifully on all devices
- 🎨 **Clean Design**: Minimalist gallery + category cover layout
- 🏷️ **Categories**: Dynamic category filters and album cover cards
- 📸 **Photo Details**: Display EXIF data, location, and description
- ↔️ **In-Category Navigation**: Previous/next arrows on photo detail pages
- 🌐 **GitHub Pages**: Free hosting

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding New Photos

This site now has an automated workflow for adding photos!

### Quick Workflow (Recommended)

1. **Export from Lightroom**: Export JPEG/WebP files into category folders under one root directory (for example `/path/to/LR_processed/Birds`, `/path/to/LR_processed/Travel`)
2. **Run the script**:
   ```bash
   npm run process-photos -- /path/to/LR_processed
   ```
3. **Optional auto git**:
   ```bash
   npm run process-photos -- /path/to/LR_processed --commit --push
   ```
4. **Edit metadata**: Optionally edit `src/lib/photo-data.json` to add locations/descriptions and choose category covers
5. **Build**: Run `npm run build` to rebuild the site

That's it! The script will:
- ✓ Name generated photos as `<category>_01`, `<category>_02`, ...
- ✓ Use the same generated name for `slug` and `title`
- ✓ Detect already imported files by source path (and legacy `category + slug`)
- ✓ Convert and resize full images to web-friendly WebP (`2400px` max edge, quality `82`)
- ✓ Create thumbnails automatically (800x800px, quality `82`)
- ✓ Extract EXIF data (camera, lens, settings, date)
- ✓ Organize photos into `static/images/<category>/` using source folder names
- ✓ Update the photo database
- ✓ Categories will appear automatically on the website

### Delete a Category Folder

To remove one category from the website assets and metadata:

```bash
npm run process-photos -- --delete-category 2024_China_Huangshan
```

Optional auto-commit and push:

```bash
npm run process-photos -- --delete-category 2024_China_Huangshan --commit --push
```

### Choose Album Cover Photo

Each category card on the homepage uses one cover image.

- Set `isCategoryCover: true` on the photo you want as that category's cover in `src/lib/photo-data.json`
- Keep at most one `isCategoryCover: true` per category
- If none is set, the category falls back to its default (latest photo in that category)

Example:

```json
{
  "slug": "2024_China_Huangshan_07",
  "category": "2024_China_Huangshan",
  "isCategoryCover": true
}
```

### Gallery Navigation Behavior

- Opening a photo from a category keeps category context via URL query (`?category=...`)
- Browser Back returns to that same category view
- Left/right arrow buttons on the detail page move through photos in the same category

### Manual Method

If you prefer to add photos manually:

1. Create a subfolder in `static/images/` with your category name (e.g., `static/images/landscape/`)
2. Add your full-size image as `photo-name.webp`
3. Add thumbnail as `photo-name-thumb.webp` (~800x800px)
4. Add entry to `src/lib/photo-data.json`:

```json
{
  "slug": "unique-slug",
  "title": "Photo Title",
  "date": "2024-01-15",
  "location": "Location Name",
  "category": "landscape",
  "thumbnail": "images/landscape/photo-thumb.webp",
  "image": "images/landscape/photo.webp",
  "description": "Optional description",
  "camera": "Optional camera info",
  "lens": "Optional lens info",
  "settings": "Optional camera settings",
  "isCategoryCover": false
}
```

## Image Optimization

Images are automatically optimized by the processing script:

- **Format**: WebP
- **Full images**: resized to max 2400x2400, quality 82
- **Thumbnails**: 800x800px, quality 82

## Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch.

### Quick Setup

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select "GitHub Actions"
3. Push to main branch
4. Site will be live at: `https://hydrotian.github.io/photos/`

**See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions and troubleshooting.**

## Structure

```
photos/
├── scripts/
│   └── process-photos.js        # Photo processing automation
├── src/
│   ├── lib/
│   │   └── photo-data.json      # Photo database (auto-generated)
│   ├── routes/
│   │   ├── +layout.svelte       # Main layout with nav/footer
│   │   ├── +page.svelte         # Gallery grid (dynamic categories)
│   │   ├── +page.ts             # Loads photos from JSON
│   │   ├── photo/[slug]/        # Individual photo pages
│   │   └── about/               # About page
│   ├── app.css                  # Tailwind styles
│   └── app.html                 # HTML template
├── static/
│   └── images/
│       ├── landscape/           # Category folders (auto-created)
│       ├── street/
│       └── nature/
├── temp-photos/                 # Drop WebP files here (gitignored)
└── package.json
```

See [WORKFLOW.md](WORKFLOW.md) for detailed photo upload instructions.

## License

© 2024 Tian Zhou. All rights reserved.
