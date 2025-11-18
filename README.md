# Tian Zhou - Photography Portfolio

A modern, fast photography portfolio website built with SvelteKit and Tailwind CSS.

## Features

- 🚀 **Blazing Fast**: Static site generation with SvelteKit
- 📱 **Responsive**: Works beautifully on all devices
- 🎨 **Clean Design**: Minimalist gallery layout
- 🏷️ **Categories**: Filter photos by landscape, street, nature
- 📸 **Photo Details**: Display EXIF data, location, and description
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

1. **Export from Lightroom**: Export your photos as full-size WebP files
2. **Place in temp folder**: Put all WebP files in the `temp-photos/` directory
3. **Run the script**:
   ```bash
   npm run process-photos
   ```
4. **Enter category**: When prompted, enter the category name (e.g., landscape, street, nature, travel)
5. **Edit metadata**: Optionally edit `src/lib/photo-data.json` to add locations and descriptions
6. **Build**: Run `npm run build` to rebuild the site

That's it! The script will:
- ✓ Create thumbnails automatically (800x800px)
- ✓ Extract EXIF data (camera, lens, settings, date)
- ✓ Organize photos into category folders
- ✓ Update the photo database
- ✓ Categories will appear automatically on the website

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
  "settings": "Optional camera settings"
}
```

## Image Optimization

Images are automatically optimized by the processing script:

- **Format**: WebP (25-30% smaller than JPEG)
- **Thumbnails**: 800x800px, quality 85
- **Full images**: Keep original size from Lightroom export

## Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch.

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main branch

Your site will be available at: `https://hydrotian.github.io/photos/`

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
