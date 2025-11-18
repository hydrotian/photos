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
}

export const load: PageLoad = async () => {
	const photos: Photo[] = photoData as Photo[];

	// Get unique categories
	const categories = [...new Set(photos.map(p => p.category))].sort();

	return {
		photos,
		categories
	};
};

export const prerender = true;
