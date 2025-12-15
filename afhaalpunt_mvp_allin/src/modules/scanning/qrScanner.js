// Uses html5-qrcode from CDN (loaded dynamically)
let Html5Qrcode = null;

async function loadLib() {
  if (Html5Qrcode) return Html5Qrcode;
  await import("https://unpkg.com/html5-qrcode@2.3.10/html5-qrcode.min.js");
  // library exposes Html5Qrcode globally
  Html5Qrcode = window.Html5Qrcode;
  return Html5Qrcode;
}

export async function startQrScanner(containerId, onText) {
  await loadLib();
  const qr = new window.Html5Qrcode(containerId);
  await qr.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decodedText) => onText(decodedText, qr),
    () => {}
  );
  return qr;
}

export async function stopQrScanner(qr) {
  if (!qr) return;
  try {
    await qr.stop();
  } catch {}
  try {
    await qr.clear();
  } catch {}
}
