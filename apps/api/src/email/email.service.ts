import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST", "smtp.gmail.com");
    const port = this.config.get<number>("SMTP_PORT", 587);
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");

    if (!user || !pass) {
      this.logger.warn(
        "SMTP_USER or SMTP_PASS not configured — email sending will be unavailable",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
  }

  async sendVerificationOtp(email: string, code: string): Promise<void> {
    const from = this.config.get<string>(
      "SMTP_FROM",
      `"FinGenie" <${this.config.get<string>("SMTP_USER", "noreply@fingenie.vn")}>`,
    );

    await this.transporter.sendMail({
      from,
      to: email,
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

    this.logger.log(`Verification OTP sent to ${email}`);
  }
}
