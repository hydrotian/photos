import type { PageLoad, EntryGenerator } from './$types';
import type { Photo } from '../../+page';
import { error } from '@sveltejs/kit';
import photoData from '$lib/photo-data.json';

function toTimestamp(value: string) {
	const ts = new Date(value).getTime();
	return Number.isNaN(ts) ? 0 : ts;
}

function sortByDateDesc(a: Photo, b: Photo) {
	return toTimestamp(b.date) - toTimestamp(a.date) || a.slug.localeCompare(b.slug);
}

export const entries: EntryGenerator = () => {
	const photos: Photo[] = photoData as Photo[];
	return [...new Set(photos.map(photo => photo.slug))].map((slug) => ({ slug }));
};

export const load: PageLoad = async ({ params }) => {
	const photos: Photo[] = (photoData as Photo[]).slice().sort(sortByDateDesc);
	const photo = photos.find(p => p.slug === params.slug);

	if (!photo) {
		throw error(404, 'Photo not found');
	}

	return {
		photo,
		photos
	};
};

export const prerender = true;
