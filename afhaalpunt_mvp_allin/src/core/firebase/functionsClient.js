import { functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

function call(name) {
  return httpsCallable(functions, name);
}

export async function scanningLookupByScan(scanValue) {
  const res = await call("scanning_lookupByScan")({ scanValue });
  return res.data;
}

export async function packagesIntakeScan(payload) {
  const res = await call("packages_intakeScan")(payload);
  return res.data;
}

export async function packagesAssignLocation(payload) {
  const res = await call("packages_assignLocation")(payload);
  return res.data;
}

export async function packagesAssignSubNo(payload) {
  const res = await call("packages_assignSubNo")(payload);
  return res.data;
}

export async function packagesPickup(payload) {
  const res = await call("packages_pickup")(payload);
  return res.data;
}

export async function packagesRemove(payload) {
  const res = await call("packages_remove")(payload);
  return res.data;
}

export async function locationsListRacks() {
  const res = await call("locations_listRacks")({});
  return res.data;
}

export async function locationsUpsertRack(payload) {
  const res = await call("locations_upsertRack")(payload);
  return res.data;
}

export async function auditListEvents(payload) {
  const res = await call("audit_listEvents")(payload);
  return res.data;
}
