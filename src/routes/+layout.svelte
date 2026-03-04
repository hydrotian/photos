<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex justify-between items-center">
				<a href="{base}/" class="text-2xl font-light text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
					Photos
				</a>
				<div class="flex gap-6">
					<a href="{base}/" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Gallery</a>
					<a href="{base}/about" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">About</a>
					<a href="https://simhydro.com" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Main Site</a>
				</div>
			</div>
		</nav>
	</header>

	<main class="flex-1">
		<slot />
	</main>

	<footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
			<p>© {new Date().getFullYear()} Tian Zhou. All rights reserved.</p>
		</div>
	</footer>
</div>
