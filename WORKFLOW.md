# Photo Upload Workflow Guide

This guide explains how to easily add photos to your photography portfolio website.

## Overview

The workflow is designed to be simple:
1. Export photos from Lightroom (JPEG/WebP)
2. Place them in category subfolders under one root folder
3. Run a script with that root path
4. Done

## Prerequisites

First time setup:

```bash
npm install
```

This installs the required dependencies:
- `sharp` - for image resizing
- `exifr` - for EXIF data extraction

## Step-by-Step Workflow

### 1. Export from Lightroom

In Adobe Lightroom:
1. Select the photos you want to publish
2. File → Export
3. Export settings:
   - **Format**: JPEG or WebP
   - **Quality**: 85-95
   - **Size**: Original export is fine (script will resize for web)
   - **Sharpening**: Output sharpening for screen
4. Export to category folders under a single root path, for example:
   - `/path/to/LR_processed/Birds`
   - `/path/to/LR_processed/Travel`
   - `/path/to/LR_processed/2025_China_trip`

### 2. Run the Processing Script

```bash
npm run process-photos -- /path/to/LR_processed
```

The script will:
- Scan each first-level subfolder as a category
- Find supported image files recursively (`.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff`, `.heic`, `.heif`)
- Detect existing photos by `category + slug` and skip them
- For each new photo:
  - Create resized full image as WebP (max 2400x2400, quality 82)
  - Create thumbnail as WebP (`-thumb.webp`, 800x800, quality 82)
  - Extract EXIF data (camera, lens, settings, date)
  - Write images to `static/images/{category}/`
  - Add an entry to `src/lib/photo-data.json`

Optional auto-commit and push:
```bash
npm run process-photos -- /path/to/LR_processed --commit --push
```

To delete one category from `static/images/` and remove matching entries from `photo-data.json`:
```bash
npm run process-photos -- --delete-category 2024_China_Huangshan
```

### 3. Review and Edit Metadata

Open `src/lib/photo-data.json` and add:
- **location**: Where the photo was taken
- **description**: A brief description of the photo
- **title**: Edit the auto-generated title if needed

Example entry:
```json
{
  "slug": "mountain-sunrise",
  "title": "Mountain Sunrise",
  "date": "2024-01-15",
  "location": "Mount Rainier National Park",
  "category": "landscape",
  "thumbnail": "images/landscape/mountain-sunrise-thumb.webp",
  "image": "images/landscape/mountain-sunrise.webp",
  "description": "Golden light illuminating the snow-covered peaks",
  "camera": "Canon EOS R5",
  "lens": "24-70mm f/2.8",
  "settings": "ISO 100, f/8, 1/250s, 45mm"
}
```

### 4. Test Locally

```bash
npm run dev
```

Open http://localhost:5173 to preview your changes.

### 5. Build and Deploy

```bash
npm run build
```

Commit and push your changes. The site will automatically deploy via GitHub Actions.

## Directory Structure

After processing, your structure will look like:

```
photos/
├── temp-photos/              # Legacy mode staging folder (optional)
├── static/
│   └── images/
│       ├── landscape/        # Category folders
│       │   ├── mountain-sunrise.webp
│       │   ├── mountain-sunrise-thumb.webp
│       │   ├── forest-path.webp
│       │   └── forest-path-thumb.webp
│       ├── street/
│       └── nature/
└── src/
    └── lib/
        └── photo-data.json   # Auto-updated by script
```

## Categories

Categories are automatically detected from the folder structure in `static/images/`.

Common categories:
- `landscape` - Scenic landscapes
- `street` - Street photography
- `nature` - Wildlife and nature
- `portrait` - Portraits
- `travel` - Travel photography
- `architecture` - Buildings and structures
- `abstract` - Abstract photos

You can create any category name you want - they'll appear automatically on the website with proper capitalization.

## Tips

### Batch Processing
You can add multiple photos at once across many categories by placing them under one source root path and running the script once.

### Multiple Categories
The script automatically handles multiple categories in one run from subfolders in the source root.

### Cleaning Up
Keep originals outside this repository (recommended). Only optimized WebP outputs should be committed to reduce repo size and page load times.

### EXIF Data
The script automatically extracts:
- Camera make and model
- Lens model
- ISO, aperture, shutter speed, focal length
- Date taken
- GPS coordinates (if available)

### Image Sizes
- **Full images**: Auto-resized to max 2400x2400, quality 82
- **Thumbnails**: Auto-generated at 800x800, quality 82
- **Format**: WebP output for all generated files

## Troubleshooting

### Script won't run
Make sure you've installed dependencies:
```bash
npm install
```

### No EXIF data extracted
Some exported images may not contain EXIF data. You can manually add camera info to the JSON file.

### Images not showing
- Check that the file paths in `photo-data.json` match the actual files
- Ensure category folders exist in `static/images/`
- Verify image files are valid WebP format

### Categories not appearing
Categories are dynamically loaded from the photos in `photo-data.json`. Make sure:
- Your JSON file is valid (no trailing commas)
- Photos have the `category` field set
- You've rebuilt the site with `npm run build`

## Advanced: Editing the Script

The processing script is located at `scripts/process-photos.js`.

You can customize:
- **Full image size/quality**: Update `FULL_MAX_WIDTH`, `FULL_MAX_HEIGHT`, and `FULL_QUALITY`
- **Thumbnail size/quality**: Update `THUMB_WIDTH`, `THUMB_HEIGHT`, and `THUMB_QUALITY`
- **Supported file types**: Edit `SUPPORTED_EXTENSIONS`
- **EXIF fields**: Edit the `pick` list in `extractExif()`

## Questions?

Open an issue on GitHub or refer to the main README.md for more information.
