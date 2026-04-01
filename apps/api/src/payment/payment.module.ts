import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PayosService } from './payos.service';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [PaymentController],
  providers: [PayosService, SubscriptionService],
  exports: [SubscriptionService],
})
export class PaymentModule {}
