#!/usr/bin/env node

/**
 * Photo Processing Script
 *
 * This script processes full-size webp images and:
 * 1. Creates thumbnail versions (-thumb.webp)
 * 2. Extracts EXIF data
 * 3. Organizes photos into category folders
 * 4. Updates the photo data file
 *
 * Usage:
 *   node scripts/process-photos.js
 *
 * Put your full-size webp files in ./temp-photos/ folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp-photos');
const STATIC_IMAGES_DIR = path.join(__dirname, '../static/images');
const DATA_FILE = path.join(__dirname, '../src/lib/photo-data.json');
const THUMB_WIDTH = 800;
const THUMB_HEIGHT = 800;

// Ensure directories exist
function ensureDirExists(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

// Get category from user
async function promptCategory() {
	const readline = await import('readline');
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question('Enter category for these photos (e.g., landscape, street, nature): ', (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase());
		});
	});
}

// Generate slug from filename
function generateSlug(filename) {
	return filename
		.replace(/\.webp$/i, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

// Extract EXIF data
async function extractExif(filepath) {
	try {
		const exif = await exifr.parse(filepath, {
			pick: ['DateTimeOriginal', 'Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength', 'GPSLatitude', 'GPSLongitude']
		});

		if (!exif) return {};

		const camera = exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : undefined;
		const lens = exif.LensModel;

		let settings = [];
		if (exif.ISO) settings.push(`ISO ${exif.ISO}`);
		if (exif.FNumber) settings.push(`f/${exif.FNumber}`);
		if (exif.ExposureTime) {
			const shutter = exif.ExposureTime < 1 ? `1/${Math.round(1/exif.ExposureTime)}s` : `${exif.ExposureTime}s`;
			settings.push(shutter);
		}
		if (exif.FocalLength) settings.push(`${Math.round(exif.FocalLength)}mm`);

		const date = exif.DateTimeOriginal ? exif.DateTimeOriginal.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

		return {
			camera,
			lens,
			settings: settings.length > 0 ? settings.join(', ') : undefined,
			date
		};
	} catch (error) {
		console.warn(`Could not extract EXIF from ${filepath}:`, error.message);
		return {};
	}
}

// Create thumbnail
async function createThumbnail(inputPath, outputPath) {
	await sharp(inputPath)
		.resize(THUMB_WIDTH, THUMB_HEIGHT, {
			fit: 'cover',
			position: 'center'
		})
		.webp({ quality: 85 })
		.toFile(outputPath);
}

// Process a single photo
async function processPhoto(filename, category) {
	const inputPath = path.join(TEMP_DIR, filename);
	const slug = generateSlug(filename);

	// Create category folder
	const categoryDir = path.join(STATIC_IMAGES_DIR, category);
	ensureDirExists(categoryDir);

	// Output paths
	const fullImageName = `${slug}.webp`;
	const thumbImageName = `${slug}-thumb.webp`;
	const fullImagePath = path.join(categoryDir, fullImageName);
	const thumbImagePath = path.join(categoryDir, thumbImageName);

	console.log(`Processing ${filename}...`);

	// Copy full image
	fs.copyFileSync(inputPath, fullImagePath);
	console.log(`  ✓ Copied full image to ${category}/${fullImageName}`);

	// Create thumbnail
	await createThumbnail(inputPath, thumbImagePath);
	console.log(`  ✓ Created thumbnail ${category}/${thumbImageName}`);

	// Extract EXIF
	const exifData = await extractExif(inputPath);
	console.log(`  ✓ Extracted EXIF data`);

	return {
		slug,
		title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
		date: exifData.date || new Date().toISOString().split('T')[0],
		location: '', // User should fill this manually
		category,
		thumbnail: `images/${category}/${thumbImageName}`,
		image: `images/${category}/${fullImageName}`,
		description: '', // User should fill this manually
		camera: exifData.camera,
		lens: exifData.lens,
		settings: exifData.settings
	};
}

// Load existing photo data
function loadPhotoData() {
	if (fs.existsSync(DATA_FILE)) {
		return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
	}
	return [];
}

// Save photo data
function savePhotoData(photos) {
	ensureDirExists(path.dirname(DATA_FILE));
	fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

// Main function
async function main() {
	console.log('Photo Processing Script\n');

	// Check if temp directory exists
	if (!fs.existsSync(TEMP_DIR)) {
		console.log(`Creating temp directory: ${TEMP_DIR}`);
		ensureDirExists(TEMP_DIR);
		console.log('\nPlease add your full-size .webp files to the temp-photos/ directory');
		console.log('Then run this script again.');
		return;
	}

	// Get all webp files
	const files = fs.readdirSync(TEMP_DIR).filter(f => f.toLowerCase().endsWith('.webp'));

	if (files.length === 0) {
		console.log('No .webp files found in temp-photos/ directory');
		console.log('Please add your photos and run again.');
		return;
	}

	console.log(`Found ${files.length} photo(s) to process\n`);

	// Get category
	const category = await promptCategory();
	if (!category) {
		console.log('Category is required. Exiting.');
		return;
	}

	console.log(`\nProcessing photos into category: ${category}\n`);

	// Load existing data
	const existingPhotos = loadPhotoData();
	const newPhotos = [];

	// Process each file
	for (const file of files) {
		const photoData = await processPhoto(file, category);
		newPhotos.push(photoData);
	}

	// Merge with existing photos (avoid duplicates by slug)
	const existingSlugs = new Set(existingPhotos.map(p => p.slug));
	const photosToAdd = newPhotos.filter(p => !existingSlugs.has(p.slug));
	const updatedPhotos = [...existingPhotos, ...photosToAdd];

	// Save updated data
	savePhotoData(updatedPhotos);

	console.log(`\n✓ Successfully processed ${newPhotos.length} photo(s)`);
	console.log(`✓ Photo data saved to ${DATA_FILE}`);
	console.log(`\nYou can now delete or move the files from temp-photos/`);
	console.log('\nNote: Remember to add location and description to your photos in the data file!');
}

main().catch(console.error);
