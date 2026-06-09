import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'guiespuletacm@gmail.com',
        pass: process.env.SMTP_PASS || 'miqh rcxw kclo lgyr',
      },
    });
  }

  async sendResetCode(email: string, code: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"INFOSEG CORE" <${process.env.SMTP_USER || 'guiespuletacm@gmail.com'}>`,
        to: email,
        subject: 'Código de recuperação de senha — INFOSEG CORE',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background: #16A34A; color: white; width: 50px; height: 50px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">🛡</div>
              <h2 style="margin: 10px 0 0; color: #111;">INFOSEG CORE</h2>
              <p style="color: #666; font-size: 14px;">Portaria Remota</p>
            </div>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="color: #333; margin-bottom: 15px;">Seu código de recuperação de senha:</p>
              <div style="background: #16A34A; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px;">
                ${code}
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 15px;">
                Este código expira em <strong>10 minutos</strong>.<br>
                Se você não solicitou, ignore este e-mail.
              </p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Reset code sent to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      return false;
    }
  }
}
