/**
 * Script to set admin role for a Firebase user.
 *
 * Usage (from apps/api directory):
 *   node --env-file=.env --import=tsx scripts/set-admin.ts <user-email>
 *
 * Or with pnpm:
 *   pnpm set-admin <user-email>
 *
 * Example:
 *   pnpm set-admin admin@fingenie.vn
 */
import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase env vars. Make sure apps/api/.env contains:");
  console.error("  FIREBASE_PROJECT_ID");
  console.error("  FIREBASE_CLIENT_EMAIL");
  console.error("  FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

async function setAdmin(email: string) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
    console.log(`Successfully set admin role for: ${email} (uid: ${user.uid})`);
    console.log(
      "Note: User needs to sign out and sign back in for the new role to take effect.",
    );
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm set-admin <user-email>");
  process.exit(1);
}

setAdmin(email);
