import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import electron from "vite-plugin-electron/simple";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to copy serverWorker.js
const copyServerWorker = () => {
	return {
		name: 'copy-server-worker',
		writeBundle() {
			const srcPath = path.resolve(__dirname, 'electron/serverWorker.js');
			const destPath = path.resolve(__dirname, 'dist-electron/serverWorker.js');
			
			// Read the source file
			const content = fs.readFileSync(srcPath, 'utf-8');
			
			// Write to destination with some modifications for the build
			const modifiedContent = content
				.replace(/from "\.\.\/server\/server\.mjs"/g, 'from "../server/server.mjs"');
			
			fs.writeFileSync(destPath, modifiedContent);
			console.log('Copied serverWorker.js to dist-electron');
		}
	};
};

export default defineConfig({
	plugins: [react(), visualizer(), copyServerWorker(), electron({
		main: {
			entry: "electron/main.js",
			vite: {
				build: {
					rollupOptions: {
						external: ["bufferutil", "utf-8-validate"],
					},
				},
			},
		},
		preload: {
			input: "electron/preload.js",
		},
		renderer: process.env.URL ? undefined : {},
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
			"lodash",
		],
	},
	build: {
		sourcemap: false,
		minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
		rollupOptions: {
			treeshake: true,
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
				manualChunks(id) {
					// Separate lodash into their own chunks
					if (id.includes("node_modules")) {
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
