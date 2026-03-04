<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	function categoryHref(category: string) {
		if (category === 'all') {
			return `${base}/`;
		}
		return `${base}/?category=${encodeURIComponent(category)}`;
	}

	function formatCategory(name: string) {
		return name.replace(/_/g, ' ');
	}

	$: selectedCategoryParam = (new URL($page.url.href).searchParams.get('category') || '').trim();
	$: selectedCategory = data.categories.includes(selectedCategoryParam) ? selectedCategoryParam : 'all';
	$: categoryQuery = selectedCategory === 'all' ? '' : `?category=${encodeURIComponent(selectedCategory)}`;
	$: filteredPhotos = selectedCategory === 'all'
		? []
		: data.photos.filter(p => p.category === selectedCategory);
</script>

<svelte:head>
	<title>Tian Zhou - Photography</title>
	<meta name="description" content="Photography portfolio by Tian Zhou" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Hero Section -->
	<div class="text-center mb-12">
		<h1 class="text-4xl md:text-5xl font-light text-gray-900 mb-4">
			Photography
		</h1>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
			Capturing moments through light and perspective
		</p>
	</div>

	<!-- Category Filter -->
	<div class="flex justify-center gap-4 mb-10 flex-wrap">
		<a
			href={categoryHref('all')}
			class="px-4 py-2 rounded-full transition-colors {selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
		>
			All
		</a>
		{#each data.categories as category}
			<a
				href={categoryHref(category)}
				class="px-4 py-2 rounded-full transition-colors capitalize {selectedCategory === category ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
			>
				{formatCategory(category)}
			</a>
		{/each}
	</div>

	{#if selectedCategory === 'all'}
		<!-- Category Cover Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each data.categoryCovers as category}
				<a
					href={categoryHref(category.category)}
					class="group relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-200"
				>
					<img
						src="{base}/{category.cover.thumbnail}"
						alt={category.category}
						class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						loading="lazy"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
					<div class="absolute bottom-0 left-0 right-0 p-5 text-white">
						<h2 class="text-2xl font-light">{formatCategory(category.category)}</h2>
						<p class="text-sm text-gray-200">{category.count} photo{category.count === 1 ? '' : 's'}</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- Photo Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredPhotos as photo}
				<a
					href="{base}/photo/{photo.slug}{categoryQuery}"
					class="group relative aspect-square overflow-hidden rounded-lg bg-gray-200 hover:opacity-90 transition-opacity"
				>
					<img
						src="{base}/{photo.thumbnail}"
						alt={photo.title}
						class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						loading="lazy"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
						<div class="absolute bottom-0 left-0 right-0 p-4 text-white">
							<h3 class="text-lg font-medium">{photo.title}</h3>
							<p class="text-sm text-gray-200">{photo.location}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if selectedCategory !== 'all' && filteredPhotos.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500">No photos in this category yet.</p>
		</div>
	{/if}
</div>
