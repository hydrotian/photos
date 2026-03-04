#!/usr/bin/env node

/**
 * Photo processing script.
 *
 * New mode (recommended):
 *   node scripts/process-photos.js /path/to/LR_processed [--commit] [--push]
 *   node scripts/process-photos.js --delete-category <category> [--commit] [--push]
 *
 * Legacy mode:
 *   node scripts/process-photos.js
 *
 * In new mode:
 * - Each first-level folder under source root becomes a website category.
 * - New photos are detected by source path (plus legacy category+slug fallback).
 * - Full images are resized/compressed to web-friendly WebP output.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.join(__dirname, '..');

const TEMP_DIR = path.join(REPO_ROOT, 'temp-photos');
const STATIC_IMAGES_DIR = path.join(REPO_ROOT, 'static/images');
const DATA_FILE = path.join(REPO_ROOT, 'src/lib/photo-data.json');

const THUMB_WIDTH = 800;
const THUMB_HEIGHT = 800;
const FULL_MAX_WIDTH = 2400;
const FULL_MAX_HEIGHT = 2400;
const FULL_QUALITY = 82;
const THUMB_QUALITY = 82;
const SUPPORTED_EXTENSIONS = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.tif',
	'.tiff',
	'.heic',
	'.heif'
]);

function ensureDirExists(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function todayISO() {
	return new Date().toISOString().split('T')[0];
}

function categorySlug(category) {
	return category.trim();
}

function photoKey(category, slug) {
	return `${category}::${slug}`;
}

function generateSlug(filename) {
	return path.basename(filename, path.extname(filename))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function sourceKey(category, sourcePath) {
	return `${category}::${sourcePath.toLowerCase()}`;
}

function toPosixPath(inputPath) {
	return inputPath.replace(/\\/g, '/');
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractCategoryIndex(category, value) {
	if (typeof value !== 'string') return 0;
	const pattern = new RegExp(`^${escapeRegExp(category)}_(\\d+)$`);
	const match = value.match(pattern);
	if (!match) return 0;
	const parsed = Number.parseInt(match[1], 10);
	return Number.isNaN(parsed) ? 0 : parsed;
}

function buildCategoryCounters(existingPhotos) {
	const counters = new Map();

	for (const photo of existingPhotos) {
		const category = photo.category;
		if (!category) continue;

		const slugIndex = extractCategoryIndex(category, String(photo.slug || ''));
		const imageStem = typeof photo.image === 'string'
			? path.basename(photo.image, path.extname(photo.image))
			: '';
		const imageIndex = extractCategoryIndex(category, imageStem);
		const maxIndex = Math.max(slugIndex, imageIndex);

		if (maxIndex > (counters.get(category) || 0)) {
			counters.set(category, maxIndex);
		}
	}

	return counters;
}

function nextGeneratedName(category, counters) {
	const nextIndex = (counters.get(category) || 0) + 1;
	counters.set(category, nextIndex);
	return `${category}_${String(nextIndex).padStart(2, '0')}`;
}

function buildExistingSourceKeys(existingPhotos) {
	const keys = new Set();

	for (const photo of existingPhotos) {
		if (typeof photo.sourcePath === 'string' && photo.sourcePath) {
			keys.add(sourceKey(photo.category, photo.sourcePath));
		}
	}

	return keys;
}

function parseArgs(rawArgs) {
	const args = [...rawArgs];
	let sourceRoot = null;
	let deleteCategory = null;
	let shouldCommit = false;
	let shouldPush = false;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];

		if (arg === '--commit') {
			shouldCommit = true;
			continue;
		}
		if (arg === '--push') {
			shouldPush = true;
			shouldCommit = true;
			continue;
		}
		if (arg === '--delete-category' || arg === '--delete-folder') {
			const nextValue = args[i + 1] || null;
			if (!nextValue || nextValue.startsWith('-')) {
				throw new Error(`${arg} requires a category value.`);
			}
			deleteCategory = nextValue;
			i += 1;
			continue;
		}
		if (arg.startsWith('--delete-category=')) {
			deleteCategory = arg.slice('--delete-category='.length) || null;
			continue;
		}
		if (arg.startsWith('--delete-folder=')) {
			deleteCategory = arg.slice('--delete-folder='.length) || null;
			continue;
		}
		if (!arg.startsWith('-') && !sourceRoot) {
			sourceRoot = arg;
			continue;
		}
		if (arg === '--help' || arg === '-h') {
			printUsage();
			process.exit(0);
		}
		if (arg.startsWith('-')) {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	return {
		sourceRoot,
		deleteCategory,
		shouldCommit,
		shouldPush
	};
}

function printUsage() {
	console.log('Usage:');
	console.log('  node scripts/process-photos.js /path/to/LR_processed [--commit] [--push]');
	console.log('  node scripts/process-photos.js --delete-category <category> [--commit] [--push]');
	console.log('  node scripts/process-photos.js');
	console.log('');
	console.log('New mode expects first-level folders such as Birds/, Travel/, 2025_China_trip/.');
}

function loadPhotoData() {
	if (!fs.existsSync(DATA_FILE)) {
		return [];
	}

	const raw = fs.readFileSync(DATA_FILE, 'utf-8');
	try {
		return JSON.parse(raw);
	} catch (error) {
		throw new Error(`Failed to parse ${DATA_FILE}: ${error.message}`);
	}
}

function savePhotoData(photos) {
	ensureDirExists(path.dirname(DATA_FILE));
	fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

async function extractExif(filepath) {
	try {
		const exif = await exifr.parse(filepath, {
			pick: ['DateTimeOriginal', 'Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength']
		});

		if (!exif) {
			return {};
		}

		const camera = exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : undefined;
		const lens = exif.LensModel;

		const settings = [];
		if (exif.ISO) settings.push(`ISO ${exif.ISO}`);
		if (exif.FNumber) settings.push(`f/${exif.FNumber}`);
		if (exif.ExposureTime) {
			const shutter = exif.ExposureTime < 1
				? `1/${Math.round(1 / exif.ExposureTime)}s`
				: `${exif.ExposureTime}s`;
			settings.push(shutter);
		}
		if (exif.FocalLength) settings.push(`${Math.round(exif.FocalLength)}mm`);

		return {
			camera,
			lens,
			settings: settings.length > 0 ? settings.join(', ') : undefined,
			date: exif.DateTimeOriginal ? exif.DateTimeOriginal.toISOString().split('T')[0] : undefined
		};
	} catch (error) {
		console.warn(`Could not extract EXIF from ${filepath}: ${error.message}`);
		return {};
	}
}

async function writeWebOutputs(inputPath, fullOutputPath, thumbOutputPath) {
	await sharp(inputPath)
		.rotate()
		.resize({
			width: FULL_MAX_WIDTH,
			height: FULL_MAX_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: FULL_QUALITY })
		.toFile(fullOutputPath);

	await sharp(inputPath)
		.rotate()
		.resize(THUMB_WIDTH, THUMB_HEIGHT, {
			fit: 'cover',
			position: 'center'
		})
		.webp({ quality: THUMB_QUALITY })
		.toFile(thumbOutputPath);
}

function isSupportedImage(filePath) {
	return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function listTopLevelCategoryDirs(sourceRoot) {
	const entries = fs.readdirSync(sourceRoot, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));
}

function listFilesRecursive(dir) {
	const out = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...listFilesRecursive(fullPath));
			continue;
		}
		if (entry.isFile() && isSupportedImage(fullPath)) {
			out.push(fullPath);
		}
	}

	return out.sort((a, b) => a.localeCompare(b));
}

async function processPhotoFromPath({ inputPath, categoryRaw, generatedName, sourcePath }) {
	const category = categorySlug(categoryRaw);
	const slug = generatedName;

	const categoryDir = path.join(STATIC_IMAGES_DIR, category);
	ensureDirExists(categoryDir);

	const fullImageName = `${generatedName}.webp`;
	const thumbImageName = `${generatedName}-thumb.webp`;
	const fullImagePath = path.join(categoryDir, fullImageName);
	const thumbImagePath = path.join(categoryDir, thumbImageName);

	console.log(`Processing ${inputPath}`);

	await writeWebOutputs(inputPath, fullImagePath, thumbImagePath);
	const exifData = await extractExif(inputPath);

	return {
		key: photoKey(category, slug),
		photo: {
			slug,
			title: generatedName,
			date: exifData.date || todayISO(),
			location: '',
			category,
			thumbnail: `images/${category}/${thumbImageName}`,
			image: `images/${category}/${fullImageName}`,
			description: '',
			camera: exifData.camera,
			lens: exifData.lens,
			settings: exifData.settings,
			sourcePath
		}
	};
}

function normalizePath(inputPath) {
	if (!inputPath) return null;
	const expanded = inputPath.startsWith('~')
		? path.join(process.env.HOME || '', inputPath.slice(1))
		: inputPath;
	return path.resolve(expanded);
}

function runGit(args) {
	const result = spawnSync('git', args, {
		cwd: REPO_ROOT,
		encoding: 'utf-8'
	});

	if (result.status !== 0) {
		const stderr = result.stderr?.trim();
		const stdout = result.stdout?.trim();
		throw new Error(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ''}`);
	}

	return result.stdout?.trim() || '';
}

function maybeCommitAndPush({ shouldCommit, shouldPush, commitMessage }) {
	if (!shouldCommit) {
		return;
	}

	runGit(['add', 'src/lib/photo-data.json', 'static/images']);

	const staged = spawnSync('git', ['diff', '--cached', '--quiet', '--', 'src/lib/photo-data.json', 'static/images'], {
		cwd: REPO_ROOT
	});
	if (staged.status === 0) {
		console.log('No staged changes to commit.');
		return;
	}

	runGit(['commit', '-m', commitMessage, '--', 'src/lib/photo-data.json', 'static/images']);
	console.log(`Committed changes: ${commitMessage}`);

	if (shouldPush) {
		runGit(['push']);
		console.log('Pushed commit to remote.');
	}
}

function resolveCategoryPath(category) {
	if (category.includes('/') || category.includes('\\')) {
		throw new Error(`Category should be a single folder name, got: ${category}`);
	}

	const target = path.resolve(STATIC_IMAGES_DIR, category);
	const root = path.resolve(STATIC_IMAGES_DIR);

	if (!target.startsWith(`${root}${path.sep}`)) {
		throw new Error(`Invalid category name: ${category}`);
	}

	return target;
}

async function runDeleteCategoryMode(categoryInput, options) {
	const category = categorySlug(categoryInput || '');
	if (!category) {
		throw new Error('Category is required for delete mode. Use --delete-category <category>.');
	}

	const categoryDir = resolveCategoryPath(category);
	const hasCategoryDir = fs.existsSync(categoryDir);

	const existingPhotos = loadPhotoData();
	const filteredPhotos = existingPhotos.filter((photo) => photo.category !== category);
	const removedCount = existingPhotos.length - filteredPhotos.length;

	if (hasCategoryDir) {
		fs.rmSync(categoryDir, { recursive: true, force: true });
		console.log(`Deleted folder: ${categoryDir}`);
	}

	if (removedCount > 0) {
		savePhotoData(filteredPhotos);
		console.log(`Removed ${removedCount} photo metadata entr${removedCount === 1 ? 'y' : 'ies'} from ${DATA_FILE}`);
	}

	if (!hasCategoryDir && removedCount === 0) {
		console.log(`Nothing to delete for category "${category}".`);
		return;
	}

	maybeCommitAndPush({
		shouldCommit: options.shouldCommit,
		shouldPush: options.shouldPush,
		commitMessage: `Delete category ${category} (${removedCount} metadata removed)`
	});
}

async function runBatchMode(sourceRoot, options) {
	const resolvedSourceRoot = normalizePath(sourceRoot);
	if (!resolvedSourceRoot || !fs.existsSync(resolvedSourceRoot)) {
		throw new Error(`Source folder does not exist: ${sourceRoot}`);
	}
	if (!fs.statSync(resolvedSourceRoot).isDirectory()) {
		throw new Error(`Source path is not a directory: ${sourceRoot}`);
	}

	const categories = listTopLevelCategoryDirs(resolvedSourceRoot);
	if (categories.length === 0) {
		console.log(`No category folders found in ${resolvedSourceRoot}`);
		return;
	}

	const existingPhotos = loadPhotoData();
	const existingKeys = new Set(existingPhotos.map((photo) => photoKey(photo.category, photo.slug)));
	const existingSourceKeys = buildExistingSourceKeys(existingPhotos);
	const categoryCounters = buildCategoryCounters(existingPhotos);
	const newPhotos = [];

	let processedCount = 0;
	let skippedCount = 0;

	for (const categoryName of categories) {
		const categoryDir = path.join(resolvedSourceRoot, categoryName);
		const files = listFilesRecursive(categoryDir);

		if (files.length === 0) {
			console.log(`Skipping empty category folder: ${categoryName}`);
			continue;
		}

		console.log(`\nCategory: ${categoryName} (${files.length} image(s))`);
		const category = categorySlug(categoryName);

		for (const filePath of files) {
			const sourceRelativePath = toPosixPath(path.relative(categoryDir, filePath));
			const sourceDedupKey = sourceKey(category, sourceRelativePath);
			const legacySlug = generateSlug(path.basename(filePath));
			const legacyKey = photoKey(category, legacySlug);

			if (existingSourceKeys.has(sourceDedupKey) || existingKeys.has(legacyKey)) {
				skippedCount += 1;
				continue;
			}

			const generatedName = nextGeneratedName(category, categoryCounters);
			const result = await processPhotoFromPath({
				inputPath: filePath,
				categoryRaw: categoryName,
				generatedName,
				sourcePath: sourceRelativePath
			});
			existingKeys.add(result.key);
			existingSourceKeys.add(sourceDedupKey);
			newPhotos.push(result.photo);
			processedCount += 1;
		}
	}

	if (newPhotos.length === 0) {
		console.log('\nNo new photos detected.');
		maybeCommitAndPush({
			shouldCommit: options.shouldCommit,
			shouldPush: options.shouldPush,
			commitMessage: `Import photos from ${path.basename(resolvedSourceRoot)} (${processedCount} new, ${skippedCount} skipped)`
		});
		return;
	}

	const updatedPhotos = [...existingPhotos, ...newPhotos];
	savePhotoData(updatedPhotos);

	console.log(`\nProcessed ${processedCount} new photo(s).`);
	console.log(`Skipped ${skippedCount} existing photo(s).`);
	console.log(`Updated ${DATA_FILE}`);

	maybeCommitAndPush({
		shouldCommit: options.shouldCommit,
		shouldPush: options.shouldPush,
		commitMessage: `Import photos from ${path.basename(resolvedSourceRoot)} (${processedCount} new, ${skippedCount} skipped)`
	});
}

async function promptCategory() {
	const readline = await import('readline');
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question('Enter category for temp-photos: ', (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

async function runLegacyMode() {
	console.log('Running legacy mode (temp-photos + prompt category).');

	if (!fs.existsSync(TEMP_DIR)) {
		ensureDirExists(TEMP_DIR);
		console.log(`Created ${TEMP_DIR}. Add images and rerun.`);
		return;
	}

	const files = fs.readdirSync(TEMP_DIR)
		.filter((entry) => isSupportedImage(path.join(TEMP_DIR, entry)));

	if (files.length === 0) {
		console.log('No images found in temp-photos/.');
		return;
	}

	const category = categorySlug(await promptCategory());
	if (!category) {
		console.log('Category is required.');
		return;
	}

	const existingPhotos = loadPhotoData();
	const existingKeys = new Set(existingPhotos.map((photo) => photoKey(photo.category, photo.slug)));
	const existingSourceKeys = buildExistingSourceKeys(existingPhotos);
	const categoryCounters = buildCategoryCounters(existingPhotos);
	const newPhotos = [];

	for (const fileName of files.sort((a, b) => a.localeCompare(b))) {
		const filePath = path.join(TEMP_DIR, fileName);
		const sourceRelativePath = toPosixPath(fileName);
		const sourceDedupKey = sourceKey(category, sourceRelativePath);
		const legacySlug = generateSlug(fileName);
		const legacyKey = photoKey(category, legacySlug);

		if (existingSourceKeys.has(sourceDedupKey) || existingKeys.has(legacyKey)) {
			console.log(`Skipping existing photo: ${fileName}`);
			continue;
		}

		const generatedName = nextGeneratedName(category, categoryCounters);
		const result = await processPhotoFromPath({
			inputPath: filePath,
			categoryRaw: category,
			generatedName,
			sourcePath: sourceRelativePath
		});
		existingKeys.add(result.key);
		existingSourceKeys.add(sourceDedupKey);
		newPhotos.push(result.photo);
	}

	if (newPhotos.length === 0) {
		console.log('No new photos processed.');
		return;
	}

	savePhotoData([...existingPhotos, ...newPhotos]);
	console.log(`Processed ${newPhotos.length} new photo(s) from temp-photos.`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.sourceRoot && args.deleteCategory) {
		throw new Error('Use either import mode or delete mode, not both in one command.');
	}

	if (args.deleteCategory) {
		await runDeleteCategoryMode(args.deleteCategory, {
			shouldCommit: args.shouldCommit,
			shouldPush: args.shouldPush
		});
		return;
	}

	if (args.sourceRoot) {
		await runBatchMode(args.sourceRoot, {
			shouldCommit: args.shouldCommit,
			shouldPush: args.shouldPush
		});
		return;
	}

	await runLegacyMode();
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
