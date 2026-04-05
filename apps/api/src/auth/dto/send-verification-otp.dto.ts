import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SendVerificationOtpDto {
  @ApiProperty({
    description: "Firebase ID token of the authenticated user",
    example: "eyJhbGciOiJSUzI1NiIs...",
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
