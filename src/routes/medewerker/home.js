export function renderMedewerkerHome(root) {
  root.innerHTML = `
    <h2>Medewerker</h2>
    <p>Kies actie:</p>
    <ul>
      <li><button id="go-inscan">Inscan</button></li>
      <li><button id="go-ophaal">Ophaal</button></li>
      <li><button id="go-zoeken">Zoeken</button></li>
    </ul>
    <div id="page"></div>
  `;

  const page = root.querySelector("#page");

  root.querySelector("#go-inscan").onclick = () => {
    page.innerHTML = `<h3>Inscan</h3><p>(komt in volgende stap)</p>`;
  };
  root.querySelector("#go-ophaal").onclick = () => {
    page.innerHTML = `<h3>Ophaal</h3><p>(komt in volgende stap)</p>`;
  };
  root.querySelector("#go-zoeken").onclick = () => {
    page.innerHTML = `<h3>Zoeken</h3><p>(fallback zoeken komt later)</p>`;
  };
}