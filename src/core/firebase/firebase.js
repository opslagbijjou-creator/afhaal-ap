import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBifmA2oDNeDUU50svOIWeuN8pQftEuT6Q",
  authDomain: "afhaalpunt-app.firebaseapp.com",
  projectId: "afhaalpunt-app",
  storageBucket: "afhaalpunt-app.firebasestorage.app",
  messagingSenderId: "18677862602",
  appId: "1:18677862602:web:c5a334a64fd5d39c716433"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app);