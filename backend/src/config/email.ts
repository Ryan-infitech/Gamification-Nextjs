import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { env } from "./env";

/**
 * Email template data structure
 */
interface EmailTemplate {
  name: string;
  subject: string;
  template: string;
}

/**
 * Email options interface
 */
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Email service for sending emails with templates
 */
class EmailService {
  private transporter!: nodemailer.Transporter; // Added the definite assignment assertion (!)
  private templates: Map<string, EmailTemplate> = new Map();
  private templatesDir = path.resolve(__dirname, "../../templates/emails");

  /**
   * Initialize email service with configured transporter
   */
  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
    this.registerHelpers();
  }

  /**
   * Initialize nodemailer transporter with environment configuration
   */
  private initializeTransporter() {
    // Convert port string to number
    const emailPort = parseInt(env.EMAIL_PORT, 10);

    this.transporter = nodemailer.createTransport({
      // Use proper object structure for nodemailer
      service: "SMTP",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
      // Transport options
      host: env.EMAIL_HOST,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates in development
      },
    } as nodemailer.TransportOptions);
  }

  /**
   * Load email templates from filesystem or database
   */
  private async loadTemplates() {
    try {
      // Check if templates directory exists, create if not
      if (!fs.existsSync(this.templatesDir)) {
        fs.mkdirSync(this.templatesDir, { recursive: true });
        this.createDefaultTemplates();
      }

      // Load templates from filesystem
      const templateFiles = fs.readdirSync(this.templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith(".hbs")) {
          const templateName = file.replace(".hbs", "");
          const templatePath = path.join(this.templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, "utf8");

          this.templates.set(templateName, {
            name: templateName,
            subject: this.getSubjectFromTemplate(templateContent),
            template: templateContent,
          });
        }
      }
    } catch (error) {
      console.error("Error loading email templates:", error);
    }
  }

  /**
   * Register handlebars helpers
   */
  private registerHelpers() {
    // Helper for equality comparison
    handlebars.registerHelper(
      "if_eq",
      function (this: any, a: any, b: any, options: any) {
        return a === b ? options.fn(this) : options.inverse(this);
      }
    );

    // Helper for non-equality comparison
    handlebars.registerHelper(
      "if_not_eq",
      function (this: any, a: any, b: any, options: any) {
        return a !== b ? options.fn(this) : options.inverse(this);
      }
    );

    // Helper for dates
    handlebars.registerHelper("formatDate", function (date: Date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });
  }

  /**
   * Create default email templates if none exist
   */
  private createDefaultTemplates() {
    const templates = [
      {
        name: "welcome",
        fileName: "welcome.hbs",
        content: `
        <h1>Welcome to {{appName}}!</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for creating an account with us. We're excited to have you join our community!</p>
        <p>To get started, please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background-color: #4B7BEC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, please copy and paste this link into your browser:</p>
        <p>{{verificationUrl}}</p>
        <p>Best regards,</p>
        <p>The {{appName}} Team</p>
        `,
      },
      {
        name: "passwordReset",
        fileName: "passwordReset.hbs",
        content: `
        <h1>Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background-color: #4B7BEC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, please copy and paste this link into your browser:</p>
        <p>{{resetUrl}}</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,</p>
        <p>The {{appName}} Team</p>
        `,
      },
    ];

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    // Write each template file
    templates.forEach((template) => {
      const filePath = path.join(this.templatesDir, template.fileName);
      fs.writeFileSync(filePath, template.content);
    });
  }

  /**
   * Parse subject from template content (assumes first line has subject in format <!-- Subject: Your Subject -->)
   */
  private getSubjectFromTemplate(content: string): string {
    const subjectMatch = content.match(/<!--\\s*Subject:\\s*(.*?)\\s*-->/);
    return subjectMatch ? subjectMatch[1] : "Notification";
  }

  /**
   * Send email with template
   */
  public async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const { to, subject, template, context, attachments } = options;

      // Get template or use default
      const templateData = this.templates.get(template);

      if (!templateData) {
        throw new Error(`Email template "${template}" not found`);
      }

      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(templateData.template);
      const html = compiledTemplate(context);

      // Send email
      const mailOptions = {
        from: `"Gamification CS" <${env.EMAIL_FROM}>`,
        to,
        subject: subject || templateData.subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Verify SMTP connection
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email server connection verified");
      return true;
    } catch (error) {
      console.error("Email server connection failed:", error);
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
