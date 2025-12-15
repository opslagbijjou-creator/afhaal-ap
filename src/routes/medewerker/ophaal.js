import { lookupByScan } from "../../core/firebase/functionsClient.js";

export function renderOphaal(root) {
  root.innerHTML = `
    <div class="card" style="margin-top:12px;">
      <div class="cardHead">
        <h2>Ophaal</h2>
        <span class="tag">Scan → locatie</span>
      </div>
      <div class="cardBody">
        <label>Klantcode / QR inhoud</label>
        <input id="scanValue" class="input" placeholder="Plak/typ scanwaarde…" />

        <div class="row">
          <button class="btn btnPrimary" id="btnLookup" type="button">Zoek pakket</button>
        </div>

        <pre id="result"></pre>
      </div>
    </div>
  `;

  const scanEl = root.querySelector("#scanValue");
  const resultEl = root.querySelector("#result");
  const btn = root.querySelector("#btnLookup");

  btn.onclick = async () => {
    const scanValue = scanEl.value.trim();
    if (!scanValue) {
      resultEl.textContent = "Geen scanwaarde ingevuld.";
      return;
    }
    resultEl.textContent = "Zoeken…";
    try {
      const data = await lookupByScan(scanValue);
      resultEl.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      console.error(e);
      resultEl.textContent = `Fout: ${e?.message || e}`;
    }
  };
}