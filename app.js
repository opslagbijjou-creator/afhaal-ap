import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth } from "./firebase.js";

const root = document.getElementById("app");
let currentBarcode = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, user => {
  if (user) renderScan(user.email);
  else renderLogin();
});

function renderLogin(){
  root.innerHTML = `
    <div class="container">
      <div class="card">
        <h1>🔐 Inloggen</h1>

        <input id="email" class="input" placeholder="Email">
        <input id="password" class="input" type="password" placeholder="Wachtwoord">

        <button class="btn" onclick="login()">Inloggen</button>
      </div>
    </div>
  `;
}

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Login fout: " + e.message);
  }
};

window.logout = async () => {
  await signOut(auth);
};

/* ================= SCAN ================= */

function renderScan(email){
  root.innerHTML = `
    <div class="container">
      <div class="card">
        <h1>📦 Inscannen</h1>
        <small>${email}</small>

        <div id="scanner" class="scanBox"></div>

        <input id="barcode" class="input" placeholder="Barcode" readonly>
        <input id="name" class="input" placeholder="Naam klant">
        <input id="location" class="input" placeholder="Vak / locatie">

        <button class="btn" onclick="startScanner()">📷 Scan</button>
        <button class="btn danger" onclick="logout()">Uitloggen</button>
      </div>
    </div>
  `;
}

/* ================= BARCODE ================= */

window.startScanner = () => {
  Quagga.init({
    inputStream: {
      name: "Live",
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
    Quagga.stop();
    navigator.vibrate?.(150);
  });
};