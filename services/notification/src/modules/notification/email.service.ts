import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as SendGrid from '@sendgrid/mail';
import { LoggerService } from '../../common/logger.service';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly useSendGrid: boolean;

  constructor(private readonly logger: LoggerService) {
    this.useSendGrid = !!process.env.SENDGRID_API_KEY;

    if (this.useSendGrid) {
      SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: parseInt(process.env.SMTP_PORT ?? '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER ?? 'apikey',
        pass: process.env.SMTP_PASS ?? '',
      },
    });
  }

  async send(payload: EmailPayload): Promise<boolean> {
    const from = process.env.EMAIL_FROM ?? 'noreply@nexapay.com';
    try {
      if (this.useSendGrid) {
        await SendGrid.send({ to: payload.to, from, subject: payload.subject, html: payload.html });
      } else {
        await this.transporter.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text });
      }
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`, EmailService.name);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`Failed to send email to ${payload.to}: ${message}`, undefined, EmailService.name);
      return false;
    }
  }
}
