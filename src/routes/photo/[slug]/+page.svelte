<script lang="ts">
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	export let data: PageData;
	const { photo } = data;

	function formatCategory(name: string) {
		return name.replace(/_/g, ' ');
	}
</script>

<svelte:head>
	<title>{photo.title} - Tian Zhou Photography</title>
	<meta name="description" content={photo.description || photo.title} />
</svelte:head>

<div class="max-w-[96rem] mx-auto px-3 sm:px-4 lg:px-6 py-8 lg:py-10">
	<!-- Back button -->
	<a
		href="{base}{data.backHref}"
		class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
	>
		<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
		</svg>
		Back to Gallery
	</a>

	<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_21rem] gap-6 xl:gap-10">
		<!-- Image -->
		<div class="xl:col-span-1">
			<div class="relative bg-gray-900 rounded-lg overflow-hidden">
				<img
					src="{base}/{photo.image}"
					alt={photo.title}
					class="w-full h-auto"
				/>

				{#if data.prevHref}
					<a
						href="{base}{data.prevHref}"
						aria-label="Previous photo"
						class="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/65 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
						</svg>
					</a>
				{/if}

				{#if data.nextHref}
					<a
						href="{base}{data.nextHref}"
						aria-label="Next photo"
						class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/65 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</a>
				{/if}
			</div>
		</div>

		<!-- Details -->
		<div class="xl:col-span-1">
			<h1 class="text-3xl font-light text-gray-900 mb-4">{photo.title}</h1>

			<div class="space-y-4 text-gray-600">
				<div>
					<h3 class="text-sm font-medium text-gray-900 mb-1">Location</h3>
					<p>{photo.location}</p>
				</div>

				<div>
					<h3 class="text-sm font-medium text-gray-900 mb-1">Date</h3>
					<p>{new Date(photo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
				</div>

				{#if photo.description}
					<div>
						<h3 class="text-sm font-medium text-gray-900 mb-1">Description</h3>
						<p>{photo.description}</p>
					</div>
				{/if}

				{#if photo.camera || photo.lens}
					<div class="pt-4 border-t border-gray-200">
						<h3 class="text-sm font-medium text-gray-900 mb-2">Equipment</h3>
						{#if photo.camera}
							<p class="text-sm">Camera: {photo.camera}</p>
						{/if}
						{#if photo.lens}
							<p class="text-sm">Lens: {photo.lens}</p>
						{/if}
					</div>
				{/if}

				{#if photo.settings}
					<div>
						<h3 class="text-sm font-medium text-gray-900 mb-1">Settings</h3>
						<p class="text-sm">{photo.settings}</p>
					</div>
				{/if}

				<div class="pt-4">
					<span class="inline-block px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">
						{formatCategory(photo.category)}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
