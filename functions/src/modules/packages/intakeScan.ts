import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, nowTs, logEvent } from "../../_util";
import { Carrier } from "../../_types";

const CARRIERS = new Set(["POSTNL","DHL","DPD","UPS","GLS","MONDIAL","VINTEDGO","OTHER"]);

export const intakeScan = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const carrier = String(data?.carrier || "OTHER").toUpperCase();
  if (!CARRIERS.has(carrier)) throw new functions.https.HttpsError("invalid-argument", "carrier ongeldig.");
  const labelCode = String(data?.labelCode || "").trim();
  if (!labelCode) throw new functions.https.HttpsError("invalid-argument", "labelCode is verplicht.");
  const customerName = String(data?.customerName || "").trim();

  const db = admin.firestore();
  const t = nowTs();

  // Create package
  const ref = await db.collection("packages").add({
    carrier: carrier as Carrier,
    status: "IN_STOCK",
    customerName: customerName || null,
    identifiers: [
      { type: "LABEL_BARCODE", value: labelCode, source: "INTAKE", scannedAt: t }
    ],
    identifierValues: [labelCode],
    receivedAt: t,
    createdAt: t,
    updatedAt: t,
    createdBy: uid
  });

  await logEvent(db, uid, {
    type: "RECEIVED",
    packageId: ref.id,
    after: { carrier, status: "IN_STOCK", labelCode, customerName: customerName || null }
  });

  return { packageId: ref.id, status: "IN_STOCK" };
});
