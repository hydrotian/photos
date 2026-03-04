#!/usr/bin/env node
/**
 * Set the cover photo for a category.
 *
 * Usage:
 *   npm run set-cover                        # list categories and their current covers
 *   npm run set-cover -- <category>          # list photos in category, pick interactively
 *   npm run set-cover -- <category> <slug>   # set cover directly
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'src/lib/photo-data.json');

function load() {
	return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(photos) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

function groupByCategory(photos) {
	const map = new Map();
	for (const p of photos) {
		if (!map.has(p.category)) map.set(p.category, []);
		map.get(p.category).push(p);
	}
	return map;
}

function setCover(photos, category, slug) {
	const inCategory = photos.filter((p) => p.category === category);
	if (inCategory.length === 0) {
		console.error(`No category "${category}" found.`);
		process.exit(1);
	}
	const target = inCategory.find((p) => p.slug === slug);
	if (!target) {
		console.error(`No photo with slug "${slug}" in category "${category}".`);
		process.exit(1);
	}
	for (const p of photos) {
		if (p.category === category) {
			if (p.slug === slug) {
				p.isCategoryCover = true;
			} else {
				delete p.isCategoryCover;
			}
		}
	}
	save(photos);
	console.log(`Cover set: [${category}] ${slug} — "${target.title}"`);
}

function listCategories(photos) {
	const map = groupByCategory(photos);
	console.log('');
	for (const [cat, catPhotos] of map) {
		const cover = catPhotos.find((p) => p.isCategoryCover) || catPhotos[0];
		const marker = cover.isCategoryCover ? '(pinned)' : '(default — first photo)';
		console.log(`  ${cat}`);
		console.log(`    cover: ${cover.slug} — "${cover.title}" ${marker}`);
	}
	console.log('');
	console.log(`Run: npm run set-cover -- <category>   to pick a cover`);
	console.log('');
}

function listPhotos(photos, category) {
	const catPhotos = photos.filter((p) => p.category === category);
	if (catPhotos.length === 0) {
		console.error(`No category "${category}" found.`);
		process.exit(1);
	}
	console.log(`\nPhotos in "${category}":\n`);
	catPhotos.forEach((p, i) => {
		const isCover = p.isCategoryCover ? ' ← current cover' : '';
		const thumb = p.thumbnail ? path.basename(p.thumbnail) : '';
		console.log(`  [${String(i + 1).padStart(2)}] ${p.slug}${isCover}`);
		console.log(`       "${p.title}"  (${thumb})`);
	});
	return catPhotos;
}

async function promptPick(catPhotos) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question('\nEnter number or slug to set as cover (or q to quit): ', (answer) => {
			rl.close();
			answer = answer.trim();
			if (!answer || answer === 'q') {
				console.log('Aborted.');
				process.exit(0);
			}
			const byIndex = catPhotos[parseInt(answer, 10) - 1];
			const bySlug = catPhotos.find((p) => p.slug === answer);
			const chosen = byIndex || bySlug;
			if (!chosen) {
				console.error(`"${answer}" is not a valid number or slug.`);
				process.exit(1);
			}
			resolve(chosen.slug);
		});
	});
}

async function main() {
	const args = process.argv.slice(2);
	const photos = load();

	if (args.length === 0) {
		listCategories(photos);
		return;
	}

	const category = args[0];
	if (args.length >= 2) {
		setCover(photos, category, args[1]);
		return;
	}

	const catPhotos = listPhotos(photos, category);
	const slug = await promptPick(catPhotos);
	setCover(photos, category, slug);
}

main();
