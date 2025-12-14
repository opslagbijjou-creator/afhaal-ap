// =======================
// ROUTING
// =======================
window.go = function(page){
  setActive(page);
  if(page==="scan") renderScan();
  if(page==="pickup") renderPickup();
  if(page==="list") renderList();
};

function setActive(page){
  ["scan","pickup","list"].forEach(p=>{
    document.getElementById("nav-"+p)?.classList.toggle("active",p===page);
  });
}

// =======================
// DATA (localStorage)
// =======================
function getItems(){
  return JSON.parse(localStorage.getItem("items")||"[]");
}
function saveItems(items){
  localStorage.setItem("items",JSON.stringify(items));
}

// =======================
// SCANNER
// =======================
let currentBarcode=null;

window.startScanner = function(){
  Quagga.init({
    inputStream:{
      type:"LiveStream",
      target:document.querySelector("#scanner"),
      constraints:{facingMode:"environment"}
    },
    decoder:{readers:["code_128_reader","ean_reader","ean_8_reader"]}
  },err=>{
    if(err){alert(err);return;}
    Quagga.start();
  });

  Quagga.onDetected(data=>{
    currentBarcode=data.codeResult.code;
    document.getElementById("barcode").value=currentBarcode;
    Quagga.stop();
  });
};

// =======================
// PAGES
// =======================
function renderScan(){
  document.getElementById("app").innerHTML=`
    <div class="card stack">
      <div class="scanBox" id="scanner"></div>

      <div>
        <div class="label">Barcode</div>
        <input id="barcode" class="input" readonly />
      </div>

      <div>
        <div class="label">Naam klant</div>
        <input id="name" class="input" placeholder="Naam" />
      </div>

      <div>
        <div class="label">Locatie / vak</div>
        <input id="location" class="input" placeholder="Vak 12" />
      </div>

      <button class="btn primary" onclick="saveItem()">💾 Opslaan</button>
      <button class="btn" onclick="startScanner()">📷 Start scan</button>
    </div>
  `;
}

window.saveItem = function(){
  if(!currentBarcode)return alert("Geen barcode");
  const items=getItems();
  items.push({
    barcode:currentBarcode,
    name:document.getElementById("name").value,
    location:document.getElementById("location").value,
    status:"stored",
    time:new Date().toISOString()
  });
  saveItems(items);
  alert("Opgeslagen!");
  go("list");
};

function renderPickup(){
  document.getElementById("app").innerHTML=`
    <div class="card stack">
      <div class="scanBox" id="scanner"></div>
      <button class="btn primary" onclick="startScanner()">📷 Scan pakket</button>
      <div id="pickupResult"></div>
    </div>
  `;

  Quagga.onDetected(data=>{
    const code=data.codeResult.code;
    const items=getItems();
    const item=items.find(i=>i.barcode===code && i.status==="stored");
    if(!item)return;

    item.status="picked_up";
    saveItems(items);
    document.getElementById("pickupResult").innerHTML=
      `<b>${item.name}</b> afgegeven (${item.location})`;
    Quagga.stop();
  });
}

function renderList(){
  const items=getItems();
  document.getElementById("app").innerHTML=`
    <div class="card stack">
      ${items.map(i=>`
        <div>
          <b>${i.name}</b><br>
          ${i.barcode} – ${i.location}<br>
          Status: ${i.status}
        </div>
      `).join("")}
    </div>
  `;
}

// START
go("scan");
