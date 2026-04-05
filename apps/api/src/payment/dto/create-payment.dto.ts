import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentDto {
  @ApiProperty({
    enum: ["monthly", "yearly"],
    description: "Subscription plan to purchase",
  })
  @IsEnum({ monthly: "monthly", yearly: "yearly" } as const)
  plan!: "monthly" | "yearly";

  @ApiPropertyOptional({
    description: "Return URL after payment (for mobile deep-link)",
    example: "fingenie://payment/success",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  returnUrl?: string;

  @ApiPropertyOptional({
    description: "Cancel URL (for mobile deep-link)",
    example: "fingenie://payment/cancel",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelUrl?: string;
}
