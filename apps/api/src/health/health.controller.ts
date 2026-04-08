import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { EmailService } from "../email/email.service";

interface HealthResponse {
  status: "ok";
  timestamp: string;
}

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly email: EmailService) {}

  /**
   * Liveness probe – indicates the process is running and accepting traffic.
   * Used by load-balancers, container orchestrators (K8s/ECS), and uptime monitors.
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Liveness check",
    description: "Returns 200 when the API process is alive and ready.",
  })
  @ApiOkResponse({
    description: "Service is healthy",
    schema: {
      example: { status: "ok", timestamp: "2026-04-01T00:00:00.000Z" },
    },
  })
  check(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep health check – verifies Resend API connectivity for email sending.
   */
  @Get("email")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Email health check",
    description:
      "Verifies Resend API is configured and can connect to the email service.",
  })
  async checkEmail() {
    const email = await this.email.checkHealth();
    return {
      timestamp: new Date().toISOString(),
      email,
    };
  }
}
