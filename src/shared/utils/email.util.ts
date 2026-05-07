import nodemailer from 'nodemailer';
import env from '@/config/env.config';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export const emailTemplates = {
  welcome: (name: string): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Ecommerce Store!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>Start exploring our products and enjoy shopping.</p>
      <br/>
      <p>Best regards,<br/>Ecommerce Store Team</p>
    </div>
  `,

  verifyEmail: (name: string, link: string): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${link}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
  `,

  resetPassword: (name: string, link: string): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${link}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `,

  orderConfirmation: (name: string, orderId: string, total: number): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Confirmed! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
      <p><strong>Total:</strong> $${total.toFixed(2)}</p>
      <p>We'll notify you when your order ships.</p>
      <br/>
      <p>Thank you for shopping with us!</p>
    </div>
  `,

  lowStockAlert: (productName: string, currentStock: number): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E53E3E;">⚠️ Low Stock Alert</h2>
      <p>Product <strong>${productName}</strong> is running low on stock.</p>
      <p><strong>Current stock:</strong> ${currentStock} units</p>
      <p>Please restock this product as soon as possible.</p>
    </div>
  `,
};

export default transporter;
