/**
 * FinSight — Express Application Setup
 *
 * Configures middleware stack, routes, and error handling.
 */
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./middleware/cors.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware";
import { router, API_PREFIX } from "./routes";
import logger from "./utils/logger";

const app = express();

// --------------- Security & Parsing Middleware ---------------
app.use(helmet());
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --------------- Request Logging ---------------
app.use(
  morgan("short", {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
  })
);

// --------------- Global Rate Limiter ---------------
app.use(API_PREFIX, apiLimiter);

// --------------- API Routes ---------------
app.use(API_PREFIX, router);

// --------------- Error Handling ---------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
