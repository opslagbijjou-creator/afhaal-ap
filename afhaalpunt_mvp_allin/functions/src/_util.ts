import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export function requireAuth(context: functions.https.CallableContext) {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login vereist.");
  return context.auth.uid;
}

export function nowTs() {
  return admin.firestore.Timestamp.now();
}

export function locDisplay(rackNo: number, positionNo: number, levelNo: number) {
  return `${rackNo}•${positionNo}•${levelNo}`;
}

export async function logEvent(db: FirebaseFirestore.Firestore, uid: string, ev: {
  type: string; packageId: string; before?: any; after?: any; reason?: string;
}) {
  const t = nowTs();
  await db.collection("packageEvents").add({
    type: ev.type,
    packageId: ev.packageId,
    before: ev.before ?? null,
    after: ev.after ?? null,
    reason: ev.reason ?? null,
    performedAt: t,
    performedBy: uid,
    createdAt: t,
    updatedAt: t,
    createdBy: uid,
  });
}
