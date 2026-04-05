import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import { EmailService } from "../email/email.service";
import type { User } from "@prisma/client";
import * as crypto from "crypto";

/** OTP validity in minutes */
const OTP_EXPIRY_MINUTES = 10;
/** Max OTP send attempts per hour */
const MAX_OTP_PER_HOUR = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseAdminService,
    private readonly email: EmailService,
  ) {}

  /**
   * Verify Firebase ID token and find-or-create user in database.
   * Called when client sends Firebase token after Google/Phone OTP/Email auth.
   */
  async loginWithFirebase(
    idToken: string,
  ): Promise<{ user: User; isNewUser: boolean; emailVerified: boolean }> {
    const decoded = await this.firebase.verifyIdToken(idToken).catch((err) => {
      this.logger.warn(`Firebase token verification failed: ${err.message}`);
      throw new UnauthorizedException("Invalid Firebase token");
    });

    const {
      uid,
      email,
      phone_number: phone,
      name,
      picture,
      email_verified,
    } = decoded;
    const firebaseEmailVerified = email_verified ?? false;

    // Try to find existing user
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (user) {
      // Update last known info from Firebase
      // Sync emailVerified from Firebase if it becomes true
      const updates: Record<string, unknown> = {};
      if (email && !user.email) updates.email = email;
      if (phone && !user.phone) updates.phone = phone;
      if (picture && !user.avatarUrl) updates.avatarUrl = picture;
      if (firebaseEmailVerified && !user.emailVerified)
        updates.emailVerified = true;

      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }

      this.logger.log(`User logged in: ${user.id} (${user.displayName})`);
      return {
        user,
        isNewUser: false,
        emailVerified: user.emailVerified || firebaseEmailVerified,
      };
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        firebaseUid: uid,
        email: email || null,
        phone: phone || null,
        displayName: name || email?.split("@")[0] || phone || "User",
        avatarUrl: picture || null,
        emailVerified: firebaseEmailVerified,
      },
    });

    this.logger.log(`New user created: ${user.id} (${user.displayName})`);
    return {
      user,
      isNewUser: true,
      emailVerified: user.emailVerified || firebaseEmailVerified,
    };
  }

  /**
   * Generate and send a 6-digit OTP to the user's email.
   */
  async sendVerificationOtp(idToken: string): Promise<{ message: string }> {
    const decoded = await this.firebase.verifyIdToken(idToken).catch((err) => {
      this.logger.warn(`Token verification failed: ${err.message}`);
      throw new UnauthorizedException("Invalid Firebase token");
    });

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email already verified");
    }

    if (!user.email) {
      throw new BadRequestException("No email associated with this account");
    }

    // Rate limit: max N OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.emailVerification.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= MAX_OTP_PER_HOUR) {
      throw new BadRequestException("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        code,
        expiresAt,
      },
    });

    // Send email
    await this.email.sendVerificationOtp(user.email, code);

    this.logger.log(`Verification OTP sent to ${user.email}`);
    return { message: "OTP sent successfully" };
  }

  /**
   * Verify OTP code and mark email as verified.
   */
  async verifyEmailOtp(
    idToken: string,
    code: string,
  ): Promise<{ verified: boolean; user: User }> {
    const decoded = await this.firebase.verifyIdToken(idToken).catch((err) => {
      this.logger.warn(`Token verification failed: ${err.message}`);
      throw new UnauthorizedException("Invalid Firebase token");
    });

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.emailVerified) {
      return { verified: true, user };
    }

    if (!user.email) {
      throw new BadRequestException("No email associated with this account");
    }

    // Find valid OTP
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    // Mark OTP as used
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true, usedAt: new Date() },
    });

    // Mark user as email verified in database
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Also mark as verified in Firebase
    try {
      await this.firebase.updateUser(decoded.uid, { emailVerified: true });
    } catch (err) {
      this.logger.warn(`Failed to update Firebase emailVerified: ${err}`);
      // Non-critical: DB is source of truth
    }

    this.logger.log(`Email verified for user ${user.id} (${user.email})`);
    return { verified: true, user: updatedUser };
  }

  async getUserByFirebaseUid(uid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });
  }
}
