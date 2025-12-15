// FILE: public/core/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import {
  FUNCTIONS_REGION,
  USE_EMULATORS,
  EMULATOR_FUNCTIONS_HOST,
  EMULATOR_FUNCTIONS_PORT,
} from "./constants.js";

// Plak je firebaseConfig HIER:
export const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};

export const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, FUNCTIONS_REGION);

if (USE_EMULATORS) {
  connectFunctionsEmulator(functions, EMULATOR_FUNCTIONS_HOST, EMULATOR_FUNCTIONS_PORT);
}