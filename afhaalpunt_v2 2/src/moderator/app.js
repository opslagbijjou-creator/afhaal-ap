import { State } from "../core/state.js";
import { renderShell } from "../core/shell.js";
import { renderModeratorHome } from "./pages/home.js";

export function renderModerator(root){
  renderShell(root, { subtitle: "Moderator" });
  const page = document.getElementById("page");
  renderModeratorHome(page);
}
