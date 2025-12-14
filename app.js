// =======================
// AUTH (super simpel)
// =======================
function getUserEmail(){
  return localStorage.getItem("userEmail");
}
function setUserEmail(email){
  localStorage.setItem("userEmail", email);
}
function logout(){
  // stop camera als die draait
  try { Quagga.stop(); } catch(e) {}
  localStorage.removeItem("userEmail");
  showNav(false);
  setPill("👤");
  renderLogin();
}
window.logout = logout;

// =======================
// UI HELPERS
// =======================
function showNav(show){
  const nav = document.getElementById("nav");
  if(nav) nav.style.display = show ? "block" : "none";
}
function setPill(text){
  const pill = document.getElementById("userPill");
  if(pill) pill.textContent = text;
}
function setActive(page){
  ["scan","pickup","list"].forEach(p=>{
    document.getElementById("nav-"+p)?.classList.toggle("active", p===page);
  });
}

// =======================
// ROUTING
// =======================
window.go = function(page){
  const user = getUserEmail();
  if(!user) return renderLogin();

  showNav(true);
  setPill(user);

  setActive(page);
  if(page==="scan") renderScan();
  if(page==="pickup") renderPickup();
  if(page==="list") renderList();
};

// =======================
// DATA (localStorage)
// =======================
function getItems(){
  return JSON.parse(localStorage.getItem("items")||"[]");
}
function saveItems(items){
  localStorage.setItem("items", JSON.stringify(items));
}

// =======================
// LOGIN PAGE
// =======================
function renderLogin(){
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card stack">
      <div class="title">🔐 Inloggen</div>
      <div class="subtitle" style="color:var(--muted)">Vul je email in (demo). Daarna zie je de app.</div>

      <div>
        <div class="label">Email</div>
        <input id="loginEmail" class="input" placeholder="bijv. folkert@test.nl" />
      </div>

      <button class="btn primary" onclick="doLogin()">Inloggen</button>
    </div>
  `;
  showNav(false);
}

window.doLogin = function(){
  const email = document.getElementById("loginEmail")?.value?.trim();
  if(!email) return alert("Vul email in");
  setUserEmail(email);
  go("scan");
};

// =======================
// SCANNER (Quagga2)
// =======================
let currentBarcode = null;

function setMsg(text){
  const el = document.getElementById("msg");
  if(el) el.textContent = text;
}

window.startScanner = function(){
  const target = document.querySelector("#scanner");
  if(!target) return alert("Scanner container niet gevonden");

  // voorkom dubbele listeners
  try { Quagga.offDetected(onDetected); } catch(e) {}

  Quagga.init({
    inputStream:{
      type:"LiveStream",
      target,
      constraints:{ facingMode:"environment" }
    },
    decoder:{ readers:["code_128_reader","ean_reader","ean_8_reader"] },
    locate:true
  }, err => {
    if(err){ alert(err); return; }
    Quagga.start();
    setMsg("Scan gestart… richt op barcode");
  });

  Quagga.onDetected(onDetected);
};

function onDetected(data){
  const code = data?.codeResult?.code;
  if(!code) return;

  currentBarcode = code;
  const barcodeEl = document.getElementById("barcode");
  if(barcodeEl) barcodeEl.value = currentBarcode;

  try { Quagga.stop(); } catch(e) {}

  document.getElementById("form")?.scrollIntoView({ behavior:"smooth", block:"start" });
  setTimeout(()=> document.getElementById("name")?.focus(), 250);

  try { navigator.vibrate?.(50); } catch(e) {}
  setMsg("Gescand ✅ Vul naam + vak in");
}

// =======================
// PAGES
// =======================
function renderTopActions(){
  return `
    <div class="card stack">
      <div class="row" style="display:flex;gap:10px">
        <button class="btn danger" onclick="logout()">Uitloggen</button>
      </div>
    </div>
  `;
}

function renderScan(){
  document.getElementById("app").innerHTML = `
    ${renderTopActions()}

    <div class="card stack">
      <div class="scanBox" id="scanner">
        <div class="hint">
          <span class="badge">📷 Camera</span>
          <span class="badge"><span class="ok">●</span> klaar</span>
        </div>
      </div>

      <button class="btn primary" onclick="startScanner()">📷 Start scan</button>

      <div id="form" class="stack">
        <div>
          <div class="label">Barcode</div>
          <input id="barcode" class="input" placeholder="Scan eerst…" readonly />
        </div>

        <div>
          <div class="label">Naam klant</div>
          <input id="name" class="input" placeholder="Bijv. Fatima Munach" />
        </div>

        <div>
          <div class="label">Locatie / vak</div>
          <input id="location" class="input" placeholder="Bijv. Vak 13" />
        </div>

        <button class="btn" onclick="saveItem()">💾 Opslaan</button>
        <div class="pill" id="msg">Tip: klik op Start scan</div>
      </div>
    </div>
  `;
}

window.saveItem = function(){
  if(!currentBarcode) return alert("Geen barcode. Eerst scannen.");
  const name = document.getElementById("name")?.value?.trim() || "";
  const location = document.getElementById("location")?.value?.trim() || "";
  if(!name) return alert("Vul naam in");
  if(!location) return alert("Vul vak/locatie in");

  const items = getItems();

  const existing = items.find(i => i.barcode === currentBarcode && i.status === "stored");
  if(existing){
    existing.name = name;
    existing.location = location;
    existing.updatedAt = new Date().toISOString();
  } else {
    items.unshift({
      barcode: currentBarcode,
      name,
      location,
      status: "stored",
      createdAt: new Date().toISOString(),
      createdBy: getUserEmail()
    });
  }

  saveItems(items);

  document.getElementById("barcode").value = "";
  document.getElementById("name").value = "";
  document.getElementById("location").value = "";
  currentBarcode = null;

  alert("Opgeslagen ✅");
  go("list");
};

function renderPickup(){
  document.getElementById("app").innerHTML = `
    ${renderTopActions()}

    <div class="card stack">
      <div class="title">✅ Afgeven</div>
      <div class="subtitle" style="color:var(--muted)">Scan barcode → toon vak → markeer afgegeven</div>

      <div class="scanBox" id="scanner">
        <div class="hint">
          <span class="badge">📦 Afgeven</span>
          <span class="badge"><span class="ok">●</span> klaar</span>
        </div>
      </div>

      <button class="btn primary" onclick="startPickupScan()">📷 Scan voor afgeven</button>
      <div class="pill" id="pickupMsg">Nog niets gescand</div>
      <div id="pickupCard"></div>
    </div>
  `;
}

window.startPickupScan = function(){
  const target = document.querySelector("#scanner");
  if(!target) return;

  try { Quagga.offDetected(onPickupDetected); } catch(e) {}

  Quagga.init({
    inputStream:{ type:"LiveStream", target, constraints:{ facingMode:"environment" } },
    decoder:{ readers:["code_128_reader","ean_reader","ean_8_reader"] },
    locate:true
  }, err => {
    if(err){ alert(err); return; }
    Quagga.start();
    document.getElementById("pickupMsg").textContent = "Scan gestart…";
  });

  Quagga.onDetected(onPickupDetected);
};

function onPickupDetected(data){
  const code = data?.codeResult?.code;
  if(!code) return;

  const items = getItems();
  const item = items.find(i => i.barcode === code && i.status === "stored");

  try { Quagga.stop(); } catch(e) {}

  if(!item){
    document.getElementById("pickupMsg").textContent = "Niet gevonden / al afgegeven ❌";
    document.getElementById("pickupCard").innerHTML = "";
    return;
  }

  document.getElementById("pickupMsg").textContent = "Gevonden ✅";
  document.getElementById("pickupCard").innerHTML = `
    <div class="card stack" style="border-color:rgba(110,231,255,.25)">
      <div><b>${escapeHtml(item.name)}</b></div>
      <div class="pill">📍 ${escapeHtml(item.location)}</div>
      <div class="pill">🔢 ${escapeHtml(item.barcode)}</div>
      <button class="btn primary" onclick="markPickedUp('${encodeURIComponent(item.barcode)}')">✅ Afgegeven</button>
    </div>
  `;
}

window.markPickedUp = function(barcodeEnc){
  const barcode = decodeURIComponent(barcodeEnc);
  const items = getItems();
  const item = items.find(i => i.barcode === barcode && i.status === "stored");
  if(!item) return alert("Item niet gevonden");

  item.status = "picked_up";
  item.pickedUpAt = new Date().toISOString();
  item.pickedUpBy = getUserEmail();
  saveItems(items);

  alert("Afgegeven ✅");
  go("list");
};

function renderList(){
  const items = getItems();

  document.getElementById("app").innerHTML = `
    ${renderTopActions()}

    <div class="card stack">
      <div class="title">📋 Lijst</div>
      <div class="subtitle" style="color:var(--muted)">In voorraad & afgegeven</div>

      ${items.length ? items.map(i => `
        <div class="card" style="padding:12px;border-color:${i.status==="stored" ? "rgba(50,213,131,.25)" : "rgba(255,92,122,.20)"}">
          <div style="font-weight:900">${escapeHtml(i.name)}</div>
          <div class="pill">📍 ${escapeHtml(i.location)} • 🔢 ${escapeHtml(i.barcode)}</div>
          <div class="pill">${i.status==="stored" ? "✅ stored" : "📦 picked_up"}</div>
        </div>
      `).join("") : `<div class="pill">Nog geen items opgeslagen</div>`}

      <button class="btn danger" onclick="clearAll()">🗑️ Alles wissen</button>
    </div>
  `;
}

window.clearAll = function(){
  if(!confirm("Alles wissen?")) return;
  localStorage.removeItem("items");
  alert("Gewist");
  go("list");
};

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

// START
const existing = getUserEmail();
if(existing){
  showNav(true);
  setPill(existing);
  go("scan");
} else {
  renderLogin();
}