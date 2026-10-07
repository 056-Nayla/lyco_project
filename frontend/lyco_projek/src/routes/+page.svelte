<script lang="ts">
	import About from '#lib/components/About.svelte';
	import CTA from '#lib/components/CTA.svelte';
	import FeaturedMenu from '#lib/components/FeaturedMenu.svelte';
	import Features from '#lib/components/Features.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Hero from '#lib/components/Hero.svelte';
	import HowItWorks from '#lib/components/HowItWorks.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import PromoBanner from '#lib/components/PromoBanner.svelte';
	import Reveal from '#lib/components/Reveal.svelte';
	import Testimonials from '#lib/components/Testimonials.svelte';
</script>

<svelte:head>
	<title>Lyco — Pesan Kopi & Makanan</title>
	<meta
		name="description"
		content="Lyco — Temukan kopi favoritmu. Pesan kopi dan makanan dengan mudah, cepat, dan nyaman."
	/>
</svelte:head>

<Navbar />

<main>
	<Hero />
	<Reveal>
		<Features />
	</Reveal>
	<Reveal>
		<FeaturedMenu />
	</Reveal>
	<Reveal>
		<PromoBanner />
	</Reveal>
	<Reveal>
		<About />
	</Reveal>
	<Reveal>
		<HowItWorks />
	</Reveal>
	<Reveal>
		<Testimonials />
	</Reveal>
	<Reveal>
		<CTA />
	</Reveal>
</main>

<Footer />
