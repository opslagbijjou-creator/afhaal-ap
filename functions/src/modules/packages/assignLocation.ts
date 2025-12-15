import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, nowTs, locDisplay, logEvent } from "../../_util";

export const assignLocation = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const packageId = String(data?.packageId || "").trim();
  const rackNo = Number(data?.rackNo || 0);
  const positionNo = Number(data?.positionNo || 0);
  const levelNo = Number(data?.levelNo || 0);
  if (!packageId) throw new functions.https.HttpsError("invalid-argument", "packageId is verplicht.");
  if (!rackNo || !positionNo || !levelNo) throw new functions.https.HttpsError("invalid-argument", "rackNo/positionNo/levelNo verplicht.");

  const db = admin.firestore();
  const ref = db.collection("packages").doc(packageId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new functions.https.HttpsError("not-found", "Pakket bestaat niet.");
    const before = snap.data();

    const display = locDisplay(rackNo, positionNo, levelNo);
    const t = nowTs();

    tx.update(ref, {
      location: { rackNo, positionNo, levelNo, display },
      updatedAt: t,
      // createdBy must remain original; do not change
    });

    // log event outside tx is ok, but we keep it in tx by writing to events collection
    const evRef = db.collection("packageEvents").doc();
    tx.set(evRef, {
      type: "LOCATION_ASSIGNED",
      packageId,
      before: { location: before?.location ?? null },
      after: { location: { rackNo, positionNo, levelNo, display } },
      performedAt: t,
      performedBy: uid,
      createdAt: t,
      updatedAt: t,
      createdBy: uid
    });
  });

  return { locationDisplay: locDisplay(rackNo, positionNo, levelNo) };
});
