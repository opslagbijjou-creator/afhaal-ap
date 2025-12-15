import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth } from "../../_util";

export const lookupByScan = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const scanValue = String(data?.scanValue || "").trim();
  if (!scanValue) throw new functions.https.HttpsError("invalid-argument", "scanValue is verplicht.");

  const db = admin.firestore();

  // Search packages by identifiers.value (simple indexable field: store identifiers also as flat array values)
  // We'll query by 'identifierValues' for fast exact match.
  const qs = await db.collection("packages")
    .where("identifierValues", "array-contains", scanValue)
    .where("status", "in", ["IN_STOCK", "RECEIVED"])
    .limit(5)
    .get();

  if (qs.empty) {
    // log scan event lightweight
    await db.collection("scanEvents").add({
      scanValue,
      result: "NOT_FOUND",
      performedAt: admin.firestore.Timestamp.now(),
      performedBy: context.auth!.uid,
    });
    return { status: "NOT_FOUND", package: null, candidates: [] };
  }

  const docs = qs.docs.map(d => ({ packageId: d.id, ...d.data() }));

  if (docs.length > 1) {
    return { status: "MULTIPLE_MATCHES", package: null, candidates: docs.map(d => ({
      packageId: d.packageId,
      customerName: d.customerName ?? null,
      locationDisplay: d.location?.display ?? null,
      subNo: d.subNo ?? null,
      receivedAt: d.receivedAt?.toDate?.()?.toISOString?.() ?? null
    })) };
  }

  const p = docs[0] as any;
  return {
    status: "MATCHED",
    package: {
      packageId: p.packageId,
      customerName: p.customerName ?? null,
      locationDisplay: p.location?.display ?? null,
      subNo: p.subNo ?? null,
      receivedAt: p.receivedAt?.toDate?.()?.toISOString?.() ?? null
    },
    candidates: []
  };
});
