import { getLayout, getOcc, saveOcc } from "./storage.js";

export function slotKey(r,p,e){ return `${r}-${p}-${e}`; }

export function findFirstFreeLocation(){
  const layout = getLayout();
  const occ = getOcc();

  for(let r=1; r<=layout.racks; r++){
    for(let p=1; p<=layout.positionsPerRack; p++){
      for(let e=1; e<=layout.levelsPerPosition; e++){
        const key = slotKey(r,p,e);
        const used = occ[key] || {};
        for(let sub=1; sub<=layout.maxSubPerSlot; sub++){
          if(!used[String(sub)]) return { r,p,e,sub };
        }
      }
    }
  }
  return null;
}

export function reserveLocation(loc){
  const layout = getLayout();
  const occ = getOcc();
  const key = slotKey(loc.r, loc.p, loc.e);
  const used = occ[key] || {};

  const sub = Number(loc.sub);
  if(!Number.isFinite(sub) || sub < 1 || sub > layout.maxSubPerSlot) return false;
  if(used[String(sub)]) return false;

  used[String(sub)] = true;
  occ[key] = used;
  saveOcc(occ);
  return true;
}

export function freeLocation(loc){
  const occ = getOcc();
  const key = slotKey(loc.r, loc.p, loc.e);
  const used = occ[key] || {};
  delete used[String(loc.sub)];
  occ[key] = used;
  saveOcc(occ);
}
