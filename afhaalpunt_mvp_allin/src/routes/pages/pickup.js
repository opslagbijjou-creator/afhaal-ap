import { scanningLookupByScan, packagesPickup } from "../../core/firebase/functionsClient.js";
import { startQrScanner, stopQrScanner } from "../../modules/scanning/qrScanner.js";

export function renderPickup(root, ctx) {
  root.innerHTML = `
    <div class="grid2">
      <div>
        <label>Klantcode / QR inhoud</label>
        <input id="scanValue" class="input" placeholder="Plak/typ scanwaarde…" />
        <div class="row">
          <button class="btn btnPrimary" id="btnLookup" type="button">Zoek pakket</button>
          <button class="btn" id="btnCam" type="button">Camera QR</button>
        </div>

        <div id="match" style="margin-top:12px;"></div>

        <div class="row" style="margin-top:12px;">
          <button class="btn btnGood" id="btnPickup" type="button" disabled>Markeer als uitgegeven</button>
        </div>
      </div>

      <div>
        <div class="kv"><span>Camera</span><b class="small muted">QR scan</b></div>
        <div id="qrWrap" style="margin-top:12px;"></div>
        <div class="small muted" style="margin-top:10px;">
          Tip: als je een balie-scanner hebt die als toetsenbord werkt, kun je gewoon in het veld scannen.
        </div>
      </div>
    </div>
  `;

  const scanEl = root.querySelector("#scanValue");
  const matchEl = root.querySelector("#match");
  const btnLookup = root.querySelector("#btnLookup");
  const btnPickup = root.querySelector("#btnPickup");
  const btnCam = root.querySelector("#btnCam");
  const qrWrap = root.querySelector("#qrWrap");

  let current = null;
  let qr = null;

  function renderMatch(data) {
    if (!data || data.status !== "MATCHED") {
      matchEl.innerHTML = `<div class="notice">Niet gevonden.</div>`;
      btnPickup.disabled = true;
      current = null;
      return;
    }
    current = data.package;
    matchEl.innerHTML = `
      <div class="kv"><span>Locatie</span><b>${current.locationDisplay || "-"}</b></div>
      <div class="kv"><span>Naam</span><b>${current.customerName || "-"}</b></div>
      <div class="kv"><span>Subnr</span><b>${current.subNo ?? "-"}</b></div>
      <div class="kv"><span>Binnen</span><b>${(current.receivedAt || "").slice(0,10) || "-"}</b></div>
    `;
    btnPickup.disabled = false;
  }

  btnLookup.onclick = async () => {
    const scanValue = scanEl.value.trim();
    if (!scanValue) { matchEl.innerHTML = `<div class="notice">Geen scanwaarde.</div>`; return; }
    matchEl.innerHTML = `<div class="notice">Zoeken…</div>`;
    try {
      const data = await scanningLookupByScan(scanValue);
      renderMatch(data);
    } catch (e) {
      console.error(e);
      matchEl.innerHTML = `<div class="notice">Fout: ${e?.message || e}</div>`;
    }
  };

  btnPickup.onclick = async () => {
    if (!current?.packageId) return;
    btnPickup.disabled = true;
    try {
      await packagesPickup({ packageId: current.packageId });
      matchEl.innerHTML = `<div class="notice">✅ Uitgegeven geregistreerd.</div>`;
      current = null;
    } catch (e) {
      console.error(e);
      matchEl.innerHTML = `<div class="notice">Fout: ${e?.message || e}</div>`;
    } finally {
      btnPickup.disabled = true;
    }
  };

  btnCam.onclick = async () => {
    if (qr) {
      await stopQrScanner(qr);
      qr = null;
      qrWrap.innerHTML = "";
      btnCam.textContent = "Camera QR";
      return;
    }
    qrWrap.innerHTML = `<div id="qrReader" style="width:100%;"></div>`;
    btnCam.textContent = "Stop camera";
    try {
      qr = await startQrScanner("qrReader", async (text, scanner) => {
        scanEl.value = text;
        const data = await scanningLookupByScan(text);
        renderMatch(data);
        // optionally stop after first scan
        await stopQrScanner(scanner);
        qr = null;
        qrWrap.innerHTML = "";
        btnCam.textContent = "Camera QR";
      });
    } catch (e) {
      console.error(e);
      qrWrap.innerHTML = `<div class="notice">Camera fout: ${e?.message || e}</div>`;
      btnCam.textContent = "Camera QR";
    }
  };
}
