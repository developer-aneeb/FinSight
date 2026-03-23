/**
 * FinSight — Server Entry Point
 *
 * Starts the Express HTTP server.
 */
import app from "./app";
import config from "./config";
import logger from "./utils/logger";

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 FinSight API server running on port ${PORT}`);
  logger.info(`📡 API base: http://localhost:${PORT}${'/api/v1'}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});
