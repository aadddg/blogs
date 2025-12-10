import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "轻风梦旅",
	subtitle: "",  // 不显示副标题
	lang: "zh_CN",
	themeColor: {
		hue: 250,  // 蓝色调
		fixed: false,
	},
	banner: {
		enable: true,
		src: "assets/images/demo-banner.png",  // 默认横幅
		position: "center",
		credit: {
			enable: false,
			text: "",
			url: "",
		},
	},
	toc: {
		enable: true,
		depth: 2,
	},
	favicon: [],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,      // 首页
		LinkPreset.Archive,   // 归档
		LinkPreset.About,     // 关于
		{
			name: "GitHub",
			url: "https://github.com/aadddg",
			external: true,
		},
		{
			name: "BiliBili",
			url: "https://space.bilibili.com/1382004137",
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "http://q2.qlogo.cn/headimg_dl?dst_uin=2909883891&spec=100&v=0.48068279900737076",
	name: "dyzzyduq",
	bio: "二刺缘全栈工程师一枚",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/aadddg",
		},
		{
			name: "BiliBili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/1382004137",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};
