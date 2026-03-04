import type { PageLoad } from './$types';
import photoData from '$lib/photo-data.json';

export interface Photo {
	slug: string;
	title: string;
	date: string;
	location: string;
	category: string;
	thumbnail: string;
	image: string;
	description?: string;
	camera?: string;
	lens?: string;
	settings?: string;
	isCategoryCover?: boolean;
	sourcePath?: string;
	lat?: number;
	lng?: number;
}

export interface CategoryCover {
	category: string;
	count: number;
	cover: Photo;
}

function toTimestamp(value: string) {
	const ts = new Date(value).getTime();
	return Number.isNaN(ts) ? 0 : ts;
}

function sortByDateDesc(a: Photo, b: Photo) {
	return toTimestamp(b.date) - toTimestamp(a.date) || a.slug.localeCompare(b.slug);
}

export const load: PageLoad = async () => {
	const photos: Photo[] = (photoData as Photo[]).slice().sort(sortByDateDesc);

	// Get unique categories
	const discoveredCategories = [...new Set(photos.map(p => p.category))];
	const categoryCovers: CategoryCover[] = discoveredCategories
		.map((category) => {
			const categoryPhotos = photos.filter((photo) => photo.category === category);
			const selectedCover = categoryPhotos.find((photo) => photo.isCategoryCover) || categoryPhotos[0];
			return {
				category,
				count: categoryPhotos.length,
				cover: selectedCover
			};
		})
		.filter((item): item is CategoryCover => Boolean(item.cover))
		.sort((a, b) => sortByDateDesc(a.cover, b.cover));
	const categories = categoryCovers.map((item) => item.category);

	return {
		photos,
		categories,
		categoryCovers
	};
};

export const prerender = true;
