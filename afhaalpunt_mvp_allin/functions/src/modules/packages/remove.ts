import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, nowTs } from "../../_util";

export const remove = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const packageId = String(data?.packageId || "").trim();
  const reason = String(data?.reason || "").trim();
  if (!packageId) throw new functions.https.HttpsError("invalid-argument", "packageId is verplicht.");
  if (!reason) throw new functions.https.HttpsError("invalid-argument", "reason is verplicht.");

  const db = admin.firestore();
  const pkgRef = db.collection("packages").doc(packageId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(pkgRef);
    if (!snap.exists) throw new functions.https.HttpsError("not-found", "Pakket bestaat niet.");

    const before = snap.data();
    const t = nowTs();

    const subNo = before?.subNo;
    if (subNo) {
      tx.delete(db.collection("activeSubNumbers").doc(String(subNo)));
      const ev2 = db.collection("packageEvents").doc();
      tx.set(ev2, {
        type: "SUB_RELEASED",
        packageId,
        before: { subNo },
        after: { subNo: null },
        performedAt: t,
        performedBy: uid,
        createdAt: t,
        updatedAt: t,
        createdBy: uid
      });
    }

    tx.update(pkgRef, {
      status: "REMOVED",
      removedAt: t,
      updatedAt: t
    });

    const ev = db.collection("packageEvents").doc();
    tx.set(ev, {
      type: "REMOVED_BY_USER",
      packageId,
      reason,
      before: { status: before?.status ?? null },
      after: { status: "REMOVED" },
      performedAt: t,
      performedBy: uid,
      createdAt: t,
      updatedAt: t,
      createdBy: uid
    });
  });

  return { status: "REMOVED" };
});
