export function renderMedewerkerHome(root) {
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

      <div class="tile" id="go-zoeken">
        <div>
          <div class="tTitle">Zoeken</div>
          <div class="tSub">Fallback op naam / code</div>
        </div>
        <span class="tag">→</span>
      </div>
    </div>

    <div id="page" style="margin-top:12px;"></div>
  `;

  const page = root.querySelector("#page");

  root.querySelector("#go-inscan").onclick = () => {
    page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Inscan</h2><p>Komt in volgende stap.</p></div></div>`;
  };
  root.querySelector("#go-ophaal").onclick = () => {
    page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Ophaal</h2><p>Komt in volgende stap.</p></div></div>`;
  };
  root.querySelector("#go-zoeken").onclick = () => {
    page.innerHTML = `<div class="card" style="margin-top:12px;"><div class="cardBody"><h2>Zoeken</h2><p>Komt later.</p></div></div>`;
  };
}