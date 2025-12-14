import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const root = document.getElementById("app");

// ======================== CONFIG (later admin) ========================
const CARRIERS = [
  { id: "postnl", name: "PostNL" },
  { id: "dhl", name: "DHL" },
  { id: "mondial", name: "Mondial Relay" },
  { id: "vintedgo", name: "Vinted Go" },
  { id: "dpd", name: "DPD" },
  { id: "ups", name: "UPS" }
];

// Rek/Positie/Etage model
const DEFAULT_LAYOUT = {
  racks: 5,               // rek 1..5
  positionsPerRack: 10,   // positie 1..10 per rek
  levelsPerPosition: 4,   // etage 1..4 per positie
  maxSubPerSlot: 30       // subnummer 1..30 per (rek,positie,etage)
};

// ======================== STATE ========================
let currentEmail = "";
let scanning = false;

let page = "home"; // home | inboundCarrier | inboundScan | pickup | customerDropoff | overview
let batchCarrier = null; // carrier.id, blijft staan bij inbound batch

// inbound form state
let lastBarcode = null;
let firstName = "";
let lastName = "";
let noteText = "";
let suggestedLoc = null; // {r,p,e,sub}
let showManual = false;
let manualR = "";
let manualP = "";
let manualE = "";
let manualSub = "";

// pickup state
let pickupQuery = { first: "", last: "" };
let pickupFound = null; // selected package object
let pickupList = [];    // list of packages for name search

// ======================== STORAGE ========================
function getLayout(){
  return JSON.parse(localStorage.getItem("layout") || JSON.stringify(DEFAULT_LAYOUT));
}
function saveLayout(layout){
  localStorage.setItem("layout", JSON.stringify(layout));
}

function getPackages(){
  return JSON.parse(localStorage.getItem("packages") || "[]");
}
function savePackages(arr){
  localStorage.setItem("packages", JSON.stringify(arr));
}

// occupancy map per slot: key "r-p-e" => boolean array of used subs or a set-like object
// We store: { "1-2-3": { "1": true, "2": true, ... } }
function getOcc(){
  return JSON.parse(localStorage.getItem("occRPE") || "{}");
}
function saveOcc(occ){
  localStorage.setItem("occRPE", JSON.stringify(occ));
}

// ======================== HELPERS ========================
function nameFromEmail(email){
  if(!email) return "Medewerker";
  const base = email.split("@")[0] || "medewerker";
  return base
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function escapeAttr(v){
  return String(v ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function toast(text, ok=true){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="dot" style="background:${ok ? "rgba(52,211,153,.95)" : "rgba(251,113,133,.95)"}"></span><span>${text}</span>`;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1100);
}

function beep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 120);
  }catch(e){}
}

function haptic(){
  try{ navigator.vibrate?.([60,30,60]); }catch(e){}
}

function nowISO(){
  return new Date().toISOString();
}
function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString("nl-NL");
  }catch(e){
    return iso?.slice(0,10) || "";
  }
}

function carrierName(id){
  return (CARRIERS.find(c=>c.id===id)?.name) || id || "-";
}

function slotKey(r,p,e){ return `${r}-${p}-${e}`; }

// ======================== LOCATION ALGO ========================
// Find first slot that has a free sub, then choose LOWEST free sub
function findFirstFreeLocation(){
  const layout = getLayout();
  const occ = getOcc();

  for(let r=1; r<=layout.racks; r++){
    for(let p=1; p<=layout.positionsPerRack; p++){
      for(let e=1; e<=layout.levelsPerPosition; e++){
        const key = slotKey(r,p,e);
        const used = occ[key] || {};
        for(let sub=1; sub<=layout.maxSubPerSlot; sub++){
          if(!used[String(sub)]) {
            return { r, p, e, sub };
          }
        }
      }
    }
  }
  return null; // alles vol
}

// Reserve a sub in a slot (only if free)
function reserveLocation(loc){
  const layout = getLayout();
  const occ = getOcc();
  const key = slotKey(loc.r, loc.p, loc.e);
  const used = occ[key] || {};

  const sub = Number(loc.sub);
  if(!Number.isFinite(sub) || sub < 1 || sub > layout.maxSubPerSlot) return false;
  if(used[String(sub)]) return false;

  used[String(sub)] = true;
  occ[key] = used;
  saveOcc(occ);
  return true;
}

// Free a sub when package is picked up
function freeLocation(loc){
  const occ = getOcc();
  const key = slotKey(loc.r, loc.p, loc.e);
  const used = occ[key] || {};
  delete used[String(loc.sub)];
  occ[key] = used;
  saveOcc(occ);
}

// ======================== AUTH ========================
onAuthStateChanged(auth, (user) => {
  if(!user) return renderLogin();
  currentEmail = user.email || "";
  renderApp();
});

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(e){
    toast("Login fout", false);
  }
};

window.logout = async () => {
  stopScanner();
  await signOut(auth);
};

// ======================== ROOT UI SHELL ========================
function renderLogin(){
  root.innerHTML = `
    <div class="container">
      <div class="card stack">
        <div>
          <div class="brandName">Afhaalpunt</div>
          <div class="brandTag">Scan • Opslaan • Afgeven</div>
        </div>

        <div>
          <div class="label">Email</div>
          <input id="email" class="input" placeholder="naam@bedrijf.nl">
        </div>

        <div>
          <div class="label">Wachtwoord</div>
          <input id="password" type="password" class="input" placeholder="••••••••">
        </div>

        <button class="btn primary" onclick="login()">Inloggen</button>
        <div class="hint">Gebruik je Firebase account (email + wachtwoord).</div>
      </div>
    </div>
  `;
}

function renderApp(){
  const name = nameFromEmail(currentEmail);

  root.innerHTML = `
    <div class="container">
      <div class="topbar">
        <div class="brandLeft">
          <div class="brandMark"></div>
          <div>
            <div class="brandName">Afhaalpunt</div>
            <div class="brandTag">Werkflow: Inscannen • Ophaal • Overzicht</div>
          </div>
        </div>

        <div class="userPill" onclick="toggleMenu()">
          <span>👤</span>
          <span class="name">${escapeAttr(name)}</span>
        </div>
      </div>

      <div id="userMenu" class="card" style="display:none">
        <div class="badge">Ingelogd als <strong style="color:var(--text)">${escapeAttr(name)}</strong></div>
        <div style="height:10px"></div>
        <div class="hint">${escapeAttr(currentEmail)}</div>
        <div style="height:10px"></div>
        <button class="btn danger" onclick="logout()">Uitloggen</button>
      </div>

      <div id="page" class="stack"></div>
    </div>

    <div class="nav">
      <div class="navInner">
        <button class="navBtn ${page==='home'?'active':''}" onclick="go('home')">🏠 Menu</button>
        <button class="navBtn ${page.startsWith('inbound')?'active':''}" onclick="go('inboundCarrier')">📥 Inscannen</button>
        <button class="navBtn ${page==='pickup'?'active':''}" onclick="go('pickup')">✅ Ophaal</button>
        <button class="navBtn ${page==='overview'?'active':''}" onclick="go('overview')">📊 Overzicht</button>
      </div>
    </div>
  `;

  // default
  go(page || "home");
}

window.toggleMenu = () => {
  const m = document.getElementById("userMenu");
  if(!m) return;
  m.style.display = (m.style.display === "none") ? "block" : "none";
};

// ======================== ROUTING ========================
window.go = (to) => {
  stopScanner();
  scanning = false;
  page = to;

  if(to === "home") return renderHome();
  if(to === "inboundCarrier") return renderInboundCarrier();
  if(to === "inboundScan") return renderInboundScan();
  if(to === "pickup") return renderPickup();
  if(to === "overview") return renderOverview();

  // fallback
  renderHome();
};

// ======================== HOME ========================
function renderHome(){
  const p = document.getElementById("page");
  p.innerHTML = `
    <div class="card stack">
      <div style="font-weight:900;font-size:16px">Wat ga je doen?</div>
      <div class="brandTag">Kies een workflow.</div>

      <button class="btn primary" onclick="go('inboundCarrier')">📥 Inscannen (binnenkomst)</button>
      <button class="btn ghost" onclick="go('pickup')">✅ Ophaal (scan of naam)</button>
      <button class="btn ghost" onclick="toast('Klant afgifte komt hierna 👀')">📤 Klant afgifte (later)</button>
      <button class="btn ghost" onclick="go('overview')">📊 Overzicht</button>

      <div class="hint">
        Tip: Inscannen werkt in batches per carrier (PostNL eerst, daarna Mondial, etc).
      </div>
    </div>
  `;
}

// ======================== INBOUND: CARRIER SELECT ========================
function renderInboundCarrier(){
  const p = document.getElementById("page");
  const current = batchCarrier ? carrierName(batchCarrier) : "Geen carrier gekozen";

  p.innerHTML = `
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
          <button class="btn ${batchCarrier===c.id ? 'primary' : 'ghost'}" onclick="setCarrier('${c.id}')">
            ${escapeAttr(c.name)}
          </button>
        `).join("")}
      </div>

      <button class="btn primary" onclick="startBatch()">➡️ Start inscannen</button>
    </div>
  `;
}

window.setCarrier = (id) => {
  batchCarrier = id;
  toast(`Carrier: ${carrierName(id)}`);
  renderInboundCarrier();
};

window.startBatch = () => {
  if(!batchCarrier){
    toast("Kies eerst een carrier", false);
    return;
  }
  // reset inbound form
  lastBarcode = null; firstName=""; lastName=""; noteText="";
  suggestedLoc = null; showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";
  pickupFound = null; pickupList = [];
  go("inboundScan");
};

// ======================== INBOUND: SCAN + NAME + LOCATION ========================
function renderInboundScan(){
  const p = document.getElementById("page");
  const carrier = carrierName(batchCarrier);

  const scanBadge = scanning
    ? `<span class="badge"><span style="color:var(--ok);font-weight:900">●</span> Scanner aan</span>`
    : `<span class="badge">Scanner uit</span>`;

  const scannerBlock = scanning
    ? `
      <div id="scanner" class="scanBox">
        <div class="scanOverlay"></div>
        <div class="scanLine"></div>
      </div>
    `
    : `<div class="hint">Scanner staat uit. Druk op <strong>Start scan</strong>.</div>`;

  const afterScanBlock = lastBarcode ? `
    <div class="card stack">
      <div style="font-weight:900">Gegevens (verplicht)</div>

      <div>
        <div class="label">Voornaam *</div>
        <input id="firstName" class="input" value="${escapeAttr(firstName)}" placeholder="Voornaam" autocomplete="off">
      </div>

      <div>
        <div class="label">Achternaam *</div>
        <input id="lastName" class="input" value="${escapeAttr(lastName)}" placeholder="Achternaam" autocomplete="off">
      </div>

      <div>
        <div class="label">Notitie (optioneel)</div>
        <input id="noteText" class="input" value="${escapeAttr(noteText)}" placeholder="Bijv. doos beschadigd">
      </div>

      <button class="btn primary" onclick="checkLocation()">Check plek</button>

      ${suggestedLoc ? renderInboundSuggestion() : ``}
    </div>
  ` : `
    <div class="hint">
      Scan een pakket van <strong>${escapeAttr(carrier)}</strong>. Daarna vragen we naam en kiezen we automatisch (Rek, Positie, Etage, Sub).
    </div>
  `;

  p.innerHTML = `
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
        <input id="barcode" class="input" value="${escapeAttr(lastBarcode||"")}" placeholder="Nog niets gescand…" readonly>
      </div>

      <div class="btnRow">
        ${scanning
          ? `<button class="btn ghost" onclick="stopScanner()">Stop scan</button>`
          : `<button class="btn primary" onclick="startScanner()">Start scan</button>`
        }
        <button class="btn ghost" onclick="clearInbound()">Nieuwe scan</button>
      </div>

      <div class="btnRow">
        <button class="btn ghost" onclick="go('inboundCarrier')">Carrier wisselen</button>
        <button class="btn danger" onclick="stopBatch()">Stop batch</button>
      </div>
    </div>

    ${afterScanBlock}
  `;
}

window.stopBatch = () => {
  batchCarrier = null;
  clearInbound();
  go("inboundCarrier");
};

window.clearInbound = () => {
  stopScanner();
  scanning = false;

  lastBarcode = null;
  firstName = "";
  lastName = "";
  noteText = "";
  suggestedLoc = null;
  showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";
  renderInboundScan();
};

function readInboundInputs(){
  firstName = document.getElementById("firstName")?.value?.trim() || "";
  lastName = document.getElementById("lastName")?.value?.trim() || "";
  noteText = document.getElementById("noteText")?.value?.trim() || "";
}

window.checkLocation = () => {
  readInboundInputs();

  if(!lastBarcode) return toast("Scan eerst een barcode", false);
  if(!firstName || !lastName) return toast("Voornaam + achternaam verplicht", false);

  const loc = findFirstFreeLocation();
  if(!loc){
    suggestedLoc = null;
    return toast("Alles vol ❌", false);
  }

  suggestedLoc = loc;
  showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";
  toast("Plek gevonden ✅");
  renderInboundScan();

  setTimeout(() => {
    document.querySelector("button[onclick='confirmInboundDone()']")?.scrollIntoView({ behavior:"smooth", block:"center" });
  }, 100);
};

function renderInboundSuggestion(){
  const loc = suggestedLoc;
  return `
    <div class="card stack" style="border-color: rgba(79,209,197,.30);">
      <div class="badge">
        ✅ Zet op: <strong style="color:var(--text)">${loc.r} • ${loc.p} • ${loc.e}</strong>
      </div>

      <div style="text-align:center;">
        <div style="font-size:46px;font-weight:900;letter-spacing:.5px">${loc.sub}</div>
        <div class="brandTag">Subnummer (laagst vrij)</div>
      </div>

      <div class="btnRow">
        <button class="btn primary" onclick="confirmInboundDone()">Gedaan</button>
        <button class="btn ghost" onclick="toggleManualLoc()">Andere plek</button>
      </div>

      ${showManual ? renderManualLoc() : ``}
    </div>
  `;
}

window.toggleManualLoc = () => {
  showManual = !showManual;
  renderInboundScan();
  if(showManual){
    setTimeout(()=>document.getElementById("manR")?.focus(), 120);
  }
};

function renderManualLoc(){
  const layout = getLayout();
  return `
    <div class="card stack" style="background: rgba(0,0,0,.18);">
      <div style="font-weight:900">Andere plek (alles verplicht)</div>

      <div class="btnRow">
        <div style="flex:1">
          <div class="label">Rek *</div>
          <input id="manR" class="input" inputmode="numeric" pattern="[0-9]*" value="${escapeAttr(manualR)}" placeholder="1..${layout.racks}">
        </div>
        <div style="flex:1">
          <div class="label">Positie *</div>
          <input id="manP" class="input" inputmode="numeric" pattern="[0-9]*" value="${escapeAttr(manualP)}" placeholder="1..${layout.positionsPerRack}">
        </div>
      </div>

      <div class="btnRow">
        <div style="flex:1">
          <div class="label">Etage *</div>
          <input id="manE" class="input" inputmode="numeric" pattern="[0-9]*" value="${escapeAttr(manualE)}" placeholder="1..${layout.levelsPerPosition}">
        </div>
        <div style="flex:1">
          <div class="label">Sub *</div>
          <input id="manSub" class="input" inputmode="numeric" pattern="[0-9]*" value="${escapeAttr(manualSub)}" placeholder="1..${layout.maxSubPerSlot}">
        </div>
      </div>

      <button class="btn primary" onclick="confirmInboundManual()">Opslaan met deze plek</button>
      <div class="hint">Alleen als je écht handmatig wil overrulen.</div>
    </div>
  `;
}

window.confirmInboundDone = () => {
  readInboundInputs();
  if(!lastBarcode) return toast("Geen barcode", false);
  if(!firstName || !lastName) return toast("Naam ontbreekt", false);
  if(!suggestedLoc) return toast("Geen plek gekozen", false);

  const ok = reserveLocation(suggestedLoc);
  if(!ok){
    toast("Deze plek/sub is net bezet ❌", false);
    suggestedLoc = null;
    renderInboundScan();
    return;
  }

  const pkg = {
    id: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
    type: "carrier_inbound",
    carrier: batchCarrier,
    inboundCode: lastBarcode,
    firstName,
    lastName,
    note: noteText || "",
    status: "stored",
    storedAt: nowISO(),
    pickedUpAt: null,
    missing: false,
    notifyPhone: "",
    location: { ...suggestedLoc }
  };

  const arr = getPackages();
  arr.unshift(pkg);
  savePackages(arr);

  toast(`Opgeslagen: ${suggestedLoc.r}-${suggestedLoc.p}-${suggestedLoc.e} • ${suggestedLoc.sub} ✅`);

  // klaar voor volgende pakket (batch)
  lastBarcode = null;
  firstName = "";
  lastName = "";
  noteText = "";
  suggestedLoc = null;
  showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";
  renderInboundScan();
};

window.confirmInboundManual = () => {
  readInboundInputs();

  manualR = (document.getElementById("manR")?.value || "").trim();
  manualP = (document.getElementById("manP")?.value || "").trim();
  manualE = (document.getElementById("manE")?.value || "").trim();
  manualSub = (document.getElementById("manSub")?.value || "").trim();

  if(!lastBarcode) return toast("Geen barcode", false);
  if(!firstName || !lastName) return toast("Naam ontbreekt", false);
  if(!manualR || !manualP || !manualE || !manualSub) return toast("Alles invullen", false);
  if(!/^\d+$/.test(manualR+manualP+manualE+manualSub)) return toast("Alleen cijfers", false);

  const layout = getLayout();
  const r = Number(manualR), p = Number(manualP), e = Number(manualE), sub = Number(manualSub);

  if(r<1 || r>layout.racks) return toast("Rek buiten bereik", false);
  if(p<1 || p>layout.positionsPerRack) return toast("Positie buiten bereik", false);
  if(e<1 || e>layout.levelsPerPosition) return toast("Etage buiten bereik", false);
  if(sub<1 || sub>layout.maxSubPerSlot) return toast("Sub buiten bereik", false);

  const loc = { r,p,e,sub };
  const ok = reserveLocation(loc);
  if(!ok) return toast("Die sub is bezet ❌", false);

  const pkg = {
    id: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
    type: "carrier_inbound",
    carrier: batchCarrier,
    inboundCode: lastBarcode,
    firstName,
    lastName,
    note: noteText || "",
    status: "stored",
    storedAt: nowISO(),
    pickedUpAt: null,
    missing: false,
    notifyPhone: "",
    location: { ...loc }
  };

  const arr = getPackages();
  arr.unshift(pkg);
  savePackages(arr);

  toast(`Opgeslagen (manual) ✅`);

  // klaar voor volgende
  lastBarcode = null;
  firstName = "";
  lastName = "";
  noteText = "";
  suggestedLoc = null;
  showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";
  renderInboundScan();
};

// ======================== PICKUP ========================
function renderPickup(){
  const p = document.getElementById("page");

  const scanBadge = scanning
    ? `<span class="badge"><span style="color:var(--ok);font-weight:900">●</span> Scanner aan</span>`
    : `<span class="badge">Scanner uit</span>`;

  const scannerBlock = scanning
    ? `
      <div id="scanner" class="scanBox">
        <div class="scanOverlay"></div>
        <div class="scanLine"></div>
      </div>
    `
    : `<div class="hint">Scanner staat uit. Druk op <strong>Start scan</strong>.</div>`;

  // If a package is selected -> show BIG screen
  if(pickupFound){
    const loc = pickupFound.location;
    return p.innerHTML = `
      <div class="card stack" style="border-color: rgba(79,209,197,.35);">
        <div class="badge">
          ✅ Gevonden — ${escapeAttr(carrierName(pickupFound.carrier))}
          ${pickupFound.missing ? ` • <span style="color:var(--danger);font-weight:900">WAS MISSING</span>` : ``}
        </div>

        <div style="text-align:center;margin-top:6px;">
          <div style="font-size:54px;font-weight:900;letter-spacing:.5px">${loc.r} • ${loc.p} • ${loc.e}</div>
          <div class="brandTag">Rek • Positie • Etage</div>

          <div style="margin-top:10px;font-size:66px;font-weight:900;">${loc.sub}</div>
          <div class="brandTag">Subnummer</div>

          <div style="margin-top:14px;font-size:18px;font-weight:900;">
            ${escapeAttr(pickupFound.firstName)} ${escapeAttr(pickupFound.lastName)}
          </div>
          <div class="brandTag">${formatDate(pickupFound.storedAt)}</div>
        </div>

        <div class="btnRow">
          <button class="btn primary" onclick="markPickedUp('${pickupFound.id}')">✅ Afgegeven</button>
          <button class="btn ghost" onclick="backToPickup()">Terug</button>
        </div>

        ${pickupFound.missing ? `
          <div class="hint">
            Dit pakket stond op <strong>Missing</strong>. Je kunt later een "Stuur bericht" knop krijgen (SMS provider nodig).
          </div>
        ` : ``}
      </div>
    `;
  }

  // otherwise show scan + name search
  p.innerHTML = `
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
          ? `<button class="btn ghost" onclick="stopScanner()">Stop scan</button>`
          : `<button class="btn primary" onclick="startScannerPickup()">Start scan</button>`
        }
        <button class="btn ghost" onclick="clearPickup()">Reset</button>
      </div>

      <div class="hint">
        Als scan niets vindt: zoek op naam. Als dat ook niets vindt: Missing.
      </div>
    </div>

    <div class="card stack">
      <div style="font-weight:900">Zoek op naam</div>

      <div class="btnRow">
        <div style="flex:1">
          <div class="label">Voornaam</div>
          <input id="pickFirst" class="input" value="${escapeAttr(pickupQuery.first)}" placeholder="Voornaam">
        </div>
        <div style="flex:1">
          <div class="label">Achternaam</div>
          <input id="pickLast" class="input" value="${escapeAttr(pickupQuery.last)}" placeholder="Achternaam">
        </div>
      </div>

      <button class="btn primary" onclick="searchByName()">Zoeken</button>

      ${renderPickupResults()}
    </div>
  `;
};

function renderPickupResults(){
  if(!pickupList.length) return ``;

  const items = pickupList.slice(0, 12).map(pkg => {
    const loc = pkg.location;
    return `
      <div class="itemCard" onclick="openPickup('${pkg.id}')">
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

  return `
    <div class="hint">Resultaten (${pickupList.length}) — tik om te openen.</div>
    <div class="stack">${items}</div>
  `;
}

window.backToPickup = () => {
  pickupFound = null;
  renderPickup();
};

window.clearPickup = () => {
  stopScanner();
  scanning = false;
  pickupFound = null;
  pickupList = [];
  pickupQuery = { first:"", last:"" };
  renderPickup();
};

window.searchByName = () => {
  pickupQuery.first = (document.getElementById("pickFirst")?.value || "").trim();
  pickupQuery.last  = (document.getElementById("pickLast")?.value || "").trim();

  const first = pickupQuery.first.toLowerCase();
  const last  = pickupQuery.last.toLowerCase();

  const all = getPackages();
  const matches = all.filter(p =>
    p.status === "stored" &&
    (!first || (p.firstName||"").toLowerCase().includes(first)) &&
    (!last  || (p.lastName||"").toLowerCase().includes(last))
  );

  // meest recent bovenaan (storedAt)
  matches.sort((a,b)=> (b.storedAt||"").localeCompare(a.storedAt||""));

  pickupList = matches;
  if(!matches.length){
    toast("Niet gevonden ❌", false);
  }else{
    toast("Gevonden ✅");
  }
  renderPickup();
};

window.openPickup = (id) => {
  const all = getPackages();
  const pkg = all.find(p=>p.id===id);
  if(!pkg){
    toast("Niet gevonden", false);
    return;
  }
  pickupFound = pkg;
  stopScanner();
  scanning = false;
  renderPickup();
};

window.markPickedUp = (id) => {
  const all = getPackages();
  const idx = all.findIndex(p=>p.id===id);
  if(idx < 0) return toast("Niet gevonden", false);

  const pkg = all[idx];

  // free subnumber
  if(pkg.location){
    freeLocation(pkg.location);
  }

  pkg.status = "picked_up";
  pkg.pickedUpAt = nowISO();

  // Als hij missing was: laat missing false (historie), maar status picked_up is genoeg.
  all[idx] = pkg;
  savePackages(all);

  toast("Afgegeven ✅");
  pickupFound = null;
  pickupList = [];
  renderPickup();
};

// ======================== PICKUP SCAN LOOKUP ========================
window.startScannerPickup = () => {
  if(scanning) return;
  scanning = true;
  renderPickup();

  const target = document.querySelector("#scanner");
  if(!target){
    scanning = false;
    renderPickup();
    return;
  }

  try { Quagga.offDetected(onPickupDetected); } catch(e) {}

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target,
      constraints: { facingMode: "environment" }
    },
    locate: true,
    decoder: { readers: ["ean_reader","code_128_reader"] }
  }, (err) => {
    if(err){
      scanning = false;
      renderPickup();
      toast("Camera fout", false);
      return;
    }
    Quagga.start();
    Quagga.onDetected(onPickupDetected);
    toast("Scanner aan");
  });
};

function onPickupDetected(data){
  const code = data?.codeResult?.code;
  if(!code) return;

  beep();
  haptic();
  toast("Gescand ✅");

  stopScanner(); // camera uit na scan
  scanning = false;

  // Zoek in opgeslagen packages: match op inboundCode (later: pickupCode/qrId erbij)
  const all = getPackages();
  const found = all.find(p => p.status === "stored" && p.inboundCode === code);

  if(found){
    pickupFound = found;
    renderPickup();
  }else{
    pickupFound = null;
    pickupList = [];
    renderPickup();
    toast("Niet gevonden — zoek op naam of Missing", false);
  }
}

// ======================== OVERVIEW ========================
function renderOverview(){
  const p = document.getElementById("page");
  const all = getPackages();

  const inbound = all.filter(x=>x.type==="carrier_inbound");
  const storedInbound = inbound.filter(x=>x.status==="stored");
  const pickedInbound = inbound.filter(x=>x.status==="picked_up");
  const missing = inbound.filter(x=>x.status==="stored" && x.missing);

  const byCarrierStored = groupByCarrier(storedInbound);
  const byCarrierPicked = groupByCarrier(pickedInbound);

  p.innerHTML = `
    <div class="card stack">
      <div style="font-weight:900;font-size:16px">Overzicht</div>
      <div class="brandTag">Totaal + per carrier (binnenkomst)</div>

      <div class="btnRow">
        <div class="card" style="flex:1">
          <div class="brandTag">Binnen (stored)</div>
          <div style="font-size:28px;font-weight:900">${storedInbound.length}</div>
        </div>
        <div class="card" style="flex:1">
          <div class="brandTag">Afgehaald</div>
          <div style="font-size:28px;font-weight:900">${pickedInbound.length}</div>
        </div>
      </div>

      <div class="card">
        <div class="brandTag">Missing (stored)</div>
        <div style="font-size:24px;font-weight:900;color:var(--danger)">${missing.length}</div>
      </div>

      <div class="hint">Binnen (stored) per carrier</div>
      ${renderCarrierTable(byCarrierStored)}

      <div class="hint">Afgehaald per carrier</div>
      ${renderCarrierTable(byCarrierPicked)}
    </div>
  `;
}

function groupByCarrier(list){
  const map = {};
  for(const x of list){
    map[x.carrier] = (map[x.carrier] || 0) + 1;
  }
  return map;
}

function renderCarrierTable(map){
  const rows = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([id,count]) => `
      <div class="itemCard">
        <div class="itemTop">
          <div class="itemName">${escapeAttr(carrierName(id))}</div>
          <div style="font-weight:900;font-size:18px">${count}</div>
        </div>
      </div>
    `).join("");

  return rows ? `<div class="stack">${rows}</div>` : `<div class="hint">Geen data</div>`;
}

// ======================== MISSING (v1) ========================
// (We hangen dit later netjes in de UI; nu is het klaar als concept)
window.markMissingByCode = (code) => {
  const all = getPackages();
  const pkg = all.find(p => p.status==="stored" && p.inboundCode===code);
  if(!pkg) return toast("Niet gevonden", false);
  pkg.missing = true;
  savePackages(all);
  toast("Missing gezet");
};

// ======================== INBOUND SCANNER ========================
window.startScanner = () => {
  if(scanning) return;
  scanning = true;
  renderInboundScan();

  const target = document.querySelector("#scanner");
  if(!target){
    scanning = false;
    renderInboundScan();
    return;
  }

  try { Quagga.offDetected(onInboundDetected); } catch(e) {}

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target,
      constraints: { facingMode: "environment" }
    },
    locate: true,
    decoder: { readers: ["ean_reader","code_128_reader"] }
  }, (err) => {
    if(err){
      scanning = false;
      renderInboundScan();
      toast("Camera fout", false);
      return;
    }
    Quagga.start();
    Quagga.onDetected(onInboundDetected);
    toast("Scanner aan");
  });
};

function onInboundDetected(data){
  const code = data?.codeResult?.code;
  if(!code) return;

  lastBarcode = code;

  beep();
  haptic();
  toast("Gescand ✅");

  stopScanner(); // camera uit na scan
  scanning = false;

  // reset suggestion/manual on new scan
  suggestedLoc = null;
  showManual = false;
  manualR=""; manualP=""; manualE=""; manualSub="";

  renderInboundScan();
  setTimeout(()=>document.getElementById("firstName")?.focus(), 160);
}

window.stopScanner = stopScanner;

function stopScanner(){
  if(!scanning) return;
  try{
    Quagga.offDetected(onInboundDetected);
    Quagga.offDetected(onPickupDetected);
    Quagga.stop();
  }catch(e){}
  scanning = false;
}