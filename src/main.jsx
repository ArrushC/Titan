import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AppProvider } from "./AppContext";
import "./css/main.css";

const config = {
	initialColorMode: "dark",
	useSystemColorMode: false,
};

const theme = extendTheme({ config });

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
