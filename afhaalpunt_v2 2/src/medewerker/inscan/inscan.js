import { State } from "../../core/state.js";
import { startScanner, stopScanner } from "../../core/scanner.js";
import { beep, haptic, toast, escapeAttr, carrierName } from "../../core/utils.js";
import { findFirstFreeLocation, reserveLocation } from "../../shared/data/location.js";
import { getPackages, savePackages } from "../../shared/data/storage.js";
import { nowISO } from "../../core/utils.js";

export function renderInscan(el){
  const carrier = carrierName(State.batchCarrier);

  const scanning = State.scanning;
  const scanBadge = scanning
    ? `<span class="badge"><span style="color:var(--ok);font-weight:900">●</span> Scanner aan</span>`
    : `<span class="badge">Scanner uit</span>`;

  const scannerBlock = scanning
    ? `<div id="scanner" class="scanBox"><div class="scanOverlay"></div><div class="scanLine"></div></div>`
    : `<div class="hint">Scanner staat uit. Druk op <strong>Start scan</strong>.</div>`;

  const afterScan = State.inbound.barcode ? renderAfterScan() : `
    <div class="hint">Scan een pakket van <strong>${escapeAttr(carrier)}</strong>. Daarna vragen we naam en kiezen we een plek.</div>
  `;

  el.innerHTML = `
    <div class="card stack">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:900;font-size:16px">Inscannen — ${escapeAttr(carrier)}</div>
          <div class="brandTag">Batch-modus actief</div>
        </div>
        ${scanBadge}
      </div>

      <div id="scannerWrap">${scannerBlock}</div>

      <div>
        <div class="label">Barcode</div>
        <input class="input" value="${escapeAttr(State.inbound.barcode||"")}" placeholder="Nog niets gescand…" readonly>
      </div>

      <div class="btnRow">
        ${scanning
          ? `<button class="btn ghost" id="stopBtn">Stop scan</button>`
          : `<button class="btn primary" id="startBtn">Start scan</button>`
        }
        <button class="btn ghost" id="newBtn">Nieuwe scan</button>
      </div>

      <div class="btnRow">
        <button class="btn ghost" onclick="window.go('inscan.carrier')">Carrier wisselen</button>
        <button class="btn danger" id="stopBatchBtn">Stop batch</button>
      </div>
    </div>

    ${afterScan}
  `;

  const startBtn = el.querySelector("#startBtn");
  if(startBtn){
    startBtn.onclick = () => {
      // render again to show scanner box
      State.scanning = true;
      renderInscan(el);
      const target = el.querySelector("#scanner");
      if(!target){
        State.scanning = false;
        return renderInscan(el);
      }
      startScanner(target, onDetected);
    };
  }
  const stopBtn = el.querySelector("#stopBtn");
  if(stopBtn){
    stopBtn.onclick = () => {
      stopScanner();
      State.scanning = false;
      renderInscan(el);
    };
  }

  el.querySelector("#newBtn").onclick = () => {
    stopScanner(); State.scanning = false;
    State.inbound.barcode = null;
    State.inbound.firstName = "";
    State.inbound.lastName = "";
    State.inbound.note = "";
    State.inbound.suggestedLoc = null;
    State.inbound.showManual = false;
    State.inbound.manual = { r:"", p:"", e:"", sub:"" };
    renderInscan(el);
  };

  el.querySelector("#stopBatchBtn").onclick = () => {
    State.batchCarrier = null;
    stopScanner(); State.scanning = false;
    window.go("inscan.carrier");
  };

  function onDetected(data){
    const code = data?.codeResult?.code;
    if(!code) return;
    State.inbound.barcode = code;
    beep(); haptic();
    toast("Gescand ✅");
    stopScanner();
    State.scanning = false;
    State.inbound.suggestedLoc = null;
    renderInscan(el);
    setTimeout(()=>el.querySelector("#firstName")?.focus(), 120);
  }

  function renderAfterScan(){
    const loc = State.inbound.suggestedLoc;
    return `
      <div class="card stack">
        <div style="font-weight:900">Gegevens (verplicht)</div>

        <div>
          <div class="label">Voornaam *</div>
          <input id="firstName" class="input" value="${escapeAttr(State.inbound.firstName)}" placeholder="Voornaam" autocomplete="off">
        </div>

        <div>
          <div class="label">Achternaam *</div>
          <input id="lastName" class="input" value="${escapeAttr(State.inbound.lastName)}" placeholder="Achternaam" autocomplete="off">
        </div>

        <div>
          <div class="label">Notitie (optioneel)</div>
          <input id="noteText" class="input" value="${escapeAttr(State.inbound.note)}" placeholder="Bijv. doos beschadigd">
        </div>

        <button class="btn primary" id="checkBtn">Check plek</button>

        ${loc ? renderSuggestion(loc) : ``}
      </div>
    `;
  }

  function readInputs(){
    State.inbound.firstName = el.querySelector("#firstName")?.value?.trim() || "";
    State.inbound.lastName = el.querySelector("#lastName")?.value?.trim() || "";
    State.inbound.note = el.querySelector("#noteText")?.value?.trim() || "";
  }

  const checkBtn = el.querySelector("#checkBtn");
  if(checkBtn){
    checkBtn.onclick = () => {
      readInputs();
      if(!State.inbound.barcode) return toast("Scan eerst een barcode", false);
      if(!State.inbound.firstName || !State.inbound.lastName) return toast("Voornaam + achternaam verplicht", false);
      const found = findFirstFreeLocation();
      if(!found) return toast("Alles vol ❌", false);
      State.inbound.suggestedLoc = found;
      toast("Plek gevonden ✅");
      renderInscan(el);
    };
  }

  function renderSuggestion(loc){
    return `
      <div class="card stack" style="border-color: rgba(79,209,197,.30);">
        <div class="badge">✅ Zet op: <strong style="color:var(--text)">${loc.r} • ${loc.p} • ${loc.e}</strong></div>

        <div style="text-align:center;">
          <div style="font-size:46px;font-weight:900;letter-spacing:.5px">${loc.sub}</div>
          <div class="brandTag">Subnummer (laagst vrij)</div>
        </div>

        <div class="btnRow">
          <button class="btn primary" id="doneBtn">Gedaan</button>
        </div>
      </div>
    `;
  }

  const doneBtn = el.querySelector("#doneBtn");
  if(doneBtn){
    doneBtn.onclick = () => {
      readInputs();
      if(!State.inbound.suggestedLoc) return toast("Geen plek gekozen", false);

      const ok = reserveLocation(State.inbound.suggestedLoc);
      if(!ok) return toast("Deze plek/sub is bezet ❌", false);

      const pkg = {
        id: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
        carrier: State.batchCarrier,
        inboundCode: State.inbound.barcode,
        firstName: State.inbound.firstName,
        lastName: State.inbound.lastName,
        note: State.inbound.note || "",
        status: "stored",
        storedAt: nowISO(),
        pickedUpAt: null,
        missing: false,
        location: { ...State.inbound.suggestedLoc }
      };

      const arr = getPackages();
      arr.unshift(pkg);
      savePackages(arr);

      toast(`Opgeslagen ✅`);

      // klaar voor volgende
      State.inbound.barcode = null;
      State.inbound.firstName = "";
      State.inbound.lastName = "";
      State.inbound.note = "";
      State.inbound.suggestedLoc = null;
      renderInscan(el);
    };
  }
}
