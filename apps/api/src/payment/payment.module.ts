import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PayOSService } from "./payos.service";
import { SubscriptionService } from "./subscription.service";

@Module({
  controllers: [PaymentController],
  providers: [PayOSService, SubscriptionService],
  exports: [SubscriptionService],
})
export class PaymentModule {}
