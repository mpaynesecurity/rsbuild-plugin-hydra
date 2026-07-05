import { defineConfig } from "@rslib/core"
import pkg from "../package.json" with { type: "json" }

export default defineConfig({
	lib: [
		{
			format: "esm",
			syntax: "es2024",
			bundle: true,
			dts: true, // Natively builds bundled declaration files right into the entry paths
		},
	],
	output: {
		legalComments: "inline", // Inlines legal notices; stops *.LICENSE.txt sidecars
		// Overrides Rslib's internal flattening to force files to honor their entry keys
		filename: {
			js: "[name].js",
		},
		cleanDistPath: true,
		target: "node",
		module: true,
		
		//externals: [
		//	/^[^./\\]+/, // Matches bare specifiers like 'typescript', 'lodash', etc.
		//	/^@/,         // Matches scoped packages like '@nestjs/core'
		//],
		// externals: [
		// 	...Object.keys(pkg.dependencies || {}),
		// 	...Object.keys(pkg.peerDependencies || {}),
		// ],
		externals: [ "typescript" ],
	},
	source: {
		// This single map naturally creates the directories you want
		entry: {
			"node-server/index": "./node-server/index.ts",
			"universal-server/index": "./universal-server/index.ts",
		},
	},
	tools: {
		rspack: {
			output: {
				// Prevents code-splitting on your dynamic import() modules
				asyncChunks: true,
			},
		},
	},
})
