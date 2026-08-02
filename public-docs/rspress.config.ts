import { defineConfig } from "@rspress/core"

export default defineConfig({
	lang: "en",
	root: "v1",
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
	builderConfig: {
		tools: {
			rspack: {
				watchOptions: {
					ignored: [ "node_modules" ],
				},
			},
		},
	},
})
