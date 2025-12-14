import { escapeAttr } from "../../core/utils.js";
import { getLayout } from "../../shared/data/storage.js";

export function renderModeratorHome(el){
  const layout = getLayout();
  el.innerHTML = `
    <div class="card stack">
      <div style="font-weight:900;font-size:16px">Moderator</div>
      <div class="brandTag">Layout beheer komt hier (rek/posities/etages/subs)</div>

      <div class="itemCard">
        <div class="itemTop">
          <div>
            <div class="itemName">Huidig layout</div>
            <div class="itemMeta">v1 (localStorage)</div>
          </div>
          <div style="text-align:right;font-weight:900">
            ${escapeAttr(layout.racks)} rek • ${escapeAttr(layout.positionsPerRack)} pos
          </div>
        </div>
      </div>

      <div class="hint">Zeg maar: “maak layout editor”, dan bouw ik dit scherm af.</div>
    </div>
  `;
}
