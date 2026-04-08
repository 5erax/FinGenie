import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import * as nodemailer from "nodemailer";

type EmailTransport = "resend" | "smtp" | "none";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly smtpTransporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly transport: EmailTransport;

  constructor(private readonly config: ConfigService) {
    // Priority 1: Resend (modern, recommended)
    const resendKey = this.config.get<string>("RESEND_API_KEY");
    // Priority 2: SMTP (Gmail app password fallback)
    const smtpHost = this.config.get<string>("SMTP_HOST");
    const smtpUser = this.config.get<string>("SMTP_USER");
    const smtpPass = this.config.get<string>("SMTP_PASS");

    if (resendKey) {
      this.resend = new Resend(resendKey);
      this.from = this.config.get<string>(
        "RESEND_FROM",
        "FinGenie <onboarding@resend.dev>",
      );
      this.transport = "resend";
      this.logger.log(`Email via Resend: from=${this.from}`);
    } else if (smtpHost && smtpUser && smtpPass) {
      const smtpPort = this.config.get<number>("SMTP_PORT", 587);
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.from = `FinGenie <${smtpUser}>`;
      this.transport = "smtp";
      this.logger.log(
        `Email via SMTP: ${smtpHost}:${smtpPort} from=${this.from}`,
      );
    } else {
      this.from = "";
      this.transport = "none";
      this.logger.warn(
        "No email transport configured — set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS",
      );
    }
  }

  /**
   * Check email service connectivity and configuration status.
   */
  async checkHealth(): Promise<{
    configured: boolean;
    connected: boolean;
    transport: EmailTransport;
    error?: string;
  }> {
    if (this.transport === "none") {
      return {
        configured: false,
        connected: false,
        transport: "none",
        error: "No email transport configured",
      };
    }

    try {
      if (this.transport === "resend" && this.resend) {
        await this.resend.domains.list();
      } else if (this.transport === "smtp" && this.smtpTransporter) {
        // SMTP verify can hang on some cloud platforms (blocked port 587)
        // Use a 5-second timeout to prevent request hanging
        await Promise.race([
          this.smtpTransporter.verify(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("SMTP verify timeout (5s)")),
              5000,
            ),
          ),
        ]);
      }
      return { configured: true, connected: true, transport: this.transport };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Email health check failed (${this.transport}): ${message}`,
      );
      return {
        configured: true,
        connected: false,
        transport: this.transport,
        error: message,
      };
    }
  }

  async sendVerificationOtp(email: string, code: string): Promise<void> {
    if (this.transport === "none") {
      throw new Error(
        "Email service unavailable: configure RESEND_API_KEY or SMTP credentials",
      );
    }

    const html = this.buildOtpHtml(code);

    try {
      if (this.transport === "resend" && this.resend) {
        const { error } = await this.resend.emails.send({
          from: this.from,
          to: [email],
          subject: "Mã xác thực email - FinGenie",
          html,
        });
        if (error) throw new Error(error.message);
      } else if (this.transport === "smtp" && this.smtpTransporter) {
        await this.smtpTransporter.sendMail({
          from: this.from,
          to: email,
          subject: "Mã xác thực email - FinGenie",
          html,
        });
      }

      this.logger.log(
        `Verification OTP sent to ${email} via ${this.transport}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send OTP to ${email} via ${this.transport}: ${message}`,
      );
      throw new Error(`Email sending failed: ${message}`);
    }
  }

  private buildOtpHtml(code: string): string {
    return `
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
    `;
  }
}
