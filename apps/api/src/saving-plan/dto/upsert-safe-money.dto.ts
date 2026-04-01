import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SafeMoneyMode } from '@prisma/client';

export class UpsertSafeMoneyDto {
  @ApiProperty({ enum: SafeMoneyMode, description: 'Safe money alert mode' })
  @IsEnum(SafeMoneyMode)
  mode!: SafeMoneyMode;

  @ApiPropertyOptional({
    example: 50,
    description: 'Sensitivity level for advanced mode (0–100)',
    minimum: 0,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sensitivity?: number;

  @ApiPropertyOptional({
    example: 300000,
    description: 'Custom threshold in VND. If omitted, auto-calculated from mode.',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number;
}
