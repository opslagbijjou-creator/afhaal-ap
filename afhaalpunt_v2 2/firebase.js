import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/** PLAK HIER JE FIREBASE CONFIG (Project settings -> Web app) */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_KEY",
  authDomain: "PASTE_YOUR_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
