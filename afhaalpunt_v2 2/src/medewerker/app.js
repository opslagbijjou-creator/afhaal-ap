import { State } from "../core/state.js";
import { renderShell } from "../core/shell.js";
import { renderHome } from "./pages/home.js";
import { renderCarrierSelect } from "./inscan/carrier.js";
import { renderInscan } from "./inscan/inscan.js";
import { renderOphaal } from "./ophaal/ophaal.js";
import { renderOverzicht } from "./overzicht/overzicht.js";

export function renderMedewerker(root){
  renderShell(root, { subtitle: "Medewerker" });
  const page = document.getElementById("page");

  if(State.page === "home") return renderHome(page);
  if(State.page === "inscan.carrier") return renderCarrierSelect(page);
  if(State.page === "inscan") return renderInscan(page);
  if(State.page === "ophaal") return renderOphaal(page);
  if(State.page === "overzicht") return renderOverzicht(page);

  // fallback
  State.page = "home";
  renderHome(page);
}
