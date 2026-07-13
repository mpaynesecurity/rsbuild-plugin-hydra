import { defineConfig } from "@rsbuild/core"
import { pluginBabel } from "@rsbuild/plugin-babel"
import { pluginSolid } from "@rsbuild/plugin-solid"
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss"
import { hydra } from "./plugin/dist/universal-server"

// Docs: https://rsbuild.rs/config/
export default defineConfig({
	plugins: [
		pluginBabel({
			include: /\.(?:jsx|tsx)$/,
		}),
		pluginSolid(),
		pluginTailwindcss(),
		hydra({
			apiDirectory: "sandbox/api",
			generatedRoutesFile: "sandbox/api-routes.gen.ts",
			completedBuildFileName: "index.mjs",
		}),
	],
	source: {
		entry: {
			index: "./sandbox/index.tsx",
		},
	},
	server: {
		port: 3001,
		publicDir: false,
	},
})
