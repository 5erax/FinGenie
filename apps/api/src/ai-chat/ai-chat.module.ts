import { Module } from "@nestjs/common";
import { AiChatController } from "./ai-chat.controller";
import { AiChatService } from "./ai-chat.service";
import { GeminiService } from "./gemini.service";
import { TransactionModule } from "../transaction";
import { SavingPlanModule } from "../saving-plan";
import { WalletModule } from "../wallet";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [
    TransactionModule,
    SavingPlanModule,
    WalletModule,
    GamificationModule,
  ],
  controllers: [AiChatController],
  providers: [AiChatService, GeminiService],
  exports: [AiChatService],
})
export class AiChatModule {}
