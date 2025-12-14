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
  stopScanner();
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

// ================= Scan page =================
function renderScanPage(){
  const page = document.getElementById("page");

  page.innerHTML = `
    <div class="card stack">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:900;font-size:16px">Inscannen</div>
          <div class="brandTag">Scan een barcode en sla straks op.</div>
        </div>
        <span class="badge">${scanning ? `<span style="color:var(--ok);font-weight:900">●</span> Scanner aan` : `Scanner uit`}</span>
      </div>

      <div id="scannerWrap">
        ${scanning ? `
          <div id="scanner" class="scanBox">
            <div class="scanOverlay"></div>
            <div class="scanLine"></div>
          </div>
        ` : `
          <div class="hint">Scanner staat uit. Druk op <strong>Start scan</strong>.</div>
        `}
      </div>

      <div>
        <div class="label">Barcode</div>
        <input id="barcode" class="input" value="${lastBarcode || ""}" placeholder="Nog niets gescand…" readonly>
      </div>

      <div class="btnRow">
        ${scanning
          ? `<button class="btn ghost" onclick="stopScanner()">Stop scan</button>`
          : `<button class="btn primary" onclick="startScanner()">Start scan</button>`
        }
        <button class="btn ghost" onclick="clearBarcode()">Leegmaken</button>
      </div>

      <div class="hint">
        Tip: Na een succesvolle scan stopt de camera automatisch. Je kunt altijd weer op <strong>Start scan</strong> drukken.
      </div>
    </div>
  `;
}

window.clearBarcode = () => {
  lastBarcode = null;
  const b = document.getElementById("barcode");
  if(b) b.value = "";
  toast("Leeggemaakt");
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

  // voorkom dubbele listeners
  try { Quagga.offDetected(onDetected); } catch(e) {}

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target,
      constraints: {
        facingMode: "environment"
      }
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

  // barcode veld updaten
  const b = document.getElementById("barcode");
  if(b) b.value = code;
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