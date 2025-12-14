import { getPackages } from "../../shared/data/storage.js";
import { carrierName, escapeAttr } from "../../core/utils.js";

export function renderOverzicht(el){
  const all = getPackages();
  const stored = all.filter(x=>x.status==="stored");
  const picked = all.filter(x=>x.status==="picked_up");

  const byStored = groupByCarrier(stored);
  const byPicked = groupByCarrier(picked);

  el.innerHTML = `
    <div class="card stack">
      <div style="font-weight:900;font-size:16px">Overzicht</div>
      <div class="brandTag">Totaal + per carrier</div>

      <div class="btnRow">
        <div class="card" style="flex:1">
          <div class="brandTag">Binnen (stored)</div>
          <div style="font-size:28px;font-weight:900">${stored.length}</div>
        </div>
        <div class="card" style="flex:1">
          <div class="brandTag">Afgehaald</div>
          <div style="font-size:28px;font-weight:900">${picked.length}</div>
        </div>
      </div>

      <div class="hint">Binnen (stored) per carrier</div>
      ${renderCarrierCards(byStored)}

      <div class="hint">Afgehaald per carrier</div>
      ${renderCarrierCards(byPicked)}
    </div>
  `;
}

function groupByCarrier(list){
  const map = {};
  for(const x of list){
    map[x.carrier] = (map[x.carrier] || 0) + 1;
  }
  return map;
}

function renderCarrierCards(map){
  const rows = Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .map(([id,count]) => `
      <div class="itemCard">
        <div class="itemTop">
          <div class="itemName">${escapeAttr(carrierName(id))}</div>
          <div style="font-weight:900;font-size:18px">${count}</div>
        </div>
      </div>
    `).join("");

  return rows ? `<div class="stack">${rows}</div>` : `<div class="hint">Geen data</div>`;
}
