import { defineConfig } from "@rspress/core"
import { pluginTypeDoc } from "@rspress/plugin-typedoc"
import { join } from "node:path"

const rootDir = process.cwd()

export default defineConfig({
	plugins: [
		pluginTypeDoc({
			entryPoints: [
				join(rootDir, "../plugin", "universal-server", "index.ts"),
			],
		}),
	],
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
