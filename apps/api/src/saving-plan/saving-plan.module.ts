import { Module } from '@nestjs/common';
import { SavingPlanService } from './saving-plan.service';
import { SavingPlanController } from './saving-plan.controller';

@Module({
  controllers: [SavingPlanController],
  providers: [SavingPlanService],
  exports: [SavingPlanService],
})
export class SavingPlanModule {}
