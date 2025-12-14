import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const root = document.getElementById("app");
let currentBarcode = null;

/* ================= HELPERS ================= */

function nameFromEmail(email){
  if(!email) return "Medewerker";
  const base = email.split("@")[0];
  return base
    .replace(/[._-]+/g," ")
    .split(" ")
    .map(w => w[0].toUpperCase()+w.slice(1))
    .join(" ");
}

/* ================= AUTH ================= */

onAuthStateChanged(auth, user => {
  if(user){
    renderApp(user.email);
  } else {
    renderLogin();
  }
});

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  await signInWithEmailAndPassword(auth, email, password);
};

window.logout = async () => {
  try { Quagga.stop(); } catch(e){}
  await signOut(auth);
};

/* ================= LOGIN ================= */

function renderLogin(){
  root.innerHTML = `
    <div class="container">
      <div class="card">
        <h1>Inloggen</h1>
        <input id="email" class="input" placeholder="Email">
        <input id="password" type="password" class="input" placeholder="Wachtwoord">
        <button class="btn primary" onclick="login()">Inloggen</button>
      </div>
    </div>
  `;
}

/* ================= APP SHELL ================= */

function renderApp(email){
  const name = nameFromEmail(email);

  root.innerHTML = `
    <div class="container">

      <!-- TOPBAR (ALTIJD ZICHTBAAR) -->
      <div class="topbar">
        <div class="brandLeft">
          <div class="brandMark"></div>
          <div>
            <div class="brandName">Afhaalpunt</div>
            <div class="brandTag">Scan • Opslaan • Afgeven</div>
          </div>
        </div>

        <div class="userPill" onclick="toggleMenu()">
          👤 ${name}
        </div>
      </div>

      <div id="userMenu" class="card" style="display:none">
        <div style="font-weight:900">${name}</div>
        <div style="opacity:.6;font-size:13px">${email}</div>
        <br>
        <button class="btn danger" onclick="logout()">Uitloggen</button>
      </div>

      <!-- PAGE CONTENT -->
      <div id="page"></div>
    </div>

    <!-- BOTTOM NAV -->
    <div class="nav">
      <div class="navInner">
        <button class="navBtn active" onclick="renderScan()">📦 Inscannen</button>
        <button class="navBtn" disabled>✅ Afgeven</button>
        <button class="navBtn" disabled>📋 Lijst</button>
      </div>
    </div>
  `;

  renderScan(); // 👈 BELANGRIJK
}

window.toggleMenu = () => {
  const m = document.getElementById("userMenu");
  m.style.display = m.style.display === "none" ? "block" : "none";
};

/* ================= SCAN ================= */

function renderScan(){
  document.getElementById("page").innerHTML = `
    <div class="card">
      <h2>Inscannen</h2>

      <div id="scanner" class="scanBox"></div>

      <input id="barcode" class="input" placeholder="Barcode" readonly>
      <input class="input" placeholder="Naam klant">
      <input class="input" placeholder="Locatie">

      <button class="btn primary" onclick="startScanner()">📷 Scan</button>
    </div>
  `;
}

window.startScanner = () => {
  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: document.querySelector("#scanner"),
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["ean_reader","code_128_reader"] }
  }, err => {
    if (!err) Quagga.start();
  });

  Quagga.onDetected(data => {
    currentBarcode = data.codeResult.code;
    document.getElementById("barcode").value = currentBarcode;
    navigator.vibrate?.(120);
    Quagga.stop();
  });
};