import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppProvider } from "./ContextApp.jsx";
import "./css/main.css";
import { Provider } from "./components/ui/provider.jsx";

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<Provider>
			<AppProvider>
				<App />
			</AppProvider>
		</Provider>
	</React.StrictMode>
);
