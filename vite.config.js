import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": "http://localhost:4000",
		},
		watch: {
			usePolling: true,
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"ag-grid-react": ["ag-grid-react"],
					"ag-grid-community": ["ag-grid-community"],
				},
			},
		},
		chunkSizeWarningLimit: 1600,
	}
});
