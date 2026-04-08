import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PayOSService } from "./payos.service";
import { StripeService } from "./stripe.service";
import { SubscriptionService } from "./subscription.service";

@Module({
  controllers: [PaymentController],
  providers: [PayOSService, StripeService, SubscriptionService],
  exports: [SubscriptionService],
})
export class PaymentModule {}
