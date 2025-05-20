import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { env } from "./env";
import { supabase } from "./database";
import logger from "./logger";

// Interface untuk template email
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
  is_active: boolean;
}

// Interface untuk opsi email
export interface EmailOptions {
  to: string | string[];
  subject?: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }>;
}

// Buat transport Nodemailer
const createTransport = () => {
  // Gunakan ethereal untuk testing
  if (env.NODE_ENV === "development" && !env.EMAIL_HOST) {
    logger.info("Using Ethereal Email for testing");
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email", // gunakan akun ethereal yang valid
        pass: "ethereal_password", // gunakan password yang valid
      },
    });
  }

  // Gunakan konfigurasi SMTP dari environment
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
};

// Transporter email
const transporter = createTransport();

// Verify email transporter
transporter.verify((error) => {
  if (error) {
    logger.error("Email service error", { error });
  } else {
    logger.info("Email service is ready");
  }
});

// Function untuk menambahkan helper Handlebars
const registerHandlebarsHelpers = () => {
  // Format tanggal: {{formatDate date format="DD/MM/YYYY"}}
  handlebars.registerHelper("formatDate", function (date, options) {
    const format = options.hash.format || "YYYY-MM-DD";
    const dateObj = new Date(date);

    // Format sederhana, bisa diganti dengan day.js/moment.js
    const formatters: Record<string, (d: Date) => string> = {
      "YYYY-MM-DD": (d) => d.toISOString().split("T")[0],
      "DD/MM/YYYY": (d) =>
        `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${d.getFullYear()}`,
      "MMMM DD, YYYY": (d) =>
        d.toLocaleDateString("id-ID", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
    };

    return formatters[format]
      ? formatters[format](dateObj)
      : dateObj.toISOString();
  });

  // Conditional: {{#if_eq value1 value2}} ... {{/if_eq}}
  handlebars.registerHelper("if_eq", function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // Truncate text: {{truncate text limit=100}}
  handlebars.registerHelper("truncate", function (text, options) {
    const limit = options.hash.limit || 100;
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  });
};

// Panggil fungsi untuk mendaftarkan helper
registerHandlebarsHelpers();

/**
 * Mendapatkan template email dari database
 */
export const getTemplateFromDb = async (
  templateName: string
): Promise<EmailTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .eq("is_active", true)
      .single();

    if (error) {
      logger.error("Error fetching email template", { error, templateName });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Failed to get email template", { error, templateName });
    return null;
  }
};

/**
 * Mendapatkan template dari file
 */
export const getTemplateFromFile = async (
  templateName: string
): Promise<string | null> => {
  try {
    const templatePath = path.join(
      __dirname,
      `../templates/emails/${templateName}.hbs`
    );
    const template = await fs.readFile(templatePath, "utf8");
    return template;
  } catch (error) {
    logger.error("Failed to read template file", { error, templateName });
    return null;
  }
};

/**
 * Kompilasi template dengan Handlebars
 */
export const compileTemplate = (
  template: string,
  context: Record<string, any>
): string => {
  try {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(context);
  } catch (error) {
    logger.error("Failed to compile template", { error });
    throw new Error("Template compilation failed");
  }
};

/**
 * Mengirim email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    let finalOptions: nodemailer.SendMailOptions = {
      from:
        options.from ||
        `"${env.APP_NAME || "Gamification CS"}" <${env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      attachments: options.attachments,
    };

    // Jika template name disediakan, ambil dari database
    if (options.template) {
      const dbTemplate = await getTemplateFromDb(options.template);

      if (dbTemplate) {
        // Gunakan template dari database
        finalOptions.subject = dbTemplate.subject;
        const htmlContent = compileTemplate(
          dbTemplate.body,
          options.context || {}
        );
        finalOptions.html = htmlContent;
      } else {
        // Fallback ke template file
        const fileTemplate = await getTemplateFromFile(options.template);

        if (!fileTemplate) {
          throw new Error(`Template not found: ${options.template}`);
        }

        const htmlContent = compileTemplate(
          fileTemplate,
          options.context || {}
        );
        finalOptions.html = htmlContent;
        finalOptions.subject = options.subject;
      }
    } else if (options.html) {
      // Gunakan HTML yang diberikan langsung
      finalOptions.html = options.html;
    } else if (options.text) {
      // Gunakan plain text
      finalOptions.text = options.text;
    } else {
      throw new Error("Email content not provided");
    }

    // Kirim email
    const info = await transporter.sendMail(finalOptions);

    logger.info("Email sent successfully", {
      messageId: info.messageId,
      to: finalOptions.to,
      subject: finalOptions.subject,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send email", {
      error,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

/**
 * Contoh penggunaan:
 *
 * // Kirim email dengan template dari database
 * sendEmail({
 *   to: 'user@example.com',
 *   template: 'welcome',
 *   context: {
 *     name: 'John Doe',
 *     login_url: 'https://example.com/login'
 *   }
 * });
 *
 * // Kirim email dengan content HTML langsung
 * sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello World',
 *   html: '<h1>Hello</h1><p>This is a test email</p>'
 * });
 */

export default {
  sendEmail,
  getTemplateFromDb,
  getTemplateFromFile,
  compileTemplate,
};
