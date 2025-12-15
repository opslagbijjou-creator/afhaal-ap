export function renderModeratorHome(root) {
  root.innerHTML = `
    <div class="tiles">
      <div class="tile" id="go-inscan">
        <div>
          <div class="tTitle">Inscan</div>
          <div class="tSub">Pakket binnen → locatie geven</div>
        </div>
        <span class="tag">→</span>
      </div>

      <div class="tile" id="go-ophaal">
        <div>
          <div class="tTitle">Ophaal</div>
          <div class="tSub">Klantcode → direct 1•2•3</div>
        </div>
        <span class="tag">→</span>
      </div>

      <div class="tile" id="go-rekken">
        <div>
          <div class="tTitle">Rekken</div>
          <div class="tSub">Beheer rekken / etages / posities</div>
        </div>
        <span class="tag">Admin</span>
      </div>

      <div class="tile" id="go-medewerkers">
        <div>
          <div class="tTitle">Medewerkers</div>
          <div class="tSub">Accounts + rollen</div>
        </div>
        <span class="tag">Admin</span>
      </div>

      <div class="tile" id="go-logs">
        <div>
          <div class="tTitle">Logs</div>
          <div class="tSub">Alles wat ooit gescand/gewijzigd is</div>
        </div>
        <span class="tag">Admin</span>
      </div>
    </div>

    <div id="page" style="margin-top:12px;"></div>
  `;

  const page = root.querySelector("#page");

  root.querySelector("#go-inscan").onclick = () => page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Inscan</h2><p>Komt in volgende stap.</p></div></div>`;
  root.querySelector("#go-ophaal").onclick = () => page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Ophaal</h2><p>Komt in volgende stap.</p></div></div>`;
  root.querySelector("#go-rekken").onclick = () => page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Rekken</h2><p>Komt straks.</p></div></div>`;
  root.querySelector("#go-medewerkers").onclick = () => page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Medewerkers</h2><p>Komt straks (eerst claims).</p></div></div>`;
  root.querySelector("#go-logs").onclick = () => page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Logs</h2><p>Komt straks.</p></div></div>`;
}