import { MODERATOR_EMAILS } from "../../core/config.js";

export function detectRole(email){
  const e = (email || "").toLowerCase().trim();
  return MODERATOR_EMAILS.map(x=>x.toLowerCase().trim()).includes(e) ? "moderator" : "medewerker";
}
