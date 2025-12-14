import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const appDiv = document.getElementById("app");
let scannerRunning = false;
let view = "scan"; // scan | pickup | picked

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) renderLogin();
  else renderShell(user);
});

function renderLogin() {
  stopScanner();
  appDiv.innerHTML = `
    <div class="card">
      <h1>Inloggen</h1>
      <input id="email" placeholder="Email" />
      <input id="password" type="password" placeholder="Wachtwoord" />
      <button id="loginBtn">Inloggen</button>
    </div>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        val("email"),
        val("password")
      );
    } catch (e) {
      alert(e.message);
    }
  };
}

/* ================= SHELL ================= */

function renderShell(user) {
  appDiv.innerHTML = `
    <div class="card">
      <p><b>${user.email}</b></p>

      <div class="row">
        <button id="btnScan">Inscannen</button>
        <button id="btnPickup">Afgeven</button>
        <button id="btnPicked">Afgegeven</button>
      </div>

      <button id="btnLogout" class="secondary">Uitloggen</button>

      <div id="view"></div>
    </div>
  `;

  document.getElementById("btnScan").onclick = () => { view="scan"; renderView(); };
  document.getElementById("btnPickup").onclick = () => { view="pickup"; renderView(); };
  document.getElementById("btnPicked").onclick = () => { view="picked"; renderView(); };
  document.getElementById("btnLogout").onclick = () => signOut(auth);

  renderView();
}

function renderView() {
  if (view === "scan") renderScan();
  if (view === "pickup") renderPickup();
  if (view === "picked") renderPicked();
}

/* ================= INSCANNEN ================= */

function renderScan() {
  const v = document.getElementById("view");
  v.innerHTML = `
    <h2>Inscannen</h2>
    <div id="scanner"></div>

    <input id="barcode" placeholder="Barcode" readonly />
    <input id="customer_name" placeholder="Naam klant" />

    <div class="row">
      <input id="rack" placeholder="Rek (3 cijfers)" />
      <input id="pos" placeholder="Pos (3 cijfers)" />
    </div>
    <div class="row">
      <input id="level" placeholder="Etage (3 cijfers)" />
      <input id="sub" placeholder="Sub (3 cijfers)" />
    </div>

    <button id="saveBtn">Opslaan</button>
    <div id="msg"></div>
  `;

  startScanner(code => {
    document.getElementById("barcode").value = code;
  });

  document.getElementById("saveBtn").onclick = async () => {
    const barcode = val("barcode");
    const customer_name = val("customer_name");
    const rack = pad3(val("rack"));
    const pos = pad3(val("pos"));
    const level = pad3(val("level"));
    const sub = pad3(val("sub"));

    if (!barcode || !customer_name || !rack || !pos || !level || !sub) {
      msg("Alles invullen");
      return;
    }

    const location_code = `${rack}-${pos}-${level}-${sub}`;

    await setDoc(doc(db, "inventory", barcode), {
      barcode,
      customer_name,
      rack, pos, level, sub,
      location_code,
      status: "on_stock",
      stored_at: serverTimestamp()
    });

    msg("Opgeslagen ✅");
    document.getElementById("barcode").value = "";
    startScanner(code => document.getElementById("barcode").value = code);
  };
}

/* ================= AFGEVEN ================= */

function renderPickup() {
  const v = document.getElementById("view");
  v.innerHTML = `
    <h2>Afgeven</h2>
    <div id="scanner"></div>
    <input id="pickup_barcode" placeholder="Barcode" readonly />

    <div id="info" style="display:none;">
      <p id="infoText"></p>
      <button id="pickedBtn">Afgegeven</button>
    </div>

    <div id="msg"></div>
  `;

  startScanner(async (code) => {
    document.getElementById("pickup_barcode").value = code;
    const snap = await getDoc(doc(db, "inventory", code));
    if (!snap.exists()) {
      msg("Niet gevonden");
      return;
    }
    const d = snap.data();
    document.getElementById("infoText").innerText =
      `${d.customer_name} – ${d.location_code}`;
    document.getElementById("info").style.display = "block";

    document.getElementById("pickedBtn").onclick = async () => {
      await updateDoc(doc(db, "inventory", code), {
        status: "picked_up",
        picked_up_at: serverTimestamp()
      });
      msg("Afgegeven ✅");
    };
  });
}

/* ================= AFGEGEVEN LIJST ================= */

async function renderPicked() {
  stopScanner();
  const v = document.getElementById("view");
  v.innerHTML = `<h2>Afgegeven</h2><div id="list">Laden…</div>`;

  const q = query(
    collection(db, "inventory"),
    where("status", "==", "picked_up"),
    orderBy("picked_up_at", "desc"),
    limit(20)
  );

  const snap = await getDocs(q);
  const list = document.getElementById("list");
  if (snap.empty) {
    list.innerText = "Nog niks";
    return;
  }

  list.innerHTML = "";
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="card" style="margin-top:10px">
        <b>${x.customer_name}</b><br/>
        ${x.barcode}<br/>
        ${x.location_code}
      </div>
    `;
  });
}

/* ================= SCANNER ================= */

function startScanner(onDetected) {
  stopScanner();
  scannerRunning = true;

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: document.querySelector("#scanner"),
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["ean_reader","ean_8_reader","code_128_reader"] }
  }, err => {
    if (err) return alert(err.message);
    Quagga.start();
  });

  Quagga.onDetected(data => {
    const code = data?.codeResult?.code;
    if (!code) return;
    stopScanner();
    onDetected(code);
  });
}

function stopScanner() {
  try {
    if (scannerRunning) {
      Quagga.stop();
      Quagga.offDetected();
    }
  } catch {}
  scannerRunning = false;
}

/* ================= HELPERS ================= */

function val(id){ return document.getElementById(id)?.value.trim(); }
function pad3(x){ return String(x||"").replace(/\D/g,"").padStart(3,"0").slice(-3); }
function msg(t){ const el=document.getElementById("msg"); if(el) el.innerText=t; }
