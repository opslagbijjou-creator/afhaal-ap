import { auditListEvents } from "../../core/firebase/functionsClient.js";

export function renderLogs(root, ctx) {
  root.innerHTML = `
    <label>Laatste events (max)</label>
    <input id="limit" class="input" type="number" min="1" value="50" />
    <div class="row">
      <button class="btn btnPrimary" id="btn" type="button">Ververs</button>
    </div>
    <pre id="out"></pre>
  `;
  const out = root.querySelector("#out");
  async function load() {
    out.textContent = "Laden…";
    try {
      const limit = Number(root.querySelector("#limit").value || 50);
      const res = await auditListEvents({ limit });
      out.textContent = JSON.stringify(res.events, null, 2);
    } catch (e) {
      out.textContent = `Fout: ${e?.message || e}`;
    }
  }
  root.querySelector("#btn").onclick = load;
  load();
}
