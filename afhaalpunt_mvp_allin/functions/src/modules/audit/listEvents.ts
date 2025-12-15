import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth } from "../../_util";

export const listEvents = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const limit = Math.min(Number(data?.limit || 50), 200);
  const db = admin.firestore();
  const qs = await db.collection("packageEvents").orderBy("performedAt", "desc").limit(limit).get();
  const events = qs.docs.map(d => ({ eventId: d.id, ...d.data() }));
  return { events };
});
