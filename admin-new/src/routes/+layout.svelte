<script>
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-[#fafafa] font-['Inter'] text-[#333]">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
