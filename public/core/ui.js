// FILE: public/core/ui.js
export function setLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  buttonEl.classList.toggle("is-loading", Boolean(isLoading));
  buttonEl.disabled = Boolean(isLoading);
}

export function showAlert(alertEl, { type = "info", message = "" } = {}) {
  if (!alertEl) return;
  alertEl.hidden = false;
  alertEl.className = "alert";
  if (type === "error") alertEl.classList.add("alert--error");
  if (type === "success") alertEl.classList.add("alert--success");
  alertEl.textContent = message;
}

export function hideAlert(alertEl) {
  if (!alertEl) return;
  alertEl.hidden = true;
  alertEl.textContent = "";
  alertEl.className = "alert";
}

export function formatStatus(status) {
  if (status === "stored") return { label: "Stored", variant: "success" };
  if (status === "picked_up") return { label: "Picked up", variant: "warning" };
  return { label: String(status || "—"), variant: "neutral" };
}