<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount, onDestroy } from "svelte";

interface Song {
	title: string;
	artist: string;
	cover: string;
	src: string;
}

// 歌单 ID，可自行修改
const PLAYLIST_ID = 8045756457;

// 默认封面 - 使用纯 CSS 渐变，不依赖外部资源
const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23444'/%3E%3Cstop offset='100%25' style='stop-color:%23222'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23g)'/%3E%3Ccircle cx='50' cy='50' r='18' fill='none' stroke='%23666' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='8' fill='%23666'/%3E%3C/svg%3E";

let playlist: Song[] = $state([]);
let isLoading = $state(true);

// 图片加载状态管理
let loadedImages = $state<Set<number>>(new Set());
let failedImages = $state<Set<number>>(new Set());

async function fetchPlaylist() {
	try {
		const response = await fetch(`https://api.injahow.cn/meting/?type=playlist&id=${PLAYLIST_ID}`);
		const data = await response.json();
		
		playlist = data.map((item: any) => ({
			title: item.name,
			artist: item.artist,
			cover: item.pic,
			src: item.url,
		}));
		
		isLoading = false;
	} catch (error) {
		console.error('Failed to fetch playlist:', error);
		playlist = [];
		isLoading = false;
	}
}

type ViewMode = 'main' | 'playlist' | 'volume';

let isExpanded = $state(true);
let isPlaying = $state(false);
let currentIndex = $state(0);
let currentTime = $state(0);
let duration = $state(0);
let volume = $state(0.7);
let isMuted = $state(false);
let isHovering = $state(false);
let viewMode: ViewMode = $state('main');

let collapseTimer: ReturnType<typeof setTimeout> | null = null;
const COLLAPSE_DELAY = 8000;

let currentSong = $derived(playlist[currentIndex]);
let audioElement: HTMLAudioElement | null = $state(null);

function resetCollapseTimer() {
	if (collapseTimer) clearTimeout(collapseTimer);
	if (isExpanded && !isHovering) {
		collapseTimer = setTimeout(() => {
			if (!isHovering) isExpanded = false;
		}, COLLAPSE_DELAY);
	}
}

function toggleExpand() {
	isExpanded = !isExpanded;
	if (isExpanded) {
		resetCollapseTimer();
		viewMode = 'main';
	}
}

function togglePlay() {
	if (!audioElement) return;
	if (isPlaying) audioElement.pause();
	else audioElement.play();
	isPlaying = !isPlaying;
	resetCollapseTimer();
}

function playSong(index: number) {
	if (index === currentIndex) {
		togglePlay();
	} else {
		currentIndex = index;
		loadAndPlay();
	}
	resetCollapseTimer();
}

function loadAndPlay() {
	if (!audioElement || !currentSong) return;
	audioElement.src = currentSong.src;
	audioElement.load();
	if (isPlaying) {
		audioElement.play().catch(() => {});
	}
}

function playPrevious() {
	if (playlist.length === 0) return;
	currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
	loadAndPlay();
	resetCollapseTimer();
}

function playNext() {
	if (playlist.length === 0) return;
	currentIndex = (currentIndex + 1) % playlist.length;
	loadAndPlay();
	resetCollapseTimer();
}

function formatTime(time: number): string {
	if (isNaN(time) || !isFinite(time)) return "0:00";
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function handleProgressClick(event: MouseEvent) {
	if (!audioElement || !duration) return;
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
	const percent = (event.clientX - rect.left) / rect.width;
	currentTime = percent * duration;
	audioElement.currentTime = currentTime;
	resetCollapseTimer();
}

function handleVolumeChange(event: Event) {
	const target = event.target as HTMLInputElement;
	volume = parseFloat(target.value);
	if (audioElement) {
		audioElement.volume = volume;
		isMuted = volume === 0;
	}
	resetCollapseTimer();
}

function toggleMute() {
	if (!audioElement) return;
	if (isMuted) {
		audioElement.volume = volume || 0.7;
		isMuted = false;
	} else {
		audioElement.volume = 0;
		isMuted = true;
	}
	resetCollapseTimer();
}

function showVolumePanel() {
	viewMode = 'volume';
	resetCollapseTimer();
}

function showPlaylistPanel() {
	viewMode = 'playlist';
	resetCollapseTimer();
}

function backToMain() {
	viewMode = 'main';
	resetCollapseTimer();
}

function handleMouseEnter() {
	isHovering = true;
	if (collapseTimer) {
		clearTimeout(collapseTimer);
		collapseTimer = null;
	}
}

function handleMouseLeave() {
	isHovering = false;
	if (isExpanded) resetCollapseTimer();
}

onMount(() => {
	fetchPlaylist().then(() => {
		if (playlist.length > 0) {
			audioElement = new Audio();
			audioElement.volume = volume;
			audioElement.src = currentSong.src;

			audioElement.addEventListener("timeupdate", () => {
				currentTime = audioElement!.currentTime;
			});
			audioElement.addEventListener("loadedmetadata", () => {
				duration = audioElement!.duration;
			});
			audioElement.addEventListener("ended", playNext);
			audioElement.addEventListener("play", () => isPlaying = true);
			audioElement.addEventListener("pause", () => isPlaying = false);

			setTimeout(() => {
				if (audioElement) {
					audioElement.play().catch(() => {
						console.log('自动播放被阻止，请点击播放按钮');
					});
				}
				resetCollapseTimer();
			}, 500);
		}
	});
});

onDestroy(() => {
	if (collapseTimer) clearTimeout(collapseTimer);
	if (audioElement) {
		audioElement.pause();
		audioElement = null;
	}
});

// 处理图片加载成功
function handleImageLoad(index: number) {
	loadedImages = new Set([...loadedImages, index]);
}

// 处理图片加载失败
function handleImageError(index: number) {
	failedImages = new Set([...failedImages, index]);
}

// 获取图片URL，失败时返回默认封面
function getCoverUrl(index: number, originalUrl: string): string {
	if (failedImages.has(index)) {
		return DEFAULT_COVER;
	}
	return originalUrl;
}
</script>

<div
	class="music-player-wrapper fixed z-50"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div
		class="music-player-container relative overflow-hidden cursor-pointer"
		class:expanded={isExpanded}
		onclick={() => !isExpanded && toggleExpand()}
	>
		<div class="player-bg"></div>

		<div class="player-content relative z-10">
			{#if isLoading}
				<div class="circle-state flex items-center justify-center w-full h-full">
					<div class="animate-spin rounded-full h-5 w-5 border-2 border-[var(--btn-content)] border-t-transparent"></div>
				</div>
			{:else if !isExpanded}
				<div class="circle-state flex items-center justify-center w-full h-full">
					{#if isPlaying}
						<span class="absolute inset-0 rounded-full bg-[var(--primary)] opacity-20 animate-ping"></span>
					{/if}

					<div class="relative z-10">
						{#if isPlaying}
							<div class="flex gap-0.5 items-end h-5">
								<div class="w-1 bg-current rounded-full animate-music-bar" style="animation-delay: 0s; height: 60%;"></div>
								<div class="w-1 bg-current rounded-full animate-music-bar" style="animation-delay: 0.1s; height: 100%;"></div>
								<div class="w-1 bg-current rounded-full animate-music-bar" style="animation-delay: 0.2s; height: 40%;"></div>
							</div>
						{:else}
							<Icon icon="material-symbols:music-note" class="text-2xl text-[var(--btn-content)] dark:text-white/75" />
						{/if}
					</div>

					{#if isPlaying}
						<span class="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-[var(--card-bg)]"></span>
					{/if}
				</div>
			{:else}
				<div class="square-state w-full h-full flex flex-col">
					<!-- Main View -->
					{#if viewMode === 'main' && currentSong}
						<div class="flex flex-col">
							<!-- 歌曲信息 -->
							<div class="flex items-center gap-3 mb-3">
								<div class="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
									<img
										src={getCoverUrl(currentIndex, currentSong.cover)}
										alt={currentSong.title}
										class="w-full h-full object-cover"
										class:animate-spin-slow={isPlaying}
										onload={() => handleImageLoad(currentIndex)}
										onerror={() => handleImageError(currentIndex)}
										loading="lazy"
									/>
									{#if isPlaying}
										<div class="absolute inset-0 flex items-center justify-center bg-black/20">
											<div class="flex gap-0.5 items-end h-4">
												<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0s; height: 60%;"></div>
												<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0.1s; height: 100%;"></div>
												<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0.2s; height: 40%;"></div>
											</div>
										</div>
									{/if}
								</div>

								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-[var(--btn-content)] dark:text-white/90 truncate">
										{currentSong.title}
									</div>
									<div class="text-xs text-50 text-[var(--btn-content)] dark:text-white/50 truncate">
										{currentSong.artist}
									</div>
								</div>

								<button
									class="btn-plain scale-animation rounded-lg w-8 h-8 flex-shrink-0"
									onclick={(e) => { e.stopPropagation(); toggleExpand(); }}
									aria-label="关闭"
								>
									<Icon icon="material-symbols:close" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
								</button>
							</div>

							<!-- 进度条 -->
							<div class="mb-3">
								<div
									class="h-1.5 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer relative overflow-hidden group"
									onclick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
								>
									<div
										class="h-full bg-[var(--primary)] rounded-full"
										style="width: {(duration ? currentTime / duration : 0) * 100}%"
									></div>
								</div>
								<div class="flex justify-between text-xs text-50 mt-1">
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration)}</span>
								</div>
							</div>

							<!-- 控制按钮 -->
							<div class="flex items-center justify-center gap-4">
								<button
									class="btn-plain scale-animation rounded-full w-9 h-9"
									onclick={(e) => { e.stopPropagation(); showVolumePanel(); }}
									aria-label="音量"
								>
									{#if isMuted || volume === 0}
										<Icon icon="material-symbols:volume-off" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
									{:else if volume < 0.5}
										<Icon icon="material-symbols:volume-down" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
									{:else}
										<Icon icon="material-symbols:volume-up" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
									{/if}
								</button>

								<button
									class="btn-plain scale-animation rounded-full w-10 h-10"
									onclick={(e) => { e.stopPropagation(); playPrevious(); }}
									aria-label="上一首"
								>
									<Icon icon="material-symbols:skip-previous" class="text-xl text-[var(--btn-content)] dark:text-white/75" />
								</button>

								<button
									class="btn-regular scale-animation rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
									onclick={(e) => { e.stopPropagation(); togglePlay(); }}
									aria-label={isPlaying ? "暂停" : "播放"}
								>
									{#if isPlaying}
										<Icon icon="material-symbols:pause" class="text-2xl" />
									{:else}
										<Icon icon="material-symbols:play-arrow" class="text-2xl ml-0.5" />
									{/if}
								</button>

								<button
									class="btn-plain scale-animation rounded-full w-10 h-10"
									onclick={(e) => { e.stopPropagation(); playNext(); }}
									aria-label="下一首"
								>
									<Icon icon="material-symbols:skip-next" class="text-xl text-[var(--btn-content)] dark:text-white/75" />
								</button>

								<button
									class="btn-plain scale-animation rounded-full w-9 h-9"
									onclick={(e) => { e.stopPropagation(); showPlaylistPanel(); }}
									aria-label="播放列表"
								>
									<Icon icon="material-symbols:queue-music" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
								</button>
							</div>
						</div>
					{/if}

					<!-- Volume View -->
					{#if viewMode === 'volume'}
						<div class="flex flex-col">
							<div class="flex items-center gap-3 mb-4">
								<button
									class="btn-plain scale-animation rounded-lg w-8 h-8 flex-shrink-0"
									onclick={(e) => { e.stopPropagation(); backToMain(); }}
									aria-label="返回"
								>
									<Icon icon="material-symbols:arrow-back" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
								</button>
								<span class="text-sm font-medium text-[var(--btn-content)] dark:text-white/75">音量调节</span>
							</div>

							<div class="flex flex-col items-center justify-center gap-4 py-2">
								<div class="relative">
									<Icon
										icon={isMuted || volume === 0 ? "material-symbols:volume-off" : volume < 0.5 ? "material-symbols:volume-down" : "material-symbols:volume-up"}
										class="text-4xl text-[var(--primary)]"
									/>
								</div>

								<div class="w-full px-4">
									<input
										type="range"
										min="0"
										max="1"
										step="0.01"
										value={isMuted ? 0 : volume}
										oninput={handleVolumeChange}
										onclick={(e) => e.stopPropagation()}
										class="w-full h-2 bg-[var(--btn-regular-bg)] rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
									/>
								</div>

								<div class="flex items-center gap-4">
									<button
										class="btn-plain scale-animation rounded-full w-10 h-10"
										onclick={(e) => { e.stopPropagation(); toggleMute(); }}
										aria-label={isMuted ? "取消静音" : "静音"}
									>
										{#if isMuted}
											<Icon icon="material-symbols:volume-off" class="text-xl text-[var(--btn-content)] dark:text-white/75" />
										{:else}
											<Icon icon="material-symbols:volume-up" class="text-xl text-[var(--btn-content)] dark:text-white/75" />
										{/if}
									</button>
									<span class="text-sm text-50 w-12 text-center">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
								</div>
							</div>
						</div>
					{/if}

					<!-- Playlist View -->
					{#if viewMode === 'playlist'}
						<div class="flex flex-col">
							<div class="flex items-center gap-3 mb-3">
								<button
									class="btn-plain scale-animation rounded-lg w-8 h-8 flex-shrink-0"
									onclick={(e) => { e.stopPropagation(); backToMain(); }}
									aria-label="返回"
								>
									<Icon icon="material-symbols:arrow-back" class="text-lg text-[var(--btn-content)] dark:text-white/75" />
								</button>
								<span class="text-sm font-medium text-[var(--btn-content)] dark:text-white/75">播放列表</span>
								<span class="text-xs text-50">({playlist.length}首)</span>
							</div>

							<div class="overflow-y-auto max-h-36 hide-scrollbar">
								{#each playlist as song, index}
									<button
										class="w-full flex items-center gap-3 p-2 rounded-lg transition hover:bg-[var(--btn-plain-bg-hover)]"
										class:bg-[var(--btn-regular-bg)]={index === currentIndex}
										onclick={(e) => { e.stopPropagation(); playSong(index); }}
									>
										<div class="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-black/20">
											<img
												src={getCoverUrl(index, song.cover)}
												alt={song.title}
												class="w-full h-full object-cover"
												onload={() => handleImageLoad(index)}
												onerror={() => handleImageError(index)}
												loading="lazy"
											/>
											{#if index === currentIndex}
												<div class="absolute inset-0 flex items-center justify-center bg-black/40">
													{#if isPlaying}
														<div class="flex gap-0.5 items-end h-4">
															<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0s; height: 60%;"></div>
															<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0.1s; height: 100%;"></div>
															<div class="w-0.5 bg-white rounded-full animate-music-bar" style="animation-delay: 0.2s; height: 40%;"></div>
														</div>
													{:else}
														<Icon icon="material-symbols:pause" class="text-white text-lg" />
													{/if}
												</div>
											{/if}
										</div>
										<div class="flex-1 min-w-0 text-left">
											<div class="text-sm font-medium truncate text-[var(--btn-content)] dark:text-white/75" class:text-[var(--primary)]={index === currentIndex}>
												{song.title}
											</div>
											<div class="text-xs text-50 truncate text-[var(--btn-content)] dark:text-white/50">
												{song.artist}
											</div>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.music-player-wrapper {
		bottom: 1.5rem;
		right: 1.5rem;
		width: 56px;
		height: 56px;
	}

	.music-player-container {
		width: 56px;
		height: 56px;
		border-radius: 28px;
		transition: all 0.4s cubic-bezier(0.25, 0, 0.5, 0);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		transform-origin: top left;
	}

	.music-player-container.expanded {
		width: 280px;
		height: auto;
		min-height: 200px;
		border-radius: 16px;
		cursor: default;
		/* 向左上移动，transform-origin 是 top left，所以是从左上角展开 */
		transform: translate(-224px, -124px);
		transition: all 0.5s cubic-bezier(0, 0, 0.2, 1);
	}

	.player-bg {
		position: absolute;
		inset: 0;
		background: var(--card-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: inherit;
		transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .player-bg {
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.player-content {
		width: 100%;
		height: 100%;
	}

	.circle-state {
		color: var(--btn-content);
		transition: opacity 0.25s ease;
	}

	.music-player-container.expanded .circle-state {
		opacity: 0;
		pointer-events: none;
	}

	.square-state {
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s;
		padding: 12px;
	}

	.music-player-container.expanded .square-state {
		opacity: 1;
		transform: scale(1);
	}

	@keyframes music-bar {
		0%, 100% { transform: scaleY(0.3); }
		50% { transform: scaleY(1); }
	}

	:global(.animate-music-bar) {
		animation: music-bar 0.8s ease-in-out infinite;
		transform-origin: bottom;
	}

	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	:global(.animate-spin-slow) {
		animation: spin-slow 8s linear infinite;
	}

	:global(.btn-plain) {
		@apply transition relative flex items-center justify-center bg-none
		text-black/75 hover:text-[var(--primary)] dark:text-white/75 dark:hover:text-[var(--primary)];
	}

	:global(.btn-plain)::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--btn-plain-bg-hover);
		transform: scale(0.85);
		transition: all 0.2s ease;
		z-index: -1;
		opacity: 0;
	}

	:global(.btn-plain:hover)::before {
		transform: scale(1);
		opacity: 1;
	}

	:global(.btn-regular) {
		@apply transition flex items-center justify-center;
		background: var(--btn-regular-bg);
		color: var(--btn-content);
	}

	:global(.btn-regular:hover) {
		background: var(--btn-regular-bg-hover);
	}

	:global(.dark .btn-regular) {
		color: rgba(255, 255, 255, 0.75);
	}

	:global(.scale-animation) {
		transition: transform 0.15s ease;
	}

	:global(.scale-animation:active) {
		transform: scale(0.9);
	}

	input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
	}

	input[type="range"]::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
	}

	.hide-scrollbar {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
