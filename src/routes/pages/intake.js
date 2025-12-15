import {
  packagesIntakeScan,
  packagesAssignLocation,
  packagesAssignSubNo
} from "../../core/firebase/functionsClient.js";

const CARRIERS = ["POSTNL","DHL","DPD","UPS","GLS","MONDIAL","VINTEDGO","OTHER"];

export function renderIntake(root, ctx) {
  root.innerHTML = `
    <div class="grid2">
      <div>
        <label>Vervoerder</label>
        <select id="carrier" class="input">
          ${CARRIERS.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>

        <label>Labelcode (barcode op pakket)</label>
        <input id="labelCode" class="input" placeholder="Scan/plak labelcode…" />

        <label>Naam (optioneel)</label>
        <input id="customerName" class="input" placeholder="Naam uit klantscan of handmatig" />

        <div class="row">
          <button class="btn btnPrimary" id="btnCreate" type="button">Pakket aanmaken</button>
        </div>

        <div id="created" style="margin-top:12px;"></div>
      </div>

      <div>
        <div class="kv"><span>Locatie</span><b class="small muted">rek•positie•etage</b></div>

        <div class="grid2" style="margin-top:12px;">
          <div>
            <label>Rek</label>
            <input id="rackNo" class="input" type="number" min="1" placeholder="1" />
          </div>
          <div>
            <label>Positie</label>
            <input id="positionNo" class="input" type="number" min="1" placeholder="2" />
          </div>
        </div>

        <label>Etage</label>
        <input id="levelNo" class="input" type="number" min="1" placeholder="3" />

        <label>Subnummer (optioneel, uniek zolang in voorraad)</label>
        <input id="subNo" class="input" type="number" min="1" placeholder="16" />

        <div class="row">
          <button class="btn btnGood" id="btnAssign" type="button" disabled>Locatie + subnr opslaan</button>
        </div>

        <div id="assigned" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  const carrierEl = root.querySelector("#carrier");
  const labelEl = root.querySelector("#labelCode");
  const nameEl = root.querySelector("#customerName");
  const rackEl = root.querySelector("#rackNo");
  const posEl = root.querySelector("#positionNo");
  const lvlEl = root.querySelector("#levelNo");
  const subEl = root.querySelector("#subNo");
  const btnCreate = root.querySelector("#btnCreate");
  const btnAssign = root.querySelector("#btnAssign");
  const createdEl = root.querySelector("#created");
  const assignedEl = root.querySelector("#assigned");

  let currentPackageId = null;

  btnCreate.onclick = async () => {
    const carrier = carrierEl.value;
    const labelCode = labelEl.value.trim();
    const customerName = nameEl.value.trim();
    if (!labelCode) {
      createdEl.innerHTML = `<div class="notice">Labelcode is verplicht.</div>`;
      return;
    }
    createdEl.innerHTML = `<div class="notice">Aanmaken…</div>`;
    try {
      const res = await packagesIntakeScan({ carrier, labelCode, customerName });
      currentPackageId = res.packageId;
      createdEl.innerHTML = `
        <div class="notice">✅ Aangemaakt: <b>${res.packageId}</b></div>
        <div class="kv"><span>Status</span><b>${res.status}</b></div>
      `;
      btnAssign.disabled = false;
    } catch (e) {
      console.error(e);
      createdEl.innerHTML = `<div class="notice">Fout: ${e?.message || e}</div>`;
    }
  };

  btnAssign.onclick = async () => {
    if (!currentPackageId) return;
    const rackNo = Number(rackEl.value || 0);
    const positionNo = Number(posEl.value || 0);
    const levelNo = Number(lvlEl.value || 0);
    const subNoRaw = subEl.value.trim();
    const subNo = subNoRaw ? Number(subNoRaw) : null;

    if (!rackNo || !positionNo || !levelNo) {
      assignedEl.innerHTML = `<div class="notice">Rek/positie/etage zijn verplicht.</div>`;
      return;
    }

    assignedEl.innerHTML = `<div class="notice">Opslaan…</div>`;
    try {
      const loc = await packagesAssignLocation({ packageId: currentPackageId, rackNo, positionNo, levelNo });
      if (subNo) {
        await packagesAssignSubNo({ packageId: currentPackageId, subNo });
      }
      assignedEl.innerHTML = `
        <div class="notice">✅ Opgeslagen</div>
        <div class="kv"><span>Locatie</span><b>${loc.locationDisplay}</b></div>
        <div class="kv"><span>Subnr</span><b>${subNo ?? "-"}</b></div>
      `;
    } catch (e) {
      console.error(e);
      assignedEl.innerHTML = `<div class="notice">Fout: ${e?.message || e}</div>`;
    }
  };
}
