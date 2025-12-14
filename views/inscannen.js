let scannerRunning = false;

function renderInscannen() {
  app.innerHTML = `
    <div class="card">
      <h1>Inscannen</h1>
      <p>Scan de barcode met de camera</p>

      <div id="scanner" style="width:100%;height:220px;background:#000;border-radius:12px;margin-bottom:10px;"></div>

      <input id="barcode" placeholder="Barcode" readonly />
      <input id="naam" placeholder="Naam klant" />
      <input id="locatie" placeholder="Locatie (vak)" />

      <button onclick="savePackage()">Opslaan</button>
      <div class="small" onclick="stopScanner(); startApp()">← Terug</div>
      <div class="small" id="msg"></div>
    </div>
  `;

  startScanner();
}

function startScanner() {
  if (scannerRunning) return;
  scannerRunning = true;

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#scanner'),
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "code_128_reader"
      ]
    }
  }, err => {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(onDetected);
}

function onDetected(data) {
  const code = data.codeResult.code;
  document.getElementById("barcode").value = code;
  stopScanner();
}

function stopScanner() {
  if (!scannerRunning) return;
  Quagga.stop();
  Quagga.offDetected(onDetected);
  scannerRunning = false;
}

function savePackage() {
  const barcode = document.getElementById("barcode").value.trim();
  const naam = document.getElementById("naam").value.trim();
  const locatie = document.getElementById("locatie").value.trim();
  const msg = document.getElementById("msg");

  if (!barcode || !naam || !locatie) {
    msg.innerText = "Alles invullen aub";
    return;
  }

  const packages = JSON.parse(localStorage.getItem("packages")) || [];

  packages.push({
    barcode,
    naam,
    locatie,
    status: "stored",
    time: new Date().toISOString()
  });

  localStorage.setItem("packages", JSON.stringify(packages));

  msg.innerText = "Pakket opgeslagen ✅";
}
