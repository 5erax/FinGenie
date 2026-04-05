import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyEmailOtpDto {
  @ApiProperty({
    description: "Firebase ID token of the authenticated user",
    example: "eyJhbGciOiJSUzI1NiIs...",
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({
    description: "6-digit OTP code from email",
    example: "123456",
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
