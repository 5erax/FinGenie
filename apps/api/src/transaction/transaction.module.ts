import { Module } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { SavingPlanModule } from "../saving-plan/saving-plan.module";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [SavingPlanModule, GamificationModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
