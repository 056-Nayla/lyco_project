<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className = '' }: Props = $props();

	let el: HTMLElement | undefined = $state(undefined);

	$effect(() => {
		if (!el) return;
		const target = el;
		target.classList.add('reveal');

		if (typeof IntersectionObserver === 'undefined') {
			target.classList.add('is-visible');
			return;
		}

		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						io.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
		);

		io.observe(target);
		return () => io.disconnect();
	});
</script>

<div bind:this={el} class={className}>
	{@render children()}
</div>
