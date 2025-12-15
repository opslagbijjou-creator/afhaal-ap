// TIJDELIJK: dev-rollen via email.
// In STAP 4 vervangen we dit door Custom Claims via Cloud Functions.

export const MODERATOR_EMAILS = [
  // zet hier jouw moderator email(s)
  "mod@thegoat.nl",
];

export function getRoleForUser(user) {
  if (!user?.email) return "anon";
  const email = user.email.toLowerCase();
  if (MODERATOR_EMAILS.map(e => e.toLowerCase()).includes(email)) return "moderator";
  return "medewerker";
}