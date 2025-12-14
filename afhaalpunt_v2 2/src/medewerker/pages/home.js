import { State } from "../../core/state.js";
import { go } from "../../core/router.js";

export function renderHome(el){
  el.innerHTML = `
    <div class="card stack">
      <div style="font-weight:900;font-size:16px">Wat ga je doen?</div>
      <div class="brandTag">Kies je workflow.</div>

      <button class="btn primary" onclick="window.go('inscan.carrier')">📥 Inscannen (binnenkomst)</button>
      <button class="btn ghost" onclick="window.go('ophaal')">✅ Ophaal (scan of naam)</button>
      <button class="btn ghost" onclick="window.go('overzicht')">📊 Overzicht</button>

      <div class="hint">Tip: Inscannen werkt in batches per carrier.</div>
    </div>
  `;
}
