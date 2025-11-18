import type { PageLoad, EntryGenerator } from './$types';
import type { Photo } from '../../+page';
import { error } from '@sveltejs/kit';
import photoData from '$lib/photo-data.json';

export const entries: EntryGenerator = () => {
	const photos: Photo[] = photoData as Photo[];
	return photos.map(photo => ({ slug: photo.slug }));
};

export const load: PageLoad = async ({ params }) => {
	const photos: Photo[] = photoData as Photo[];
	const photo = photos.find(p => p.slug === params.slug);

	if (!photo) {
		throw error(404, 'Photo not found');
	}

	return {
		photo
	};
};

export const prerender = true;
