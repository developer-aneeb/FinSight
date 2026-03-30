import { getAdminClient } from "@config/supabaseAdminClient";
import { generateInsights } from "@modules/insights/insights.service";
import logger from "@utils/logger";

/**
 * 🧠 AI Analysis Pipelines
 * Separate from the direct API layer, this service can be triggered by a CRON job
 * or an admin endpoint to batch process large aggregations of data across all users
 * without putting pressure on the user-facing UI APIs.
 */
export async function runGlobalAnalysisPipeline() {
  const supabase = getAdminClient();
  logger.info("Starting Global AI Analysis Pipeline...");

  // 1. Fetch active users (for example purposes, fetching a subset or all, ideally paginated in production)
  let hasMore = true;
  let offset = 0;
  const limit = 100;
  let totalProcessed = 0;

  while (hasMore) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch users for pipeline", error);
      break;
    }

    if (!users || users.length === 0) {
      hasMore = false;
      break;
    }

    // 2. Run analysis for each user in parallel batches
    const batchPromises = users.map(async (user) => {
      try {
        await generateInsights(String(user.id));
        // Add more pipeline steps per user here if necessary (e.g. data normalization)
      } catch (err) {
        logger.error(`Pipeline error for user ${user.id}`, err);
      }
    });

    await Promise.all(batchPromises);
    totalProcessed += users.length;
    offset += limit;

    logger.info(`Processed ${totalProcessed} users...`);
  }

  logger.info(`Finished Global AI Analysis Pipeline. Total users processed: ${totalProcessed}`);
  return { success: true, totalProcessed };
}
