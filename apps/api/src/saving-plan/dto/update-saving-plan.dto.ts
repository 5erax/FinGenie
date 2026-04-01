import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSavingPlanDto {
  @ApiPropertyOptional({ example: 12000000, description: 'Monthly income in VND', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 3500000, description: 'Fixed expenses per month in VND', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedExpenses?: number;

  @ApiPropertyOptional({ example: 2000000, description: 'Variable expenses per month in VND', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  variableExpenses?: number;

  @ApiPropertyOptional({ example: 25, description: 'Saving percentage (0–100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  savingPercent?: number;
}
