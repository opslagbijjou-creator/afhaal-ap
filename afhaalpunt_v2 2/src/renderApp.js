import { State } from "./core/state.js";
import { renderLogin } from "./shared/pages/login.js";
import { renderMedewerker } from "./medewerker/app.js";
import { renderModerator } from "./moderator/app.js";

export function renderApp(root){
  // login gate
  if(!State.user){
    return renderLogin(root);
  }

  // role routing
  if(State.role === "moderator"){
    return renderModerator(root);
  }
  return renderMedewerker(root);
}
