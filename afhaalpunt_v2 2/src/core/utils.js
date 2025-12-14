import { CARRIERS } from "./config.js";

export function nameFromEmail(email){
  if(!email) return "Medewerker";
  const base = email.split("@")[0] || "medewerker";
  return base.replace(/[._-]+/g, " ").trim().split(" ").filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function escapeAttr(v){
  return String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

export function toast(text, ok=true){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="dot" style="background:${ok ? "rgba(52,211,153,.95)" : "rgba(251,113,133,.95)"}"></span><span>${escapeAttr(text)}</span>`;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1100);
}

export function beep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start(); setTimeout(()=>{ o.stop(); ctx.close(); }, 120);
  }catch(e){}
}

export function haptic(){ try{ navigator.vibrate?.([60,30,60]); }catch(e){} }
export function nowISO(){ return new Date().toISOString(); }
export function formatDate(iso){ try{ return new Date(iso).toLocaleDateString("nl-NL"); }catch(e){ return iso?.slice(0,10) || ""; } }
export function carrierName(id){ return (CARRIERS.find(c=>c.id===id)?.name) || id || "-"; }
