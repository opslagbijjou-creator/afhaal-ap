import { listenAuth, loginEmailPassword, logout } from "./modules/auth/authClient.js";

const statusEl = document.getElementById("status");
const debugEl = document.getElementById("debug");
const form = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

function setStatus(text) {
  statusEl.textContent = `Status: ${text}`;
}

listenAuth((user) => {
  if (!user) {
    setStatus("niet ingelogd");
    debugEl.textContent = "";
    return;
  }

  setStatus(`ingelogd als ${user.email}`);
  debugEl.textContent = JSON.stringify(
    {
      uid: user.uid,
      email: user.email,
    },
    null,
    2
  );
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