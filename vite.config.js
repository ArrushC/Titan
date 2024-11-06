import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
	plugins: [react()],
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
		sourcemap: false, // Disable source maps for production build (optional, improves build speed)
		minify: "esbuild", // Use esbuild for faster minification
		rollupOptions: {
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
		chunkSizeWarningLimit: 1600, // Increase limit if needed
		cssCodeSplit: true, // Enable CSS code splitting
	},
});
