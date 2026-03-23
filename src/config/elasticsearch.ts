/**
 * FinSight — ElasticSearch Client Configuration
 */
import { Client } from "@elastic/elasticsearch";
import config from "./index";
import logger from "../utils/logger";

let esClient: Client | null = null;

export function getESClient(): Client {
  if (!esClient) {
    const options: Record<string, unknown> = {
      node: config.elasticsearch.url,
    };
    if (config.elasticsearch.apiKey) {
      options.auth = { apiKey: config.elasticsearch.apiKey };
    }
    esClient = new Client(options as any);
    logger.info("ElasticSearch client initialized", { node: config.elasticsearch.url });
  }
  return esClient;
}

export const ES_INDEX = "finsight_transactions";
