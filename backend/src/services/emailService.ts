import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { EmailConfig, EmailTemplate } from "../types/notification";
import logger from "../config/logger";
import { env } from "../config/env";
import { supabase } from "../config/database";

class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();
  private isReady: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private async initialize(): Promise<void> {
    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: parseInt(env.EMAIL_PORT),
        secure: env.EMAIL_SECURE === "true",
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: env.NODE_ENV === "production",
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.isReady = true;
      logger.info("Email service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize email service", { error });
      this.isReady = false;

      // Retry initialization after delay if we're in production
      if (env.NODE_ENV === "production") {
        setTimeout(() => this.initialize(), 60000); // Retry after 1 minute
      }
    }
  }

  /**
   * Get email template from database or cache
   * @param templateName Template name to retrieve
   */
  private async getTemplate(templateName: string): Promise<EmailTemplate> {
    try {
      // Get template from database
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("name", templateName)
        .eq("is_active", true)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          `Email template '${templateName}' not found or not active`
        );
      }

      return data as EmailTemplate;
    } catch (error) {
      logger.error(`Failed to retrieve email template: ${templateName}`, {
        error,
      });

      // Fallback to file-based template if database failed
      try {
        const templatePath = path.join(
          __dirname,
          "../../templates/email",
          `${templateName}.hbs`
        );
        const templateContent = await fs.readFile(templatePath, "utf8");

        return {
          id: "fallback",
          name: templateName,
          subject: `${
            templateName.charAt(0).toUpperCase() +
            templateName.slice(1).replace(/_/g, " ")
          }`,
          body: templateContent,
          placeholders: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (fallbackError) {
        throw new Error(
          `Failed to retrieve email template from both database and file system: ${templateName}`
        );
      }
    }
  }

  /**
   * Compile template with Handlebars
   * @param template Template string
   * @param context Template variables
   */
  private compileTemplate(
    template: string,
    context: Record<string, any>
  ): string {
    try {
      // Check if template is already compiled and cached
      if (!this.templateCache.has(template)) {
        this.templateCache.set(template, handlebars.compile(template));
      }

      // Compile template with context
      const compiledTemplate = this.templateCache.get(template)!;
      return compiledTemplate(context);
    } catch (error) {
      logger.error("Failed to compile email template", { error });
      throw new Error("Failed to compile email template");
    }
  }

  /**
   * Send email using template
   * @param config Email configuration
   */
  public async sendEmail(config: EmailConfig): Promise<void> {
    try {
      if (!this.isReady) {
        logger.warn("Email service not ready, retrying initialization");
        await this.initialize();

        if (!this.isReady) {
          throw new Error("Email service not available");
        }
      }

      // Get template
      const template = await this.getTemplate(config.template);

      // Compile template
      const htmlContent = this.compileTemplate(template.body, config.context);

      // Prepare email options
      const mailOptions: nodemailer.SendMailOptions = {
        from: env.EMAIL_FROM,
        to: config.to,
        subject: config.subject || template.subject,
        html: htmlContent,
        attachments: config.attachments,
        headers: {
          "X-Application-Name": "Gamifikasi CS",
        },
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: info.messageId,
        template: config.template,
        recipient: config.to,
      });

      // Log email sent to database for tracking
      await this.logEmailSent({
        recipient: config.to,
        template: config.template,
        subject: mailOptions.subject as string,
        message_id: info.messageId,
      });
    } catch (error) {
      logger.error("Failed to send email", {
        error,
        template: config.template,
        recipient: config.to,
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send notification email
   * @param userId User ID
   * @param type Notification type
   * @param context Email context
   */
  public async sendNotificationEmail(
    userId: string,
    type: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      // Get user email
      const { data: user, error } = await supabase
        .from("users")
        .select("email, username, display_name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check user email notification preferences
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("email_notifications")
        .eq("user_id", userId)
        .single();

      // Skip if user has disabled email notifications
      if (preferences && preferences.email_notifications === false) {
        logger.info("Email notification skipped (user preference)", {
          userId,
          type,
        });
        return;
      }

      // Map notification type to email template
      const templateMap: Record<string, string> = {
        achievement_unlock: "achievement_notification",
        level_up: "level_up_notification",
        challenge_complete: "challenge_complete",
        welcome: "welcome_email",
        system: "system_notification",
        admin: "admin_notification",
      };

      const template = templateMap[type] || "general_notification";

      // Add user info to context
      const enrichedContext = {
        ...context,
        username: user.username,
        displayName: user.display_name || user.username,
        currentYear: new Date().getFullYear(),
        appName: "Gamifikasi CS",
        webUrl: env.CLIENT_URL,
      };

      // Send email
      await this.sendEmail({
        to: user.email,
        template,
        context: enrichedContext,
      });
    } catch (error) {
      logger.error("Failed to send notification email", {
        error,
        userId,
        type,
      });
    }
  }

  /**
   * Send welcome email to newly registered user
   * @param userId User ID
   */
  public async sendWelcomeEmail(userId: string): Promise<void> {
    try {
      // Get user email
      const { data: user, error } = await supabase
        .from("users")
        .select("email, username, display_name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Send welcome email
      await this.sendEmail({
        to: user.email,
        template: "welcome_email",
        context: {
          username: user.username,
          displayName: user.display_name || user.username,
          webUrl: env.CLIENT_URL,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info("Welcome email sent", { userId, email: user.email });
    } catch (error) {
      logger.error("Failed to send welcome email", { error, userId });
    }
  }

  /**
   * Send password reset email
   * @param email User email
   * @param resetToken Reset token
   */
  public async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    try {
      // Get user by email
      const { data: user, error } = await supabase
        .from("users")
        .select("id, username, display_name")
        .eq("email", email)
        .single();

      if (error || !user) {
        throw new Error(`User not found with email: ${email}`);
      }

      // Create reset URL
      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

      // Send password reset email
      await this.sendEmail({
        to: email,
        template: "password_reset",
        context: {
          username: user.username,
          displayName: user.display_name || user.username,
          resetUrl,
          expiryHours: "1", // Token expires in 1 hour
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info("Password reset email sent", { userId: user.id, email });
    } catch (error) {
      logger.error("Failed to send password reset email", { error, email });
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Send verification email
   * @param userId User ID
   * @param verificationToken Verification token
   */
  public async sendVerificationEmail(
    userId: string,
    verificationToken: string
  ): Promise<void> {
    try {
      // Get user
      const { data: user, error } = await supabase
        .from("users")
        .select("email, username, display_name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Create verification URL
      const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      await this.sendEmail({
        to: user.email,
        template: "email_verification",
        context: {
          username: user.username,
          displayName: user.display_name || user.username,
          verificationUrl,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info("Verification email sent", { userId, email: user.email });
    } catch (error) {
      logger.error("Failed to send verification email", { error, userId });
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Log email sent to database
   * @param data Email log data
   */
  private async logEmailSent(data: {
    recipient: string;
    template: string;
    subject: string;
    message_id: string;
  }): Promise<void> {
    try {
      await supabase.from("email_logs").insert({
        recipient: data.recipient,
        template: data.template,
        subject: data.subject,
        message_id: data.message_id,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to log email sent", { error, data });
      // Non-critical error, don't throw
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
