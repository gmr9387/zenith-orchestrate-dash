import nodemailer from 'nodemailer';
import { logger } from './logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Create transporter
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For development
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      // Don't throw error - service can work without email in development
    }
  }

  // Send email with template
  async sendEmail(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      const {
        to,
        subject,
        template,
        context = {},
        attachments = [],
        from = process.env.EMAIL_FROM || 'noreply@zilliance.com',
      } = options;

      // Generate email content based on template
      const { html, text } = this.generateEmailContent(template, context);

      const mailOptions = {
        from,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  // Generate email content based on template
  generateEmailContent(template, context) {
    switch (template) {
      case 'email-verification':
        return this.generateVerificationEmail(context);
      case 'password-reset':
        return this.generatePasswordResetEmail(context);
      case 'password-changed':
        return this.generatePasswordChangedEmail(context);
      case 'welcome':
        return this.generateWelcomeEmail(context);
      case 'tutorial-published':
        return this.generateTutorialPublishedEmail(context);
      case 'tutorial-completed':
        return this.generateTutorialCompletedEmail(context);
      case 'subscription-updated':
        return this.generateSubscriptionUpdatedEmail(context);
      case 'support-request':
        return this.generateSupportRequestEmail(context);
      default:
        return this.generateDefaultEmail(context);
    }
  }

  // Email verification template
  generateVerificationEmail(context) {
    const { firstName, verificationUrl, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Zilliance!</h1>
            <p>Your Enterprise Business Automation Platform</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for joining Zilliance! To get started, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with Zilliance, you can safely ignore this email.</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Zilliance!
      
      Hi ${firstName},
      
      Thank you for joining Zilliance! To get started, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours for security reasons.
      
      If you didn't create an account with Zilliance, you can safely ignore this email.
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Password reset template
  generatePasswordResetEmail(context) {
    const { firstName, resetUrl, expiryTime, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>Zilliance Account Security</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password for your Zilliance account. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>This link will expire in ${expiryTime} for security reasons.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>For security, this password reset link can only be used once.</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - Zilliance
      
      Hi ${firstName},
      
      We received a request to reset your password for your Zilliance account. Visit this link to create a new password:
      
      ${resetUrl}
      
      This link will expire in ${expiryTime} for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      
      For security, this password reset link can only be used once.
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Password changed confirmation template
  generatePasswordChangedEmail(context) {
    const { firstName, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
            <p>Zilliance Account Security</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your Zilliance account password has been changed successfully.</p>
            <p>If you made this change, you don't need to do anything else.</p>
            <p>If you didn't change your password, please contact our support team immediately as your account may have been compromised.</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Changed Successfully - Zilliance
      
      Hi ${firstName},
      
      Your Zilliance account password has been changed successfully.
      
      If you made this change, you don't need to do anything else.
      
      If you didn't change your password, please contact our support team immediately as your account may have been compromised.
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Welcome email template
  generateWelcomeEmail(context) {
    const { firstName, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Zilliance!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Zilliance!</h1>
            <p>Your Enterprise Business Automation Platform</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Welcome to Zilliance! We're excited to have you on board.</p>
            <p>With Zilliance, you can:</p>
            <ul>
              <li>Create interactive tutorials and step-by-step guides</li>
              <li>Automate business processes and workflows</li>
              <li>Collaborate with your team in real-time</li>
              <li>Track progress and analytics</li>
              <li>Integrate with your existing tools and systems</li>
            </ul>
            <p>Ready to get started? Log in to your account and explore the platform!</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Zilliance!
      
      Hi ${firstName},
      
      Welcome to Zilliance! We're excited to have you on board.
      
      With Zilliance, you can:
      - Create interactive tutorials and step-by-step guides
      - Automate business processes and workflows
      - Collaborate with your team in real-time
      - Track progress and analytics
      - Integrate with your existing tools and systems
      
      Ready to get started? Log in to your account and explore the platform!
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Tutorial published notification template
  generateTutorialPublishedEmail(context) {
    const { firstName, tutorialTitle, tutorialUrl, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tutorial Published - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tutorial Published Successfully!</h1>
            <p>Your content is now live on Zilliance</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Great news! Your tutorial "<strong>${tutorialTitle}</strong>" has been published successfully and is now available to users.</p>
            <p>You can view your published tutorial by clicking the button below:</p>
            <a href="${tutorialUrl}" class="button">View Tutorial</a>
            <p>Your tutorial will now appear in search results and can be discovered by users looking for content in your category.</p>
            <p>Keep an eye on your analytics dashboard to track how your tutorial is performing!</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Tutorial Published Successfully! - Zilliance
      
      Hi ${firstName},
      
      Great news! Your tutorial "${tutorialTitle}" has been published successfully and is now available to users.
      
      You can view your published tutorial at: ${tutorialUrl}
      
      Your tutorial will now appear in search results and can be discovered by users looking for content in your category.
      
      Keep an eye on your analytics dashboard to track how your tutorial is performing!
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Tutorial completed notification template
  generateTutorialCompletedEmail(context) {
    const { firstName, tutorialTitle, completionDate, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tutorial Completed - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Tutorial Completed!</h1>
            <p>Congratulations on finishing "${tutorialTitle}"</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Congratulations! You've successfully completed the tutorial "<strong>${tutorialTitle}</strong>" on ${completionDate}.</p>
            <p>You're making great progress in your learning journey. Keep up the excellent work!</p>
            <p>Ready for your next challenge? Explore more tutorials in our library to continue building your skills.</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      🎉 Tutorial Completed! - Zilliance
      
      Hi ${firstName},
      
      Congratulations! You've successfully completed the tutorial "${tutorialTitle}" on ${completionDate}.
      
      You're making great progress in your learning journey. Keep up the excellent work!
      
      Ready for your next challenge? Explore more tutorials in our library to continue building your skills.
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Subscription updated notification template
  generateSubscriptionUpdatedEmail(context) {
    const { firstName, planName, status, nextBillingDate, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Updated - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Updated</h1>
            <p>Your Zilliance subscription has been modified</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your Zilliance subscription has been updated:</p>
            <ul>
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Status:</strong> ${status}</li>
              ${nextBillingDate ? `<li><strong>Next Billing Date:</strong> ${nextBillingDate}</li>` : ''}
            </ul>
            <p>If you have any questions about your subscription, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Subscription Updated - Zilliance
      
      Hi ${firstName},
      
      Your Zilliance subscription has been updated:
      
      Plan: ${planName}
      Status: ${status}
      ${nextBillingDate ? `Next Billing Date: ${nextBillingDate}` : ''}
      
      If you have any questions about your subscription, please don't hesitate to contact our support team.
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Support request notification template
  generateSupportRequestEmail(context) {
    const { firstName, ticketId, subject, message, supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request Received - Zilliance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Request Received</h1>
            <p>We're here to help you</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for contacting Zilliance support. We've received your request and will get back to you as soon as possible.</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <p>Our support team typically responds within 24 hours during business days. We'll keep you updated on the progress of your request.</p>
            <p>Best regards,<br>The Zilliance Support Team</p>
          </div>
          <div class="footer">
            <p>Need immediate assistance? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Support Request Received - Zilliance
      
      Hi ${firstName},
      
      Thank you for contacting Zilliance support. We've received your request and will get back to you as soon as possible.
      
      Ticket ID: ${ticketId}
      Subject: ${subject}
      Message: ${message}
      
      Our support team typically responds within 24 hours during business days. We'll keep you updated on the progress of your request.
      
      Best regards,
      The Zilliance Support Team
      
      Need immediate assistance? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Default email template
  generateDefaultEmail(context) {
    const { subject = 'Zilliance Notification', message = '', supportEmail } = context;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
            <p>Zilliance Platform</p>
          </div>
          <div class="content">
            ${message}
            <p>Best regards,<br>The Zilliance Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Zilliance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject} - Zilliance
      
      ${message}
      
      Best regards,
      The Zilliance Team
      
      Need help? Contact us at ${supportEmail}
    `;

    return { html, text };
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpSecure: process.env.SMTP_SECURE === 'true',
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export convenience function
export const sendEmail = (options) => emailService.sendEmail(options);

export default emailService;