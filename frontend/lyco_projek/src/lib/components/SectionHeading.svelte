<script lang="ts">
	import Reveal from './Reveal.svelte';

	type Props = {
		eyebrow?: string;
		title: string;
		description?: string;
		align?: 'center' | 'left';
		dark?: boolean;
	};

	let { eyebrow, title, description, align = 'center', dark = false }: Props = $props();
</script>

<Reveal>
	<div class={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-left'}>
		{#if eyebrow}
			<p
				class="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase {dark
					? 'border-white/20 bg-white/10 text-caramel-100'
					: 'border-caramel-500/25 bg-white text-coffee-700'}"
			>
				<span class="h-1.5 w-1.5 rounded-full {dark ? 'bg-caramel-400' : 'bg-caramel-500'}"></span>
				{eyebrow}
			</p>
		{/if}
		<h2
			class="font-display text-3xl leading-tight font-semibold text-balance sm:text-4xl {dark
				? 'text-white'
				: 'text-espresso-950'}"
		>
			{title}
		</h2>
		{#if description}
			<p
				class="mt-4 text-base leading-relaxed sm:text-lg {dark
					? 'text-white/70'
					: 'text-espresso-950/65'}"
			>
				{description}
			</p>
		{/if}
	</div>
</Reveal>
