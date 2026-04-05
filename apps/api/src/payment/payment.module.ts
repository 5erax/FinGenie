import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { StripeService } from "./stripe.service";
import { SubscriptionService } from "./subscription.service";

@Module({
  controllers: [PaymentController],
  providers: [StripeService, SubscriptionService],
  exports: [SubscriptionService],
})
export class PaymentModule {}
