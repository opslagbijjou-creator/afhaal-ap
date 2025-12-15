import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth } from "../../_util";

export const listRacks = functions.https.onCall(async (_data, context) => {
  requireAuth(context);
  const db = admin.firestore();
  const qs = await db.collection("racks").orderBy("rackNo", "asc").limit(200).get();
  const racks = qs.docs.map(d => ({ rackId: d.id, ...d.data() }));
  return { racks };
});
