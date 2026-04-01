import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseAdminService,
  ) {}

  /**
   * Verify Firebase ID token and find-or-create user in database.
   * Called when client sends Firebase token after Google/Phone OTP auth.
   */
  async loginWithFirebase(idToken: string): Promise<{ user: User; isNewUser: boolean }> {
    const decoded = await this.firebase.verifyIdToken(idToken).catch((err) => {
      this.logger.warn(`Firebase token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid Firebase token');
    });

    const { uid, email, phone_number: phone, name, picture } = decoded;

    // Try to find existing user
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (user) {
      // Update last known info from Firebase
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(email && !user.email ? { email } : {}),
          ...(phone && !user.phone ? { phone } : {}),
          ...(picture && !user.avatarUrl ? { avatarUrl: picture } : {}),
        },
      });

      this.logger.log(`User logged in: ${user.id} (${user.displayName})`);
      return { user, isNewUser: false };
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        firebaseUid: uid,
        email: email || null,
        phone: phone || null,
        displayName: name || email?.split('@')[0] || phone || 'User',
        avatarUrl: picture || null,
      },
    });

    this.logger.log(`New user created: ${user.id} (${user.displayName})`);
    return { user, isNewUser: true };
  }

  async getUserByFirebaseUid(uid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });
  }
}
