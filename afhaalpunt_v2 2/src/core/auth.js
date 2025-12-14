import { auth } from "../../firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function listenAuth(cb){
  return onAuthStateChanged(auth, cb);
}

export function login(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout(){
  return signOut(auth);
}
