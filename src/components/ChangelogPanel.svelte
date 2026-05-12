<script lang="ts">
import { onMount } from "svelte";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";

interface ChangelogEntry {
	version: string;
	date: string;
	changes: string[];
	type: "feature" | "fix" | "improvement" | "breaking";
}

interface GitHubCommit {
	sha: string;
	commit: {
		message: string;
		author: {
			date: string;
		};
	};
	html_url: string;
}

// 配置：GitHub 仓库信息
const GITHUB_OWNER = "aadddg";
const GITHUB_REPO = "blogs";
const GITHUB_BRANCH = "main";

let changelogData: ChangelogEntry[] = [];
let loading = true;
let error: string | null = null;
let useGitHub = true;

// 本地备用数据
const localChangelogData: ChangelogEntry[] = [
	{
		version: "v2.1.0",
		date: "2026-04-11",
		changes: [
			"新增更新日志页面",
			"优化加载进度交互体验",
			"增加置顶文章功能",
		],
		type: "feature",
	},
	{
		version: "v2.0.0",
		date: "2026-4-10",
		changes: [
			"改进文章卡片设计",
			"修复加载进度条",
			"增加背景音乐卡片",
		],
		type: "improvement",
	},
	{
		version: "v1.0.0",
		date: "2025-09-01",
		changes: [
			"博客正式上线",
			"响应式页面布局",
		],
		type: "feature",
	},
];

function inferType(message: string): "feature" | "fix" | "improvement" | "breaking" {
	const lowerMsg = message.toLowerCase();
	if (lowerMsg.includes("breaking") || lowerMsg.includes("重大") || lowerMsg.includes("重构")) {
		return "breaking";
	}
	if (lowerMsg.includes("fix") || lowerMsg.includes("修复") || lowerMsg.includes("bug")) {
		return "fix";
	}
	if (lowerMsg.includes("feat") || lowerMsg.includes("新增") || lowerMsg.includes("添加")) {
		return "feature";
	}
	if (lowerMsg.includes("improve") || lowerMsg.includes("优化") || lowerMsg.includes("改进")) {
		return "improvement";
	}
	return "improvement";
}

function cleanMessage(message: string): string {
	return message
		.replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, "")
		.replace(/^(新增|修复|优化|改进|重构|文档|样式|测试)\s*[:：]\s*/, "")
		.split("\n")[0]
		.trim();
}

function groupCommitsByDate(commits: GitHubCommit[]): ChangelogEntry[] {
	const groups: Record<string, GitHubCommit[]> = {};

	commits.forEach((commit) => {
		const date = commit.commit.author.date.split("T")[0];
		if (!groups[date]) {
			groups[date] = [];
		}
		groups[date].push(commit);
	});

	return Object.entries(groups)
		.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
		.map(([date, dayCommits]) => {
			const types = dayCommits.map((c) => inferType(c.commit.message));
			const mainType = types.find((t) => t === "breaking") ||
				types.find((t) => t === "feature") ||
				types.find((t) => t === "fix") ||
				"improvement";

			return {
				version: `v${dayCommits[0].sha.substring(0, 7)}`,
				date,
				changes: dayCommits.map((c) => cleanMessage(c.commit.message)),
				type: mainType,
			};
		});
}

async function fetchGitHubCommits(): Promise<void> {
	try {
		loading = true;
		error = null;

		const response = await fetch(
			`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=30`
		);

		if (!response.ok) {
			throw new Error(`GitHub API 请求失败: ${response.status}`);
		}

		const commits: GitHubCommit[] = await response.json();
		changelogData = groupCommitsByDate(commits);
	} catch (err) {
		console.error("获取 GitHub Commits 失败:", err);
		error = err instanceof Error ? err.message : "未知错误";
		changelogData = localChangelogData;
	} finally {
		loading = false;
	}
}

onMount(() => {
	if (useGitHub) {
		fetchGitHubCommits();
	} else {
		changelogData = localChangelogData;
		loading = false;
	}
});

function getTypeLabel(type: string): string {
	switch (type) {
		case "feature":
			return "新功能";
		case "fix":
			return "修复";
		case "improvement":
			return "优化";
		case "breaking":
			return "重大更新";
		default:
			return "其他";
	}
}

function getTypeColor(type: string): string {
	switch (type) {
		case "feature":
			return "bg-[oklch(0.65_0.15_var(--hue))]";
		case "fix":
			return "bg-[oklch(0.55_0.08_var(--hue))]";
		case "improvement":
			return "bg-[oklch(0.70_0.12_var(--hue))]";
		case "breaking":
			return "bg-[oklch(0.60_0.18_var(--hue))]";
		default:
			return "bg-[oklch(0.5_0.05_var(--hue))]";
	}
}

function getTypeBorderColor(type: string): string {
	switch (type) {
		case "feature":
			return "border-[oklch(0.65_0.15_var(--hue))]";
		case "fix":
			return "border-[oklch(0.55_0.08_var(--hue))]";
		case "improvement":
			return "border-[oklch(0.70_0.12_var(--hue))]";
		case "breaking":
			return "border-[oklch(0.60_0.18_var(--hue))]";
		default:
			return "border-[oklch(0.5_0.05_var(--hue))]";
	}
}

function getTypeTextColor(type: string): string {
	switch (type) {
		case "feature":
			return "text-[oklch(0.65_0.15_var(--hue))]";
		case "fix":
			return "text-[oklch(0.55_0.08_var(--hue))]";
		case "improvement":
			return "text-[oklch(0.70_0.12_var(--hue))]";
		case "breaking":
			return "text-[oklch(0.60_0.18_var(--hue))]";
		default:
			return "text-[oklch(0.5_0.05_var(--hue))]";
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
}
</script>

<div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16">
			<div class="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
			<p class="text-sm text-50">正在加载更新记录...</p>
		</div>
	{:else if error && changelogData.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<svg class="w-12 h-12 text-30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
			</svg>
			<p class="text-sm text-50 mb-2">加载失败</p>
			<p class="text-xs text-30">{error}</p>
		</div>
	{:else}
		<div class="relative">
			<div class="absolute left-[7.5%] sm:left-[8%] md:left-[6%] top-0 bottom-0 w-px bg-[var(--line-color)]"></div>

			{#each changelogData as entry}
				<div class="relative flex items-start gap-4 mb-8 last:mb-0">
					<div class="w-[12%] sm:w-[10%] md:w-[8%] text-right flex-shrink-0">
						<div class="text-xs sm:text-sm text-50 font-medium">{formatDate(entry.date)}</div>
					</div>

					<div class="w-[6%] sm:w-[6%] md:w-[4%] flex justify-center flex-shrink-0 relative">
						<div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full {getTypeColor(entry.type)} border-2 border-[var(--card-bg)] shadow-sm z-10"></div>
					</div>

					<div class="flex-1 min-w-0">
						<div class="group bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-plain-bg-hover)] rounded-[10px] p-4 sm:p-5 transition-all duration-300 border border-transparent hover:border-[var(--primary)]">
							<div class="flex flex-wrap items-center gap-2 mb-3">
								<span class="text-base sm:text-lg font-bold text-[var(--primary)]">{entry.version}</span>
								<span class="px-2.5 py-1 rounded-[10px] text-xs bg-[var(--card-bg)] {getTypeBorderColor(entry.type)} {getTypeTextColor(entry.type)}">{getTypeLabel(entry.type)}</span>
							</div>

							<div class="flex flex-wrap gap-2">
								{#each entry.changes as change}
									<div class="px-3 py-1.5 bg-[var(--card-bg)] rounded-[10px] text-sm text-75 border border-[var(--line-color)] hover:border-[var(--primary)] transition-colors">{change}</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

</div>
