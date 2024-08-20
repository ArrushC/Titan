import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { ChakraProvider, ColorModeScript, createMultiStyleConfigHelpers, defineStyleConfig, extendTheme } from "@chakra-ui/react";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-balham.min.css";
import { AppProvider } from "./AppContext";
import "./css/main.css";
import { HEADER_HEIGHT } from "./utils/Constants.jsx";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const modalStyle = definePartsStyle({
	dialog: {
		mt: HEADER_HEIGHT, // Margin to account for header height
		bg: "gray.900", // Dark gray background for drawer dialog
		color: "white", // White text color
		boxShadow: "0 4px 12px rgba(255, 255, 255, 0.25)", // Subtle shadow
	},
	header: {
		bg: "gray.700", // Darker gray for header
		color: "white", // White text color
	},
	body: {
		p: 4, // Standard padding for modal body
		color: "white", // White text color
	},
	footer: {
		bg: "gray.700", // Darker gray for footer
		p: 2, // Standard padding for modal footer
		color: "white", // White text color
	},
});

export const modalTheme = defineMultiStyleConfig({
	baseStyle: modalStyle,
});

const drawerStyle = definePartsStyle({
	dialog: {
		mt: HEADER_HEIGHT, // Margin to account for header height
		bg: "gray.900", // Dark gray background for drawer dialog
		color: "white", // White text color
		boxShadow: "0 4px 12px rgba(255, 255, 255, 0.25)", // Subtle shadow
	},
	header: {
		bg: "gray.700", // Darker gray for header
		color: "white", // White text color
	},
	body: {
		p: 4, // Standard padding for drawer body
		color: "white", // White text color
	},
	footer: {
		bg: "gray.700", // Darker gray for footer
		p: 2, // Standard padding for drawer footer
		color: "white", // White text color
	},
});

export const drawerTheme = defineMultiStyleConfig({
	baseStyle: drawerStyle,
});

const config = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const theme = extendTheme({
	config,
	components: {
		Modal: modalTheme,
		Drawer: drawerTheme,
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ChakraProvider theme={theme}>
			<ColorModeScript initialColorMode={theme.config.initialColorMode} />
			<AppProvider>
				<App />
			</AppProvider>
		</ChakraProvider>
	</React.StrictMode>
);
