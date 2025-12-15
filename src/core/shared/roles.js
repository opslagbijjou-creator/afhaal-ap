export const MODERATOR_EMAILS = [
  "folkert@test.nl" // zet hier jouw moderator email
];

export function getRoleForUser(user) {
  if (!user?.email) return "anon";
  const email = user.email.toLowerCase();
  if (MODERATOR_EMAILS.map(e => e.toLowerCase()).includes(email)) return "moderator";
  return "medewerker";
}