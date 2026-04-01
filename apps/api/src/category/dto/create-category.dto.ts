import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cafe', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: '☕' })
  @IsString()
  @MaxLength(10)
  icon!: string;

  @ApiProperty({ example: '#8B5CF6' })
  @IsString()
  @MaxLength(20)
  color!: string;
}
