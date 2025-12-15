import { listenAuth, loginEmailPassword, logout } from "./modules/auth/authClient.js";
import { getRoleForUser } from "./core/shared/roles.js";
import { renderMedewerkerHome } from "./routes/medewerker/home.js";
import { renderModeratorHome } from "./routes/eigenaar/home.js";

const statusEl = document.getElementById("status");
const debugEl = document.getElementById("debug");
const form = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const appRoot = document.getElementById("app");

function setStatus(text) {
  statusEl.textContent = `Status: ${text}`;
}

function renderAppForUser(user) {
  if (!user) {
    appRoot.innerHTML = "";
    return;
  }
  const role = getRoleForUser(user);
  if (role === "moderator") renderModeratorHome(appRoot);
  else renderMedewerkerHome(appRoot);
}

listenAuth((user) => {
  if (!user) {
    setStatus("niet ingelogd");
    debugEl.textContent = "";
    renderAppForUser(null);
    return;
  }

  const role = getRoleForUser(user);
  setStatus(`ingelogd als ${user.email} (${role})`);
  debugEl.textContent = JSON.stringify({ uid: user.uid, email: user.email, role }, null, 2);
  renderAppForUser(user);
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