import { listenAuth } from "./auth.js";
import { State } from "./state.js";
import { detectRole } from "../shared/roles/roleDetect.js";

listenAuth((user) => {
  if(!user){
    State.user = null;
    State.role = "medewerker";
    State.page = "login";
  }else{
    State.user = { email: user.email || "" };
    State.role = detectRole(State.user.email);
    if(State.page === "login") State.page = "home";
  }
  window.__renderApp?.(document.getElementById("app"));
});
