import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// import "ag-grid-community/styles/ag-grid.min.css";
// import "ag-grid-community/styles/ag-theme-balham.min.css";
import { AppProvider } from "./AppContext.jsx";
import "./css/main.css";
import { Provider } from "./components/ui/provider.jsx";


ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<Provider>
			<AppProvider>
				<App />
			</AppProvider>
		</Provider>
	</React.StrictMode>
);
