import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.from = this.config.get<string>(
      "RESEND_FROM",
      "FinGenie <onboarding@resend.dev>",
    );

    this.configured = Boolean(apiKey);

    if (!this.configured) {
      this.logger.warn(
        "RESEND_API_KEY not configured — email sending will be unavailable",
      );
      this.resend = null;
    } else {
      this.logger.log(`Resend configured: from=${this.from}`);
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Check Resend API connectivity and configuration status.
   */
  async checkHealth(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
  }> {
    if (!this.configured || !this.resend) {
      return {
        configured: false,
        connected: false,
        error: "RESEND_API_KEY not set in environment variables",
      };
    }

    try {
      // Verify connectivity by listing domains (lightweight API call)
      await this.resend.domains.list();
      return { configured: true, connected: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Resend health check failed: ${message}`);
      return { configured: true, connected: false, error: message };
    }
  }

  async sendVerificationOtp(email: string, code: string): Promise<void> {
    if (!this.configured || !this.resend) {
      throw new Error(
        "Email service unavailable: RESEND_API_KEY not configured on server",
      );
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [email],
        subject: "Mã xác thực email - FinGenie",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">💰</span>
              <h1 style="color: #1a1a2e; margin: 8px 0 0;">FinGenie</h1>
            </div>
            <div style="background: white; border-radius: 12px; padding: 24px; text-align: center;">
              <h2 style="color: #333; margin: 0 0 8px;">Mã xác thực email</h2>
              <p style="color: #666; margin: 0 0 24px;">Nhập mã bên dưới vào ứng dụng để xác thực email của bạn:</p>
              <div style="background: #f0f0f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
              </div>
              <p style="color: #999; font-size: 13px; margin: 0;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
              <p style="color: #999; font-size: 13px; margin: 4px 0 0;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Verification OTP sent to ${email}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send OTP to ${email}: ${message}`);
      throw new Error(`Email sending failed: ${message}`);
    }
  }
}
