import { State } from "./state.js";
import { nameFromEmail, escapeAttr } from "./utils.js";
import { logout } from "./auth.js";
import { go } from "./router.js";

export function renderShell(root, { subtitle } = {}) {
  const name = nameFromEmail(State.user?.email || "");
  root.innerHTML = `
    <div class="container">
      <div class="topbar">
        <div class="brandLeft">
          <div class="brandMark"></div>
          <div>
            <div class="brandName">Afhaalpunt</div>
            <div class="brandTag">${escapeAttr(subtitle || "Scan • Opslaan • Afgeven")}</div>
          </div>
        </div>
        <div class="userPill" id="userBtn" title="Uitloggen">
          <span>👤</span><span class="name">${escapeAttr(name)}</span>
        </div>
      </div>

      <div id="page" class="stack"></div>
    </div>

    <div class="nav">
      <div class="navInner">
        <button class="navBtn ${State.page==='home'?'active':''}" onclick="window.go('home')">🏠 Menu</button>
        <button class="navBtn ${String(State.page).startsWith('inscan')?'active':''}" onclick="window.go('inscan.carrier')">📥 Inscannen</button>
        <button class="navBtn ${String(State.page).startsWith('ophaal')?'active':''}" onclick="window.go('ophaal')">✅ Ophaal</button>
        <button class="navBtn ${State.page==='overzicht'?'active':''}" onclick="window.go('overzicht')">📊 Overzicht</button>
      </div>
    </div>
  `;

  document.getElementById("userBtn").onclick = async () => {
    await logout();
    go("login");
  };
}
