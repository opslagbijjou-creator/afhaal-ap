// FILE: public/app.js
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { functions } from "./core/firebase.js";
import { hideAlert, showAlert, setLoading, formatStatus } from "./core/ui.js";

const els = {
  form: document.getElementById("lookupForm"),
  input: document.getElementById("barcodeInput"),
  btn: document.getElementById("searchBtn"),
  alert: document.getElementById("alert"),
  result: document.getElementById("result"),
  notFound: document.getElementById("notFound"),
  customerName: document.getElementById("customerName"),
  rackCode: document.getElementById("rackCode"),
  barcodeValue: document.getElementById("barcodeValue"),
  statusPill: document.getElementById("statusPill"),
};

const lookupPackage = httpsCallable(functions, "lookupPackage");

function resetViews() {
  els.result.hidden = true;
  els.notFound.hidden = true;
  hideAlert(els.alert);
}

function renderFound(pkg) {
  const { label, variant } = formatStatus(pkg.status);
  els.statusPill.textContent = label;
  els.statusPill.className = "pill";
  if (variant === "success") els.statusPill.classList.add("pill--success");
  if (variant === "warning") els.statusPill.classList.add("pill--warning");

  els.customerName.textContent = pkg.customerName || "—";
  els.rackCode.textContent = pkg.rackCode || "—";
  els.barcodeValue.textContent = pkg.barcode || "—";

  els.result.hidden = false;
}

function renderNotFound() {
  els.notFound.hidden = false;
}

function normalizeBarcode(v) {
  return String(v || "").trim();
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetViews();

  const barcode = normalizeBarcode(els.input.value);
  if (!barcode) {
    showAlert(els.alert, { type: "error", message: "Vul een barcode in." });
    els.input.focus();
    return;
  }

  setLoading(els.btn, true);

  try {
    const res = await lookupPackage({ barcode });
    const data = res?.data;

    if (data?.found) {
      renderFound(data.package);
      showAlert(els.alert, { type: "success", message: "Pakket gevonden." });
    } else {
      renderNotFound();
      showAlert(els.alert, { type: "error", message: "Geen pakket gevonden met deze barcode." });
    }
  } catch (err) {
    const msg =
      err?.message ||
      "Er ging iets mis bij het opzoeken. Controleer je Firebase config en deploy van Functions.";
    showAlert(els.alert, { type: "error", message: msg });
  } finally {
    setLoading(els.btn, false);
  }
});

setTimeout(() => els.input?.focus(), 150);