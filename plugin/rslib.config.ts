import { defineConfig } from "@rslib/core"
import * as pkg from "./package.json" with { type: "json" }

export default defineConfig({
	lib: [
		{
			format: "esm",
			syntax: "esnext",
			id: "rsbuild-plugin-hydra",
			output: {
				minify: {
					jsOptions: {
						minimizerOptions: {
							mangle: false,
							minify: true,
						},
					},
				},
			},
			dts: {
				isolated: true,
			},
		},
	],
	output: {
		autoExternal: true,
		cleanDistPath: true,
		// Do not bundle dev dependencies
		externals: [ ...Object.keys(pkg.devDependencies) ],
		// Inlines legal notices; stops *.LICENSE.txt sidecars
		legalComments: "inline",
		minify: {
			jsOptions: {
				minimizerOptions: {
					// maintain function names
					mangle: {
						keep_classnames: true,
						keep_fnames: true,
					},
					compress: {},
				},
			},
		},
		module: true,
		sourceMap: false,
		target: "node",
	},
	source: {
		entry: {
			"index": "index.ts",
			"http/index": "./http/index.ts",
			"env/index": "./env/index.ts",
			"logger/index": "./logger/index.ts",
		},
	},
	tools: {
		rspack: {
			stats: {
				errors: true,
				errorDetails: true,
				errorStack: false,
				env: true,
				runtime: true,
			},
			output: {
				asyncChunks: true,
			},
		},
	},
})
