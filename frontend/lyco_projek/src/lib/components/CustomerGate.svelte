<script lang="ts">
	import { LogIn } from '@lucide/svelte';
	import {
		isValidCustomerPhone,
		loginCustomer,
		normalizeCustomerPhone
	} from '#lib/data/customerAuth.svelte.js';
	import { setBuyerName, setBuyerPhone } from '#lib/data/orderStore.svelte.js';

	let name = $state('');
	let phone = $state('');
	let error = $state('');
	let busy = $state(false);

	function submit(): void {
		error = '';
		if (!name.trim()) {
			error = 'Nama wajib diisi.';
			return;
		}
		if (!isValidCustomerPhone(phone)) {
			error = 'No. WA tidak valid (cth. 088989834160).';
			return;
		}
		busy = true;
		try {
			const wa = normalizeCustomerPhone(phone);
			loginCustomer(name.trim(), wa);
			// Prefill form checkout + halaman pesanan langsung kenal pelanggan.
			setBuyerName(name.trim());
			setBuyerPhone(wa);
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex min-h-dvh items-center justify-center bg-[#0F1319] px-4 py-10">
	<div class="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141922] p-6 shadow-2xl sm:p-8">
		<div class="flex flex-col items-center text-center">
			<img
				src="/logo-lyco.jpg"
				alt="Logo Lyco"
				width="72"
				height="72"
				class="h-[72px] w-[72px] rounded-full border border-white/20 object-cover"
			/>
			<h1 class="mt-4 font-heading text-2xl font-bold text-white">Selamat datang di LYCO</h1>
			<p class="mt-1.5 text-sm text-white/60">
				Masuk dulu yuk sebelum lihat menu — cukup nama dan nomor WA.
			</p>
		</div>

		<form
			class="mt-6 flex flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<div>
				<label for="gate-name" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
					Nama kamu
				</label>
				<input
					id="gate-name"
					bind:value={name}
					placeholder="cth. Nayla"
					autocomplete="name"
					class="h-11 w-full rounded-xl border border-white/15 bg-[#0F1319] px-3.5 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
				/>
			</div>
			<div>
				<label for="gate-wa" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
					No. WA
				</label>
				<input
					id="gate-wa"
					bind:value={phone}
					placeholder="cth. 088989834160"
					autocomplete="tel"
					inputmode="tel"
					class="h-11 w-full rounded-xl border border-white/15 bg-[#0F1319] px-3.5 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
				/>
				<p class="mt-1.5 text-xs text-white/40">
					Nomor ini dipakai untuk notif status pesananmu via WhatsApp.
				</p>
			</div>

			{#if error}
				<p class="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={busy}
				class="btn-lyco-solid inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
			>
				<LogIn size={17} />
				Masuk & Lihat Menu
			</button>
		</form>
	</div>
</div>
