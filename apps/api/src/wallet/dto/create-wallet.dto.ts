import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WalletType, Currency } from "@prisma/client";

export class CreateWalletDto {
  @ApiProperty({ example: "Ví tiền mặt", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: WalletType, default: WalletType.cash })
  @IsOptional()
  @IsEnum(WalletType)
  type?: WalletType;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: "Initial balance",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
