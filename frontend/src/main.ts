import "./style.css";
import App from "./App.svelte";
import { mount } from "svelte";
import { hydrateLocalStorage } from "./lib/persistence";

// load disk → localStorage before app init
await hydrateLocalStorage();

const app = mount(App, {
	target: document.getElementById("app")!,
});

export default app;
