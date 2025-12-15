export function renderDashboard(root, ctx) {
  const role = ctx.role;
  root.innerHTML = `
    <div class="notice">
      <b>Welkom!</b><br/>
      Gebruik het menu links. Je bent ingelogd als <b>${role}</b>.
    </div>
    <div class="grid2" style="margin-top:12px;">
      <div class="kv"><span>Vandaag in voorraad</span><b>(komt straks)</b></div>
      <div class="kv"><span>Niet gevonden</span><b>(komt straks)</b></div>
    </div>
    <div class="hr"></div>
    <div class="small muted">
      Tip: test nu alvast de flows met handmatig plakken van een scanwaarde.
    </div>
  `;
}
