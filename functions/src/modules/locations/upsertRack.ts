import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth, nowTs } from "../../_util";

export const upsertRack = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const rackNo = Number(data?.rackNo || 0);
  const levelsCount = Number(data?.levelsCount || 0);
  const positionsCount = Number(data?.positionsCount || 0);
  const label = String(data?.label || "").trim();
  const active = Boolean(data?.active ?? true);

  if (!rackNo || !levelsCount || !positionsCount) {
    throw new functions.https.HttpsError("invalid-argument", "rackNo/levelsCount/positionsCount verplicht.");
  }

  const db = admin.firestore();
  const t = nowTs();

  // Rack doc id = rackNo for simplicity
  const ref = db.collection("racks").doc(String(rackNo));
  await ref.set({
    rackNo, levelsCount, positionsCount, label: label || null, active,
    createdAt: t, updatedAt: t, createdBy: uid
  }, { merge: true });

  return { rackId: ref.id };
});
