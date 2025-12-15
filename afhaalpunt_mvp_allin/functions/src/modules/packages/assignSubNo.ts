import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, nowTs } from "../../_util";

export const assignSubNo = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const packageId = String(data?.packageId || "").trim();
  const subNo = Number(data?.subNo || 0);
  if (!packageId) throw new functions.https.HttpsError("invalid-argument", "packageId is verplicht.");
  if (!subNo) throw new functions.https.HttpsError("invalid-argument", "subNo is verplicht.");

  const db = admin.firestore();
  const pkgRef = db.collection("packages").doc(packageId);
  const leaseRef = db.collection("activeSubNumbers").doc(String(subNo));

  await db.runTransaction(async (tx) => {
    const pkgSnap = await tx.get(pkgRef);
    if (!pkgSnap.exists) throw new functions.https.HttpsError("not-found", "Pakket bestaat niet.");

    const leaseSnap = await tx.get(leaseRef);
    if (leaseSnap.exists) {
      const current = leaseSnap.data();
      throw new functions.https.HttpsError("already-exists", `Subnummer ${subNo} is al in gebruik (pakket ${current?.packageId}).`);
    }

    const t = nowTs();
    tx.set(leaseRef, {
      packageId,
      status: "ACTIVE",
      createdAt: t,
      updatedAt: t,
      createdBy: uid
    });

    tx.update(pkgRef, {
      subNo,
      updatedAt: t
    });

    const evRef = db.collection("packageEvents").doc();
    tx.set(evRef, {
      type: "SUB_ASSIGNED",
      packageId,
      before: { subNo: pkgSnap.data()?.subNo ?? null },
      after: { subNo },
      performedAt: t,
      performedBy: uid,
      createdAt: t,
      updatedAt: t,
      createdBy: uid
    });
  });

  return { subNo };
});
