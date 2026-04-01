import { AlertType } from '@prisma/client';

export class CreateAlertDto {
  userId!: string;
  type!: AlertType;
  message!: string;
}
