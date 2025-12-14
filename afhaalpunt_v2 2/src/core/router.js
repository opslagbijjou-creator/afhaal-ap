import { State } from "./state.js";
import { stopScanner } from "./scanner.js";

export function go(to){
  stopScanner();
  State.scanning = false;
  State.page = to;
  window.__renderApp?.();
}
window.go = go;
