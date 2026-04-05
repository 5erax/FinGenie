// Stripe webhooks are verified via raw body + signature header.
// This DTO is kept minimal — the actual validation happens in StripeService.constructWebhookEvent().
// The controller receives the raw body, not a parsed DTO.

// This file exists for Swagger documentation and type reference only.
import { ApiProperty } from "@nestjs/swagger";

export class StripeWebhookDto {
  @ApiProperty({ description: "Stripe event ID" })
  id!: string;

  @ApiProperty({ description: "Event type (e.g. checkout.session.completed)" })
  type!: string;

  @ApiProperty({ description: "Event data object" })
  data!: { object: Record<string, unknown> };
}
