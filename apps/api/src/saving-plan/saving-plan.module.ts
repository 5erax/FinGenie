import { Module } from "@nestjs/common";
import { SavingPlanService } from "./saving-plan.service";
import { SavingPlanController } from "./saving-plan.controller";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [GamificationModule],
  controllers: [SavingPlanController],
  providers: [SavingPlanService],
  exports: [SavingPlanService],
})
export class SavingPlanModule {}
