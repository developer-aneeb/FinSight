/**
 * FinSight — Environment Configuration
 * Loads .env and exports typed config constants
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  // ElasticSearch
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    apiKey: process.env.ELASTICSEARCH_API_KEY || "",
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "FinSight <noreply@finsight.pk>",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",
} as const;

export default config;
