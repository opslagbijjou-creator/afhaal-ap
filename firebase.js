import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBifmA2oDNeDUU50svOIWeuN8pQftEuT6Q",
  authDomain: "afhaalpunt-app.firebaseapp.com",
  projectId: "afhaalpunt-app",
  storageBucket: "afhaalpunt-app.firebasestorage.app",
  messagingSenderId: "18677862602",
  appId: "1:18677862602:web:c5a334a64fd5d39c716433"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
