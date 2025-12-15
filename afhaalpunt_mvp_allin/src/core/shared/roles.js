// TIJDELIJK: moderator via email. Later vervangen door Custom Claims.
export const MODERATOR_EMAILS = [
  "mod@voorbeeld.nl"
];

export function getRoleForUser(user) {
  if (!user?.email) return "anon";
  const email = user.email.toLowerCase();
  if (MODERATOR_EMAILS.map(e => e.toLowerCase()).includes(email)) return "moderator";
  return "medewerker";
}
