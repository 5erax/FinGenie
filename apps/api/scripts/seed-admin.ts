/**
 * Seed script: create the FinGenie admin account.
 *
 * 1. Creates (or gets) Firebase user with email/password
 * 2. Sets Firebase custom claims { role: "admin" }
 * 3. Upserts user in PostgreSQL database with role = admin
 *
 * Usage (from apps/api directory):
 *   node --env-file=.env --import=tsx scripts/seed-admin.ts
 *
 * Or with pnpm:
 *   pnpm seed-admin
 */
import * as admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";

// ── Config ──────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "fingenie@gmail.com";
const ADMIN_PASSWORD = "admin1";
const ADMIN_DISPLAY_NAME = "FinGenie Admin";

// ── Firebase init ───────────────────────────────────────────────────────────
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

// ── Prisma init ─────────────────────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const prisma = new PrismaClient();

// ── Main ────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log(`\nSeeding admin account: ${ADMIN_EMAIL}\n`);

  // 1. Create or get Firebase user
  let firebaseUser: admin.auth.UserRecord;
  try {
    firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log(`[Firebase] User already exists: ${firebaseUser.uid}`);

    // Update password in case it changed
    await admin.auth().updateUser(firebaseUser.uid, {
      password: ADMIN_PASSWORD,
    });
    console.log("[Firebase] Password updated");
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") {
      firebaseUser = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`[Firebase] User created: ${firebaseUser.uid}`);
    } else {
      throw err;
    }
  }

  // 2. Set admin custom claims
  await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: "admin" });
  console.log("[Firebase] Custom claims set: { role: admin }");

  // 3. Upsert user in database
  const dbUser = await prisma.user.upsert({
    where: { firebaseUid: firebaseUser.uid },
    update: {
      role: "admin",
      email: ADMIN_EMAIL,
      displayName: ADMIN_DISPLAY_NAME,
      emailVerified: true,
    },
    create: {
      firebaseUid: firebaseUser.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_DISPLAY_NAME,
      role: "admin",
      emailVerified: true,
    },
  });
  console.log(`[Database] User upserted: ${dbUser.id} (role: ${dbUser.role})`);

  console.log("\nAdmin account ready!");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role:     admin`);
  console.log(`  DB ID:    ${dbUser.id}`);
  console.log(`  Firebase: ${firebaseUser.uid}\n`);
}

seedAdmin()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
