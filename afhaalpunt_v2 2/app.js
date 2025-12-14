import { renderApp } from "./src/renderApp.js";
window.__renderApp = (root) => renderApp(root || document.getElementById("app"));
import "./src/core/bootstrap.js";
