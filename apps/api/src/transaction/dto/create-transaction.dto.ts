import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 'clxxxxxxxxxx' })
  @IsString()
  walletId!: string;

  @ApiProperty({ example: 50000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 'clxxxxxxxxxx' })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'Cà phê sáng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  date!: string;
}
