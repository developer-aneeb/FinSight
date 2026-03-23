/**
 * FinSight — Search Service (ElasticSearch)
 */
import { getESClient, ES_INDEX } from "../config/elasticsearch";
import logger from "../utils/logger";

/** Create the transactions index if it doesn't exist */
export async function createSearchIndex(): Promise<void> {
  const es = getESClient();
  const exists = await es.indices.exists({ index: ES_INDEX });

  if (!exists) {
    await es.indices.create({
      index: ES_INDEX,
      body: {
        mappings: {
          properties: {
            id: { type: "keyword" },
            user_id: { type: "keyword" },
            description: { type: "text", analyzer: "standard" },
            amount: { type: "float" },
            type: { type: "keyword" },
            category_name: { type: "text" },
            tags: { type: "text" },
            date: { type: "date" },
            created_at: { type: "date" },
          },
        },
      },
    });
    logger.info("Search index created", { index: ES_INDEX });
  }
}

/** Index a single transaction */
export async function indexTransaction(transaction: Record<string, any>): Promise<void> {
  const es = getESClient();

  await es.index({
    index: ES_INDEX,
    id: transaction.id,
    body: {
      id: transaction.id,
      user_id: transaction.user_id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category_name: transaction.category_name || "",
      tags: Array.isArray(transaction.tags) ? transaction.tags.join(" ") : "",
      date: transaction.transaction_date || transaction.date,
      created_at: transaction.created_at,
    },
  });

  logger.debug("Transaction indexed", { id: transaction.id });
}

/** Remove a transaction from the index */
export async function removeTransaction(transactionId: string): Promise<void> {
  const es = getESClient();

  try {
    await es.delete({ index: ES_INDEX, id: transactionId });
    logger.debug("Transaction removed from index", { id: transactionId });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      logger.warn("Transaction not found in search index", { id: transactionId });
      return;
    }
    throw err;
  }
}

/** Search transactions via ElasticSearch */
export async function searchTransactions(
  userId: string,
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ results: any[]; total: number }> {
  const es = getESClient();
  const from = (page - 1) * pageSize;

  const response = await es.search({
    index: ES_INDEX,
    body: {
      from,
      size: pageSize,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ["description^3", "category_name^2", "tags"],
                fuzziness: "AUTO",
                type: "best_fields",
              },
            },
          ],
          filter: [{ term: { user_id: userId } }],
        },
      },
      sort: [{ _score: { order: "desc" } }, { date: { order: "desc" } }],
    },
  });

  const hits = (response as any).hits;
  const total = typeof hits.total === "object" ? hits.total.value : hits.total;
  const results = hits.hits.map((hit: any) => ({
    ...hit._source,
    _score: hit._score,
  }));

  return { results, total };
}
