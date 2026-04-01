import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { GeminiService } from './gemini.service';
import { TransactionModule } from '../transaction';
import { SavingPlanModule } from '../saving-plan';
import { WalletModule } from '../wallet';

@Module({
  imports: [TransactionModule, SavingPlanModule, WalletModule],
  controllers: [AiChatController],
  providers: [AiChatService, GeminiService],
  exports: [AiChatService],
})
export class AiChatModule {}
