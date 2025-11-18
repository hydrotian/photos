# Photo Upload Workflow Guide

This guide explains how to easily add photos to your photography portfolio website.

## Overview

The workflow is designed to be simple:
1. Export photos from Lightroom as WebP
2. Drop them in a temp folder
3. Run a script
4. Done!

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
   - **Format**: WebP
   - **Quality**: 90-95
   - **Size**: Your preference (recommended: 2000-3000px on longest side)
   - **Sharpening**: Output sharpening for screen
4. Export to your `temp-photos/` folder in this project

### 2. Run the Processing Script

```bash
npm run process-photos
```

The script will:
- Find all `.webp` files in `temp-photos/`
- Ask you for a category name (e.g., "landscape", "street", "nature", "travel")
- For each photo:
  - Create an 800x800px thumbnail with `-thumb.webp` suffix
  - Extract EXIF data (camera, lens, settings, date)
  - Copy both files to `static/images/{category}/`
  - Add an entry to `src/lib/photo-data.json`

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
├── temp-photos/              # Put exported WebP files here
│   ├── photo1.webp
│   └── photo2.webp
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
You can add multiple photos at once. Just put all the WebP files in `temp-photos/` before running the script. They'll all be assigned to the same category.

### Multiple Categories
To add photos to different categories:
1. Add first batch to `temp-photos/`
2. Run `npm run process-photos` and enter first category
3. Move/delete processed files from `temp-photos/`
4. Add second batch
5. Run script again with second category

### Cleaning Up
After processing, you can delete the files from `temp-photos/` or keep them as originals. The folder is in `.gitignore` so it won't be committed to git.

### EXIF Data
The script automatically extracts:
- Camera make and model
- Lens model
- ISO, aperture, shutter speed, focal length
- Date taken
- GPS coordinates (if available)

### Image Sizes
- **Full images**: Keep at reasonable size (2000-3000px, ~200-800KB)
- **Thumbnails**: Auto-generated at 800x800px, quality 85
- **Format**: WebP provides excellent quality at 25-30% smaller file size than JPEG

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
- **Thumbnail size**: Change `THUMB_WIDTH` and `THUMB_HEIGHT` (line 19-20)
- **Thumbnail quality**: Modify `.webp({ quality: 85 })` (line 95)
- **EXIF fields**: Add more fields in the `extractExif` function (line 58)
- **Slug generation**: Customize filename-to-slug conversion (line 50)

## Questions?

Open an issue on GitHub or refer to the main README.md for more information.
