<script lang="ts">
import { onMount } from "svelte";

interface Stats {
	pageviews: number;
	visitors: number;
	visits: number;
	bounces: number;
	totaltime: number;
}

export let path: string;

let stats: Stats | null = null;
let loading = true;
let error: string | null = null;

const UMAMI_SHARE_URL = "https://u.dyzzyduq.ink/api/share/X03RsU3XCtWVUkBX";
const UMAMI_API_BASE = "https://u.dyzzyduq.ink/api";
const WEBSITE_ID = "72adf6ad-9745-4098-b0c1-833a979a7080";

async function fetchStats(): Promise<void> {
	try {
		loading = true;
		error = null;

		// Step 1: Get share token
		const tokenResponse = await fetch(UMAMI_SHARE_URL);
		if (!tokenResponse.ok) {
			throw new Error("Failed to get share token");
		}
		const tokenData = await tokenResponse.json();
		const token = tokenData.token;

		// Step 2: Fetch stats with token
		const endAt = Date.now();
		const statsUrl = `${UMAMI_API_BASE}/websites/${WEBSITE_ID}/stats?startAt=0&endAt=${endAt}&unit=hour&timezone=Asia/Hong_Kong&path=eq.${encodeURIComponent(path)}&compare=false`;

		const statsResponse = await fetch(statsUrl, {
			headers: {
				"x-umami-share-token": token,
			},
		});

		if (!statsResponse.ok) {
			throw new Error("Failed to fetch stats");
		}

		stats = await statsResponse.json();
	} catch (err) {
		console.error("Umami stats error:", err);
		error = err instanceof Error ? err.message : "Unknown error";
	} finally {
		loading = false;
	}
}

onMount(() => {
	fetchStats();
});
</script>

{#if loading}
	<div class="flex items-center gap-1.5 text-sm text-50">
		<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<span>加载中...</span>
	</div>
{:else if error}
	<div class="flex items-center gap-1.5 text-sm text-50" title={error}>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
		</svg>
		<span>统计不可用</span>
	</div>
{:else if stats}
	<div class="flex items-center gap-4 text-sm text-50">
		<div class="flex flex-row items-center">
			<div class="transition h-6 w-6 rounded-[10px] bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 flex items-center justify-center mr-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
				</svg>
			</div>
			<span>{stats.pageviews.toLocaleString()}</span>
		</div>
		<div class="flex flex-row items-center">
			<div class="transition h-6 w-6 rounded-[10px] bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 flex items-center justify-center mr-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
				</svg>
			</div>
			<span>{stats.visitors.toLocaleString()}</span>
		</div>
	</div>
{/if}
