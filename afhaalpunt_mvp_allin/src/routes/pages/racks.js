import { locationsListRacks, locationsUpsertRack } from "../../core/firebase/functionsClient.js";

export function renderRacks(root, ctx) {
  root.innerHTML = `
    <div class="grid2">
      <div>
        <h3 style="margin:0 0 8px 0;">Rekken</h3>
        <div class="small muted">Maak rekken aan zodat je later validatie/overzicht krijgt.</div>
        <div class="row">
          <button class="btn btnPrimary" id="btnLoad" type="button">Ververs</button>
        </div>
        <pre id="list"></pre>
      </div>
      <div>
        <h3 style="margin:0 0 8px 0;">Nieuw / aanpassen</h3>
        <label>Rek nummer</label>
        <input id="rackNo" class="input" type="number" min="1" placeholder="1" />
        <label>Etages (count)</label>
        <input id="levels" class="input" type="number" min="1" placeholder="5" />
        <label>Posities (count)</label>
        <input id="positions" class="input" type="number" min="1" placeholder="20" />
        <label>Label (optioneel)</label>
        <input id="label" class="input" placeholder="Rek bij ingang" />
        <div class="row">
          <button class="btn btnGood" id="btnSave" type="button">Opslaan</button>
        </div>
        <div id="msg"></div>
      </div>
    </div>
  `;

  const listEl = root.querySelector("#list");
  const msgEl = root.querySelector("#msg");

  async function load() {
    listEl.textContent = "Laden…";
    try {
      const res = await locationsListRacks();
      listEl.textContent = JSON.stringify(res.racks, null, 2);
    } catch (e) {
      listEl.textContent = `Fout: ${e?.message || e}`;
    }
  }

  root.querySelector("#btnLoad").onclick = load;

  root.querySelector("#btnSave").onclick = async () => {
    const rackNo = Number(root.querySelector("#rackNo").value || 0);
    const levelsCount = Number(root.querySelector("#levels").value || 0);
    const positionsCount = Number(root.querySelector("#positions").value || 0);
    const label = String(root.querySelector("#label").value || "").trim();
    msgEl.innerHTML = "";
    if (!rackNo || !levelsCount || !positionsCount) {
      msgEl.innerHTML = `<div class="notice">Rek/etages/posities zijn verplicht.</div>`;
      return;
    }
    msgEl.innerHTML = `<div class="notice">Opslaan…</div>`;
    try {
      await locationsUpsertRack({ rackNo, levelsCount, positionsCount, label, active: true });
      msgEl.innerHTML = `<div class="notice">✅ Opgeslagen</div>`;
      await load();
    } catch (e) {
      msgEl.innerHTML = `<div class="notice">Fout: ${e?.message || e}</div>`;
    }
  };

  load();
}
