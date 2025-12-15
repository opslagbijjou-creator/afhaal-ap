export function renderModeratorHome(root) {
  root.innerHTML = `
    <h2>Moderator</h2>
    <p>Je hebt alle rechten.</p>

    <h3>Medewerker acties</h3>
    <ul>
      <li><button id="go-inscan">Inscan</button></li>
      <li><button id="go-ophaal">Ophaal</button></li>
      <li><button id="go-zoeken">Zoeken</button></li>
    </ul>

    <h3>Admin</h3>
    <ul>
      <li><button id="go-rekken">Rekken beheren</button></li>
      <li><button id="go-medewerkers">Medewerkers beheren</button></li>
      <li><button id="go-logs">Logs</button></li>
    </ul>

    <div id="page"></div>
  `;

  const page = root.querySelector("#page");

  root.querySelector("#go-inscan").onclick = () => page.innerHTML = `<h3>Inscan</h3><p>(komt in volgende stap)</p>`;
  root.querySelector("#go-ophaal").onclick = () => page.innerHTML = `<h3>Ophaal</h3><p>(komt in volgende stap)</p>`;
  root.querySelector("#go-zoeken").onclick = () => page.innerHTML = `<h3>Zoeken</h3><p>(komt later)</p>`;

  root.querySelector("#go-rekken").onclick = () => page.innerHTML = `<h3>Rekken</h3><p>(rek beheer komt straks)</p>`;
  root.querySelector("#go-medewerkers").onclick = () => page.innerHTML = `<h3>Medewerkers</h3><p>(rollen via claims komt in STAP 4)</p>`;
  root.querySelector("#go-logs").onclick = () => page.innerHTML = `<h3>Logs</h3><p>(audit logs komen straks)</p>`;
}