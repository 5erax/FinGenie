import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
      const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
      const privateKey = this.config
        .get<string>("FIREBASE_PRIVATE_KEY")
        ?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log("Firebase Admin initialized with service account");
      } else {
        // Fallback: use GOOGLE_APPLICATION_CREDENTIALS env var
        admin.initializeApp();
        this.logger.log("Firebase Admin initialized with default credentials");
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUser(uid);
  }

  async setCustomClaims(
    uid: string,
    claims: Record<string, unknown>,
  ): Promise<void> {
    await admin.auth().setCustomUserClaims(uid, claims);
  }

  async deleteUser(uid: string): Promise<void> {
    await admin.auth().deleteUser(uid);
  }
}
