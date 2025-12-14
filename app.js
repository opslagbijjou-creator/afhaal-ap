import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const root = document.getElementById("app");

// scanner state
let scanning = false;
let lastBarcode = null;
let currentEmail = "";

// flow state
let firstName = "";
let lastName = "";
let suggestedPlace = null; // number
let showManual = false;
let manualPlace = "";
let noteText = "";

// ======== Schappen model (eerste versie) ========
// Alles is NUMMER, zodat "Andere plek" alleen cijfers kan zijn.
// 6 schappen, elk 20 plekken = 120 plekken. Capaciteit per plek = 1.
const SHELVES = {
  shelvesCount: 6,
  placesPerShelf: 20,
  capacityPerPlace: 1
};

// ================= helpers =================
function nameFromEmail(email){
  if(!email) return "Medewerker";
  const beforeAt = email.split("@")[0] || "medewerker";
  return beforeAt
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
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

function getItems(){
  return JSON.parse(localStorage.getItem("items") || "[]");
}
function saveItems(items){
  localStorage.setItem("items", JSON.stringify(items));
}

// occupancy map: { "plekNummer": usedCount }
function getOccupancy(){
  return JSON.parse(localStorage.getItem("occupancy") || "{}");
}
function saveOccupancy(map){
  localStorage.setItem("occupancy", JSON.stringify(map));
}

// Convert place number -> display "Schap X • Plek Y"
function placeToDisplay(placeNum){
  const per = SHELVES.placesPerShelf;
  const shelf = Math.ceil(placeNum / per);
  const pos = ((placeNum - 1) % per) + 1;
  return { shelf, pos };
}

// find first place with used < capacity
function findFirstFreePlace(){
  const occ = getOccupancy();
  const total = SHELVES.shelvesCount * SHELVES.placesPerShelf;
  for(let place = 1; place <= total; place++){
    const used = Number(occ[String(place)] || 0);
    if(used < SHELVES.capacityPerPlace){
      return place;
    }
  }
  return null; // alles vol
}

function reservePlace(placeNum){
  const occ = getOccupancy();
  const key = String(placeNum);
  const used = Number(occ[key] || 0);
  if(used >= SHELVES.capacityPerPlace) return false;
  occ[key] = used + 1;
  saveOccupancy(occ);
  return true;
}

function resetFlowKeepLogin(){
  stopScanner();
  scanning = false;
  lastBarcode = null;
  firstName = "";
  lastName = "";
  suggestedPlace = null;
  showManual = false;
  manualPlace = "";
  noteText = "";
}

// ================= auth =================
onAuthStateChanged(auth, (user) => {
  if(!user) return renderLogin();
  currentEmail = user.email || "";
  renderApp(currentEmail);
});

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  await signInWithEmailAndPassword(auth, email, password);
};

window.logout = async () => {
  resetFlowKeepLogin();
  await signOut(auth);
};

// ================= UI =================
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

function renderApp(email){
  const name = nameFromEmail(email);

  root.innerHTML = `
    <div class="container">

      <div class="topbar">
        <div class="brandLeft">
          <div class="brandMark"></div>
          <div>
            <div class="brandName">Afhaalpunt</div>
            <div class="brandTag">Scan • Opslaan • Afgeven</div>
          </div>
        </div>

        <div class="userPill" onclick="toggleMenu()">
          <span>👤</span>
          <span class="name">${name}</span>
        </div>
      </div>

      <div id="userMenu" class="card" style="display:none">
        <div class="badge">Ingelogd als <strong style="color:var(--text)">${name}</strong></div>
        <div style="height:10px"></div>
        <div class="hint">${email}</div>
        <div style="height:10px"></div>
        <button class="btn danger" onclick="logout()">Uitloggen</button>
      </div>

      <div id="page" class="stack"></div>
    </div>

    <div class="nav">
      <div class="navInner">
        <button class="navBtn active">📦 Inscannen</button>
        <button class="navBtn" disabled>✅ Afgeven</button>
        <button class="navBtn" disabled>📋 Lijst</button>
      </div>
    </div>
  `;

  renderScanPage();
}

window.toggleMenu = () => {
  const m = document.getElementById("userMenu");
  if(!m) return;
  m.style.display = (m.style.display === "none") ? "block" : "none";
};

// ================= Scan page (met NAAM flow) =================
function renderScanPage(){
  const page = document.getElementById("page");

  const scanHeaderBadge = scanning
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

  const barcodeVal = lastBarcode || "";

  const nameSection = lastBarcode
    ? `
      <div class="card stack">
        <div style="font-weight:900">Gegevens</div>

        <div>
          <div class="label">Voornaam *</div>
          <input id="firstName" class="input" value="${escapeAttr(firstName)}" placeholder="Voornaam" autocomplete="off">
        </div>

        <div>
          <div class="label">Achternaam *</div>
          <input id="lastName" class="input" value="${escapeAttr(lastName)}" placeholder="Achternaam" autocomplete="off">
        </div>

        <button class="btn primary" onclick="checkPlace()">Check plek</button>

        ${suggestedPlace ? renderSuggestionBlock() : ``}
      </div>
    `
    : `
      <div class="hint">
        Scan eerst een barcode. Daarna vragen we voornaam + achternaam en kiezen we automatisch een plek.
      </div>
    `;

  page.innerHTML = `
    <div class="card stack">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:900;font-size:16px">Inscannen</div>
          <div class="brandTag">Scan → Naam → Plek voorstel</div>
        </div>
        ${scanHeaderBadge}
      </div>

      <div id="scannerWrap">
        ${scannerBlock}
      </div>

      <div>
        <div class="label">Barcode</div>
        <input id="barcode" class="input" value="${escapeAttr(barcodeVal)}" placeholder="Nog niets gescand…" readonly>
      </div>

      <div class="btnRow">
        ${scanning
          ? `<button class="btn ghost" onclick="stopScanner()">Stop scan</button>`
          : `<button class="btn primary" onclick="startScanner()">Start scan</button>`
        }
        <button class="btn ghost" onclick="clearBarcode()">Leegmaken</button>
      </div>

      <div class="hint">
        Na een succesvolle scan stopt de camera automatisch. Je kunt ook handmatig stoppen.
      </div>
    </div>

    ${nameSection}
  `;
}

function renderSuggestionBlock(){
  const { shelf, pos } = placeToDisplay(suggestedPlace);

  return `
    <div class="card stack" style="border-color: rgba(79,209,197,.30);">
      <div class="badge">
        ✅ Plek gevonden: <strong style="color:var(--text)">Schap ${shelf} • Plek ${pos}</strong>
      </div>

      <div class="btnRow">
        <button class="btn primary" onclick="confirmDone()">Gedaan</button>
        <button class="btn ghost" onclick="toggleManual()">Andere plek</button>
      </div>

      ${showManual ? `
        <div class="card stack" style="background: rgba(0,0,0,.18);">
          <div style="font-weight:900">Andere plek</div>

          <div>
            <div class="label">Plek nummer (alleen cijfers) *</div>
            <input
              id="manualPlace"
              class="input"
              inputmode="numeric"
              pattern="[0-9]*"
              value="${escapeAttr(manualPlace)}"
              placeholder="Bijv. 37"
            >
          </div>

          <div>
            <div class="label">Notitie (optioneel)</div>
            <input id="note" class="input" value="${escapeAttr(noteText)}" placeholder="Bijv. doos beschadigd">
          </div>

          <button class="btn primary" onclick="confirmManual()">Opslaan met deze plek</button>
        </div>
      ` : ``}
    </div>
  `;
}

window.clearBarcode = () => {
  stopScanner();
  scanning = false;

  lastBarcode = null;
  suggestedPlace = null;
  showManual = false;
  manualPlace = "";
  noteText = "";
  firstName = "";
  lastName = "";

  toast("Leeggemaakt");
  renderScanPage();
};

function readNameInputs(){
  firstName = document.getElementById("firstName")?.value?.trim() || "";
  lastName = document.getElementById("lastName")?.value?.trim() || "";
}

// ================= NAAM -> PLEK =================
window.checkPlace = () => {
  readNameInputs();

  if(!lastBarcode){
    toast("Scan eerst een barcode", false);
    return;
  }
  if(!firstName || !lastName){
    toast("Voornaam + achternaam zijn verplicht", false);
    return;
  }

  const place = findFirstFreePlace();
  if(!place){
    toast("Alles is vol ❌", false);
    suggestedPlace = null;
    renderScanPage();
    return;
  }

  suggestedPlace = place;
  showManual = false;
  manualPlace = "";
  noteText = "";
  toast("Plek gevonden ✅");
  renderScanPage();

  // focus op "Gedaan" gevoel
  setTimeout(() => {
    document.querySelector("button[onclick='confirmDone()']")?.scrollIntoView({ behavior:"smooth", block:"center" });
  }, 100);
};

window.toggleManual = () => {
  showManual = !showManual;
  renderScanPage();
  if(showManual){
    setTimeout(()=>document.getElementById("manualPlace")?.focus(), 100);
  }
};

window.confirmDone = () => {
  readNameInputs();

  if(!lastBarcode) return toast("Geen barcode", false);
  if(!firstName || !lastName) return toast("Naam ontbreekt", false);
  if(!suggestedPlace) return toast("Geen plek gekozen", false);

  // reserveer plek (checkt vol)
  const ok = reservePlace(suggestedPlace);
  if(!ok){
    toast("Deze plek is net vol geraakt ❌", false);
    suggestedPlace = null;
    renderScanPage();
    return;
  }

  // sla item op (nu localStorage; Firestore later)
  const items = getItems();
  items.unshift({
    barcode: lastBarcode,
    firstName,
    lastName,
    place: suggestedPlace,
    note: "",
    status: "stored",
    createdAt: new Date().toISOString(),
    createdBy: currentEmail
  });
  saveItems(items);

  const { shelf, pos } = placeToDisplay(suggestedPlace);
  toast(`Opgeslagen: Schap ${shelf} • Plek ${pos} ✅`);

  // reset voor volgende scan
  lastBarcode = null;
  suggestedPlace = null;
  showManual = false;
  manualPlace = "";
  noteText = "";
  firstName = "";
  lastName = "";

  renderScanPage();
};

window.confirmManual = () => {
  readNameInputs();

  manualPlace = (document.getElementById("manualPlace")?.value || "").trim();
  noteText = (document.getElementById("note")?.value || "").trim();

  if(!lastBarcode) return toast("Geen barcode", false);
  if(!firstName || !lastName) return toast("Naam ontbreekt", false);
  if(!manualPlace) return toast("Plek nummer is verplicht", false);
  if(!/^\d+$/.test(manualPlace)) return toast("Alleen cijfers toegestaan", false);

  const placeNum = Number(manualPlace);
  const total = SHELVES.shelvesCount * SHELVES.placesPerShelf;
  if(placeNum < 1 || placeNum > total){
    return toast(`Plek moet 1 t/m ${total} zijn`, false);
  }

  const ok = reservePlace(placeNum);
  if(!ok){
    return toast("Die plek is vol ❌", false);
  }

  const items = getItems();
  items.unshift({
    barcode: lastBarcode,
    firstName,
    lastName,
    place: placeNum,
    note: noteText || "",
    status: "stored",
    createdAt: new Date().toISOString(),
    createdBy: currentEmail
  });
  saveItems(items);

  const { shelf, pos } = placeToDisplay(placeNum);
  toast(`Opgeslagen: Schap ${shelf} • Plek ${pos} ✅`);

  // reset
  lastBarcode = null;
  suggestedPlace = null;
  showManual = false;
  manualPlace = "";
  noteText = "";
  firstName = "";
  lastName = "";

  renderScanPage();
};

// ================= Quagga control =================
window.startScanner = () => {
  if(scanning) return;
  scanning = true;
  renderScanPage();

  const target = document.querySelector("#scanner");
  if(!target){
    scanning = false;
    renderScanPage();
    return;
  }

  try { Quagga.offDetected(onDetected); } catch(e) {}

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
      renderScanPage();
      toast("Camera fout", false);
      return;
    }
    Quagga.start();
    Quagga.onDetected(onDetected);
    toast("Scanner aan");
  });
};

function onDetected(data){
  const code = data?.codeResult?.code;
  if(!code) return;

  lastBarcode = code;

  beep();
  haptic();
  toast("Gescand ✅");

  // camera DIRECT uit na scan
  stopScanner();

  // reset suggestie/handmatig
  suggestedPlace = null;
  showManual = false;
  manualPlace = "";
  noteText = "";

  renderScanPage();

  // focus naar voornaam
  setTimeout(()=>document.getElementById("firstName")?.focus(), 150);
}

window.stopScanner = stopScanner;

function stopScanner(){
  if(!scanning) {
    renderScanPage();
    return;
  }
  scanning = false;

  try{
    Quagga.offDetected(onDetected);
    Quagga.stop();
  }catch(e){}

  renderScanPage();
}

// escape for putting values into HTML attributes safely
function escapeAttr(v){
  return String(v ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
