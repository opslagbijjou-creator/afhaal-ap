import { State } from "../../core/state.js";
import { startScanner, stopScanner } from "../../core/scanner.js";
import { beep, haptic, toast, escapeAttr, carrierName, formatDate } from "../../core/utils.js";
import { getPackages, savePackages } from "../../shared/data/storage.js";
import { freeLocation } from "../../shared/data/location.js";
import { nowISO } from "../../core/utils.js";

export function renderOphaal(el){
  const scanning = State.scanning;

  const scanBadge = scanning
    ? `<span class="badge"><span style="color:var(--ok);font-weight:900">●</span> Scanner aan</span>`
    : `<span class="badge">Scanner uit</span>`;

  const scannerBlock = scanning
    ? `<div id="scanner" class="scanBox"><div class="scanOverlay"></div><div class="scanLine"></div></div>`
    : `<div class="hint">Scanner staat uit. Druk op <strong>Start scan</strong>.</div>`;

  // detail view
  if(State.pickup.selected){
    const pkg = State.pickup.selected;
    const loc = pkg.location;
    el.innerHTML = `
      <div class="card stack" style="border-color: rgba(79,209,197,.35);">
        <div class="badge">✅ Gevonden — ${escapeAttr(carrierName(pkg.carrier))}</div>

        <div style="text-align:center;margin-top:6px;">
          <div style="font-size:54px;font-weight:900;letter-spacing:.5px">${loc.r} • ${loc.p} • ${loc.e}</div>
          <div class="brandTag">Rek • Positie • Etage</div>

          <div style="margin-top:10px;font-size:66px;font-weight:900;">${loc.sub}</div>
          <div class="brandTag">Subnummer</div>

          <div style="margin-top:14px;font-size:18px;font-weight:900;">
            ${escapeAttr(pkg.firstName)} ${escapeAttr(pkg.lastName)}
          </div>
          <div class="brandTag">${formatDate(pkg.storedAt)}</div>
        </div>

        <div class="btnRow">
          <button class="btn primary" id="pickedBtn">✅ Afgegeven</button>
          <button class="btn ghost" id="backBtn">Terug</button>
        </div>
      </div>
    `;

    el.querySelector("#backBtn").onclick = () => { State.pickup.selected = null; renderOphaal(el); };
    el.querySelector("#pickedBtn").onclick = () => markPickedUp(pkg.id);
    return;
  }

  el.innerHTML = `
    <div class="card stack">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:900;font-size:16px">Ophaal</div>
          <div class="brandTag">Scan QR/barcode of zoek op naam</div>
        </div>
        ${scanBadge}
      </div>

      <div id="scannerWrap">${scannerBlock}</div>

      <div class="btnRow">
        ${scanning
          ? `<button class="btn ghost" id="stopBtn">Stop scan</button>`
          : `<button class="btn primary" id="startBtn">Start scan</button>`
        }
        <button class="btn ghost" id="resetBtn">Reset</button>
      </div>

      <div class="hint">Als scan niets vindt: zoek op naam.</div>
    </div>

    <div class="card stack">
      <div style="font-weight:900">Zoek op naam</div>

      <div class="btnRow">
        <div style="flex:1">
          <div class="label">Voornaam</div>
          <input id="pickFirst" class="input" value="${escapeAttr(State.pickup.query.first)}" placeholder="Voornaam">
        </div>
        <div style="flex:1">
          <div class="label">Achternaam</div>
          <input id="pickLast" class="input" value="${escapeAttr(State.pickup.query.last)}" placeholder="Achternaam">
        </div>
      </div>

      <button class="btn primary" id="searchBtn">Zoeken</button>
      ${renderResults()}
    </div>
  `;

  const startBtn = el.querySelector("#startBtn");
  if(startBtn){
    startBtn.onclick = () => {
      State.scanning = true;
      renderOphaal(el);
      const target = el.querySelector("#scanner");
      if(!target){
        State.scanning = false;
        return renderOphaal(el);
      }
      startScanner(target, onDetected);
    };
  }
  const stopBtn = el.querySelector("#stopBtn");
  if(stopBtn){
    stopBtn.onclick = () => {
      stopScanner(); State.scanning = false; renderOphaal(el);
    };
  }

  el.querySelector("#resetBtn").onclick = () => {
    stopScanner(); State.scanning = false;
    State.pickup.selected = null;
    State.pickup.list = [];
    State.pickup.query = { first:"", last:"" };
    renderOphaal(el);
  };

  el.querySelector("#searchBtn").onclick = () => {
    State.pickup.query.first = (el.querySelector("#pickFirst")?.value || "").trim();
    State.pickup.query.last  = (el.querySelector("#pickLast")?.value || "").trim();
    const first = State.pickup.query.first.toLowerCase();
    const last  = State.pickup.query.last.toLowerCase();

    const all = getPackages();
    const matches = all.filter(p =>
      p.status === "stored" &&
      (!first || (p.firstName||"").toLowerCase().includes(first)) &&
      (!last  || (p.lastName||"").toLowerCase().includes(last))
    ).sort((a,b)=> (b.storedAt||"").localeCompare(a.storedAt||""));

    State.pickup.list = matches;
    toast(matches.length ? "Gevonden ✅" : "Niet gevonden ❌", !!matches.length);
    renderOphaal(el);
  };

  function onDetected(data){
    const code = data?.codeResult?.code;
    if(!code) return;
    beep(); haptic();
    stopScanner(); State.scanning = false;

    const all = getPackages();
    const found = all.find(p => p.status === "stored" && p.inboundCode === code);
    if(found){
      State.pickup.selected = found;
      toast("Gevonden ✅");
      renderOphaal(el);
    }else{
      toast("Niet gevonden — zoek op naam", false);
      renderOphaal(el);
    }
  }

  function renderResults(){
    if(!State.pickup.list.length) return ``;
    const items = State.pickup.list.slice(0, 12).map(pkg => {
      const loc = pkg.location;
      return `
        <div class="itemCard" data-id="${pkg.id}">
          <div class="itemTop">
            <div>
              <div class="itemName">${escapeAttr(pkg.firstName)} ${escapeAttr(pkg.lastName)}</div>
              <div class="itemMeta">${escapeAttr(carrierName(pkg.carrier))} • ${formatDate(pkg.storedAt)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:900;">${loc.r}-${loc.p}-${loc.e}</div>
              <div style="font-weight:900;font-size:18px;">${loc.sub}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `<div class="hint">Resultaten (${State.pickup.list.length}) — tik om te openen.</div>
            <div class="stack">${items}</div>`;
  }

  el.querySelectorAll(".itemCard[data-id]").forEach(card=>{
    card.onclick = () => {
      const id = card.getAttribute("data-id");
      const all = getPackages();
      const pkg = all.find(p=>p.id===id);
      if(!pkg) return toast("Niet gevonden", false);
      State.pickup.selected = pkg;
      renderOphaal(el);
    };
  });

  function markPickedUp(id){
    const all = getPackages();
    const idx = all.findIndex(p=>p.id===id);
    if(idx < 0) return toast("Niet gevonden", false);

    const pkg = all[idx];
    if(pkg.location) freeLocation(pkg.location);

    pkg.status = "picked_up";
    pkg.pickedUpAt = nowISO();
    all[idx] = pkg;
    savePackages(all);

    toast("Afgegeven ✅");
    State.pickup.selected = null;
    State.pickup.list = [];
    renderOphaal(el);
  }
}
