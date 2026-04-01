import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSavingPlanDto {
  @ApiProperty({ example: 10000000, description: 'Monthly income in VND', minimum: 0 })
  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @ApiProperty({ example: 3000000, description: 'Fixed expenses per month in VND', minimum: 0 })
  @IsNumber()
  @Min(0)
  fixedExpenses!: number;

  @ApiProperty({ example: 1500000, description: 'Variable expenses per month in VND', minimum: 0 })
  @IsNumber()
  @Min(0)
  variableExpenses!: number;

  @ApiProperty({ example: 20, description: 'Saving percentage (0–100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  savingPercent!: number;
}
