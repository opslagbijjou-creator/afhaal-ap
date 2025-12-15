import { listenAuth, loginEmailPassword, logout } from "./modules/auth/authClient.js";
import { getRoleForUser } from "./core/shared/roles.js";
import { Routes, getRoute, setRoute } from "./core/router/router.js";

import { renderDashboard } from "./routes/pages/dashboard.js";
import { renderIntake } from "./routes/pages/intake.js";
import { renderPickup } from "./routes/pages/pickup.js";
import { renderSearch } from "./routes/pages/search.js";
import { renderRacks } from "./routes/pages/racks.js";
import { renderLogs } from "./routes/pages/logs.js";

const statusEl = document.getElementById("status");
const debugEl = document.getElementById("debug");
const roleTagEl = document.getElementById("roleTag");
const pageTitleEl = document.getElementById("pageTitle");
const pageTagEl = document.getElementById("pageTag");

const navEl = document.getElementById("nav");
const appRoot = document.getElementById("app");

const form = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

let ctx = { user: null, role: "anon" };

function setStatus(text) {
  statusEl.textContent = `Status: ${text}`;
}

function buildNav() {
  const role = ctx.role;
  const items = [
    { r: Routes.DASHBOARD, label: "Dashboard", tag: "Home" },
    { r: Routes.INTAKE, label: "Inscan", tag: "Medewerker" },
    { r: Routes.PICKUP, label: "Ophaal", tag: "Medewerker" },
    { r: Routes.SEARCH, label: "Zoeken", tag: "Medewerker" },
  ];

  if (role === "moderator") {
    items.push(
      { r: Routes.RACKS, label: "Rekken", tag: "Admin" },
      { r: Routes.LOGS, label: "Logs", tag: "Admin" },
    );
  }

  navEl.innerHTML = `<div class="nav">
    ${items.map(i => `<button class="navBtn" data-route="${i.r}"><span>${i.label}</span><span class="tag">${i.tag}</span></button>`).join("")}
  </div>`;

  navEl.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => setRoute(btn.getAttribute("data-route")));
  });
}

function renderRoute() {
  const route = getRoute();
  const role = ctx.role;

  const map = {
    [Routes.DASHBOARD]: { title: "Dashboard", tag: "Home", render: renderDashboard },
    [Routes.INTAKE]: { title: "Inscan", tag: "Medewerker", render: renderIntake },
    [Routes.PICKUP]: { title: "Ophaal", tag: "Medewerker", render: renderPickup },
    [Routes.SEARCH]: { title: "Zoeken", tag: "Medewerker", render: renderSearch },
    [Routes.RACKS]: { title: "Rekken", tag: "Admin", render: renderRacks },
    [Routes.LOGS]: { title: "Logs", tag: "Admin", render: renderLogs },
  };

  // Guard: admin pages only moderator
  if ((route === Routes.RACKS || route === Routes.LOGS) && role !== "moderator") {
    pageTitleEl.textContent = "Geen toegang";
    pageTagEl.textContent = "403";
    appRoot.innerHTML = `<div class="notice">Alleen moderator.</div>`;
    return;
  }

  const entry = map[route] || map[Routes.DASHBOARD];
  pageTitleEl.textContent = entry.title;
  pageTagEl.textContent = entry.tag;
  entry.render(appRoot, ctx);
}

window.addEventListener("hashchange", renderRoute);

listenAuth((user) => {
  if (!user) {
    ctx = { user: null, role: "anon" };
    roleTagEl.textContent = "ANON";
    setStatus("niet ingelogd");
    debugEl.textContent = "";
    buildNav();
    renderRoute();
    return;
  }

  const role = getRoleForUser(user);
  ctx = { user, role };
  roleTagEl.textContent = role.toUpperCase();
  setStatus(`ingelogd als ${user.email} (${role})`);
  debugEl.textContent = JSON.stringify({ uid: user.uid, email: user.email, role }, null, 2);
  buildNav();
  renderRoute();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    setStatus("bezig met inloggen...");
    await loginEmailPassword(email, password);
  } catch (err) {
    console.error(err);
    setStatus(`login fout: ${err.code || err.message}`);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    setStatus("bezig met uitloggen...");
    await logout();
  } catch (err) {
    console.error(err);
    setStatus(`logout fout: ${err.code || err.message}`);
  }
});
