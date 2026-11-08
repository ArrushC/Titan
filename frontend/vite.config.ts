import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";
import { visualizer } from "rollup-plugin-visualizer";
// import removeConsole from "vite-plugin-remove-console";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		tailwindcss(),
		checker({
			typescript: true,
			svelte: true,
		}),
		// process.env.NODE_ENV === "production" &&
		// 	visualizer({
		// 		filename: "dist/stats.html",
		// 		open: true,
		// 		gzipSize: true,
		// 		template: "flamegraph",
		// 	}),
		// removeConsole(), // Temporarily disabled due to plugin issue
	].filter(Boolean),
	resolve: {
		alias: {
			src: path.resolve("./src"),
		},
	},
	build: {
		// Inline small assets since we're not serving over network
		assetsInlineLimit: 8192,
		chunkSizeWarningLimit: 1000,
		minify: "esbuild",
		sourcemap: false,
		target: "esnext",
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ["svelte"],
				},
			},
		},
	},

	server: {
		port: 5173,
		strictPort: true,
	},
});
