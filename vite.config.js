import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
	plugins: [react(), visualizer(), electron({
		main: {
			entry: "electron/main.js",
		},
		preload: {
			input: "electron/preload.js",
		},
		renderer: {},
	})],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
			},
		},
		watch: {
			usePolling: true,
		},
	},
	// Optimize dependencies that rarely change
	optimizeDeps: {
		include: [
			"ag-grid-community",
			"ag-grid-react",
			"lodash",
		],
	},
	build: {
		sourcemap: false,
		minify: false,
		rollupOptions: {
			treeshake: true,
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
				manualChunks(id) {
					// Separate ag-grid and lodash into their own chunks
					if (id.includes("node_modules")) {
						if (id.includes("ag-grid-react")) {
							return "ag-grid-react";
						}
						if (id.includes("ag-grid-community")) {
							return "ag-grid-community";
						}
						if (id.includes("lodash")) {
							return "lodash";
						}
						return "vendor"; // Other node_modules in a separate chunk
					}
				},
			},
		},
		chunkSizeWarningLimit: 1600,
		cssCodeSplit: false,
	},
});
