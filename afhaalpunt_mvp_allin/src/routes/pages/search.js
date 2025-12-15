import { scanningLookupByScan } from "../../core/firebase/functionsClient.js";

export function renderSearch(root, ctx) {
  root.innerHTML = `
    <label>Zoeken op scanwaarde (klantcode/labelcode)</label>
    <input id="q" class="input" placeholder="Plak/typ scanwaarde…" />
    <div class="row">
      <button class="btn btnPrimary" id="btn" type="button">Zoek</button>
    </div>
    <pre id="out"></pre>
    <div class="small muted">Naam zoeken (free text) komt later.</div>
  `;
  const q = root.querySelector("#q");
  const out = root.querySelector("#out");
  root.querySelector("#btn").onclick = async () => {
    const v = q.value.trim();
    if (!v) { out.textContent = "Leeg"; return; }
    out.textContent = "Zoeken…";
    try {
      const data = await scanningLookupByScan(v);
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = `Fout: ${e?.message || e}`;
    }
  };
}
