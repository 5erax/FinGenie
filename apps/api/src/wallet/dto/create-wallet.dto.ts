import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletType, Currency } from '@prisma/client';

export class CreateWalletDto {
  @ApiProperty({ example: 'Ví tiền mặt', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: WalletType, default: WalletType.cash })
  @IsOptional()
  @IsEnum(WalletType)
  type?: WalletType;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
