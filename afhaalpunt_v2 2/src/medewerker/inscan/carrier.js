import { CARRIERS } from "../../core/config.js";
import { State } from "../../core/state.js";
import { carrierName, escapeAttr, toast } from "../../core/utils.js";

export function renderCarrierSelect(el){
  const current = State.batchCarrier ? carrierName(State.batchCarrier) : "Geen carrier gekozen";
  el.innerHTML = `
    <div class="card stack">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:900;font-size:16px">Inscannen — Carrier kiezen</div>
          <div class="brandTag">Kies eerst welke stapel je verwerkt.</div>
        </div>
        <span class="badge">${escapeAttr(current)}</span>
      </div>

      <div class="hint">Na kiezen blijft de carrier actief tot je wisselt.</div>

      <div class="stack">
        ${CARRIERS.map(c => `
          <button class="btn ${State.batchCarrier===c.id ? 'primary' : 'ghost'}" data-id="${c.id}">
            ${escapeAttr(c.name)}
          </button>
        `).join("")}
      </div>

      <button class="btn primary" id="startBtn">➡️ Start inscannen</button>
    </div>
  `;

  el.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.onclick = () => {
      State.batchCarrier = btn.getAttribute("data-id");
      toast(`Carrier: ${carrierName(State.batchCarrier)}`);
      renderCarrierSelect(el);
    };
  });

  el.querySelector("#startBtn").onclick = () => {
    if(!State.batchCarrier) return toast("Kies eerst een carrier", false);
    // reset inbound state
    State.inbound.barcode = null;
    State.inbound.firstName = "";
    State.inbound.lastName = "";
    State.inbound.note = "";
    State.inbound.suggestedLoc = null;
    State.inbound.showManual = false;
    State.inbound.manual = { r:"", p:"", e:"", sub:"" };
    window.go("inscan");
  };
}
