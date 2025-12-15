import { functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

export async function lookupByScan(scanValue) {
  const fn = httpsCallable(functions, "scanning_lookupByScan");
  const res = await fn({ scanValue });
  return res.data;
}