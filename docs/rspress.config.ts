import { defineConfig } from "@rspress/core"

const rootDir = process.cwd()

export default defineConfig({
	root: rootDir,
	lang: "en",
	title: "Hydra Docs",
	icon: "/favicon.ico",
	themeConfig: {
		socialLinks: [
			{
				icon: "github",
				mode: "link",
				content: "https://github.com/payneusmc07/rsbuild-plugin-hydra",
			},
		],
	},
})
