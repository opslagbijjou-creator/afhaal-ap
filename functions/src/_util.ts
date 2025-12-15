import { HttpsError } from "firebase-functions/v2/https";

/**
 * Require authenticated user (callable functions)
 */
export function requireAuth(context: any): string {
  if (!context?.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  return context.auth.uid;
}