import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SendVerificationOtpDto } from "./dto/send-verification-otp.dto";
import { VerifyEmailOtpDto } from "./dto/verify-email-otp.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login with Firebase ID token",
    description:
      "Verify Firebase ID token (from Google Sign-In or Phone OTP) and return user data. Creates user on first login.",
  })
  @ApiOkResponse({
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            displayName: { type: "string" },
            avatarUrl: { type: "string", nullable: true },
            role: { type: "string", enum: ["user", "admin"] },
          },
        },
        isNewUser: { type: "boolean" },
        emailVerified: { type: "boolean" },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Invalid Firebase token" })
  async login(@Body() dto: LoginDto) {
    const { user, isNewUser, emailVerified } =
      await this.authService.loginWithFirebase(dto.idToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        premiumUntil: user.premiumUntil,
      },
      isNewUser,
      emailVerified,
    };
  }

  @Post("send-verification-otp")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send email verification OTP",
    description:
      "Generate and send a 6-digit OTP to the user's email for verification.",
  })
  @ApiOkResponse({ description: "OTP sent successfully" })
  @ApiUnauthorizedResponse({ description: "Invalid Firebase token" })
  @ApiBadRequestResponse({
    description: "User not found, email already verified, or rate limited",
  })
  async sendVerificationOtp(@Body() dto: SendVerificationOtpDto) {
    return this.authService.sendVerificationOtp(dto.idToken);
  }

  @Post("verify-email-otp")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify email with OTP code",
    description:
      "Verify the 6-digit OTP code to mark the user's email as verified.",
  })
  @ApiOkResponse({
    description: "Email verified successfully",
    schema: {
      type: "object",
      properties: {
        verified: { type: "boolean" },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Invalid Firebase token" })
  @ApiBadRequestResponse({ description: "Invalid or expired OTP" })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    const { verified, user } = await this.authService.verifyEmailOtp(
      dto.idToken,
      dto.code,
    );

    return {
      verified,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        premiumUntil: user.premiumUntil,
      },
      emailVerified: verified,
    };
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiOkResponse({ description: "Current user data" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  async getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      premiumUntil: user.premiumUntil,
      createdAt: user.createdAt,
    };
  }
}
