import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { ChakraProvider, ColorModeScript, createMultiStyleConfigHelpers, extendTheme } from "@chakra-ui/react";
import "ag-grid-community/styles/ag-grid.min.css";
import "ag-grid-community/styles/ag-theme-balham.min.css";
import { AppProvider } from "./AppContext";
import "./css/main.css";
import { HEADER_HEIGHT } from "./utils/Constants.jsx";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const modalStyle = definePartsStyle({
	overlay: {
		bg: "blackAlpha.900",
	},
	dialog: {
		// mt: `${HEADER_HEIGHT_RAW + 20}px`,
		bg: "gray.900",
		color: "white",
		boxShadow: "rgba(255, 255, 255, 0.07) 0px 0px 20px 7px",
	},
	header: {
		bg: "gray.900",
		color: "white",
		borderRadius: "20px",
		p: 4,
	},
	body: {
		p: 4,
		color: "white",
	},
	footer: {
		bg: "gray.900",
		p: 4,
		color: "white",
		borderRadius: "20px",
	},
});

export const Modal = defineMultiStyleConfig({
	baseStyle: modalStyle,
});

const drawerStyle = definePartsStyle({
	overlay: {
		bg: "blackAlpha.900",
	},
	dialog: {
		mt: HEADER_HEIGHT,
		bg: "gray.900",
		color: "white",
		boxShadow: "rgba(255, 255, 255, 0.07) 0px 0px 20px 7px",
	},
	header: {
		bg: "gray.900",
		color: "white",
		borderRadius: "20px",
		p: 4,
	},
	body: {
		p: 4,
		color: "white",
	},
	footer: {
		bg: "gray.900",
		p: 2,
		color: "white",
		borderRadius: "20px",
	},
});

export const Drawer = defineMultiStyleConfig({
	baseStyle: drawerStyle,
});

const config = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const theme = extendTheme({
	config,
	components: {
		Modal,
		Drawer,
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
