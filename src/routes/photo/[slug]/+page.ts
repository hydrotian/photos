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

export const load: PageLoad = async ({ params, url }) => {
	const photos: Photo[] = photoData as Photo[];
	const requestedCategory = (url.searchParams.get('category') || '').trim();
	let photo = requestedCategory
		? photos.find(p => p.slug === params.slug && p.category === requestedCategory)
		: undefined;

	if (!photo) {
		photo = photos.find(p => p.slug === params.slug);
	}

	if (!photo) {
		throw error(404, 'Photo not found');
	}

	const hasRequestedContext = requestedCategory && photos.some(
		(p) => p.slug === params.slug && p.category === requestedCategory
	);
	const activeCategory = hasRequestedContext ? requestedCategory : photo.category;
	const categoryPhotos = photos
		.filter((p) => p.category === activeCategory)
		.slice()
		.sort(sortByDateDesc);
	const currentIndex = categoryPhotos.findIndex((p) => p.slug === photo.slug && p.category === photo.category);

	const prevPhoto = currentIndex > 0 ? categoryPhotos[currentIndex - 1] : null;
	const nextPhoto = currentIndex >= 0 && currentIndex < categoryPhotos.length - 1
		? categoryPhotos[currentIndex + 1]
		: null;

	const categoryQuery = `?category=${encodeURIComponent(activeCategory)}`;

	return {
		photo,
		backHref: `/${categoryQuery}`,
		prevHref: prevPhoto ? `/photo/${prevPhoto.slug}${categoryQuery}` : null,
		nextHref: nextPhoto ? `/photo/${nextPhoto.slug}${categoryQuery}` : null
	};
};

export const prerender = true;
