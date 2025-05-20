import swaggerJsdoc from "swagger-jsdoc";
import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { version } from "../../package.json";
import { env } from "../config/env";

// Basic configuration for Swagger
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gamification Computer Science API Documentation",
      version,
      description:
        "API documentation for the Gamification CS Learning Platform",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Gamification CS Support",
        url: "https://gamification-cs.com",
        email: "support@gamification-cs.com",
      },
    },
    servers: [
      {
        url:
          env.NODE_ENV === "production"
            ? "https://api.gamification-cs.com"
            : `http://localhost:${env.PORT}`,
        description:
          env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        csrfToken: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Status keberhasilan request",
            },
            message: {
              type: "string",
              description: "Pesan descriptif tentang hasil request",
            },
            data: {
              type: "object",
              description: "Data yang dikembalikan (jika ada)",
              nullable: true,
            },
            errors: {
              type: "object",
              description: "Error details (jika ada)",
              nullable: true,
            },
          },
          required: ["success", "message"],
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID User",
            },
            username: {
              type: "string",
              description: "Username",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email",
            },
            role: {
              type: "string",
              enum: ["admin", "student", "teacher"],
              description: "Role user",
            },
            avatar_url: {
              type: "string",
              nullable: true,
              description: "URL avatar",
            },
            display_name: {
              type: "string",
              nullable: true,
              description: "Nama display",
            },
            bio: {
              type: "string",
              nullable: true,
              description: "Bio user",
            },
            verified: {
              type: "boolean",
              description: "Status verifikasi email",
            },
            login_streak: {
              type: "integer",
              description: "Jumlah hari login berturut-turut",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Waktu pembuatan akun",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Waktu terakhir update",
            },
          },
          required: ["id", "username", "email", "role", "verified"],
        },
        // Tambahkan definisi schema untuk entity lainnya
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Autentikasi dan manajemen sesi",
      },
      {
        name: "Users",
        description: "Manajemen user",
      },
      {
        name: "Game",
        description: "Game state dan progress",
      },
      {
        name: "Challenges",
        description: "Tantangan dan evaluasi kode",
      },
      {
        name: "Quiz",
        description: "Kuis dan pertanyaan",
      },
      {
        name: "Study",
        description: "Materi pembelajaran",
      },
      {
        name: "Admin",
        description: "Operasi khusus admin",
      },
      {
        name: "Notifications",
        description: "Manajemen notifikasi",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/docs/routes/*.yaml"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

/**
 * Function to setup Swagger UI
 */
export const setupSwagger = (app: Express) => {
  // Serve swagger docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Gamification CS API Documentation",
    })
  );

  // Serve swagger spec as JSON for tools that consume it
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger documentation available at /api-docs`);
};

export default swaggerSpec;
