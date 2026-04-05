import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { AlertType } from "@prisma/client";

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(AlertType)
  type!: AlertType;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
