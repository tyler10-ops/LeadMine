import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

/** Job data for a single follow-up sequence step. */
export interface FollowUpJobData {
  sequenceId:        string;
  leadId:            string;
  realtorId:         string;
  step:              number;
  channel:           "email" | "call" | "sms" | "rescore";
  tier:              "diamond" | "hot";
  followUpActivityId?: string; // DB row to mark completed after execution
}

/** Job data for a property owner mining run. */
export interface PropertyMiningJobData {
  clientId: string;
  counties: string[];   // e.g. ["Travis"]
  state: string;        // e.g. "TX"
  propertyTypes: string[];
  zipCodes?: string[];
  minYearsOwned?: number;
  minEquityPct?: number;
}

/** Job data for a mining run. */
export interface MiningJobData {
  clientId: string;
  verticalId: string;
  locations: string[];
  /** Optional: override which scrapers to use */
  scrapers?: string[];
}

/** Job data for a single scrape task (child job). */
export interface ScrapeJobData {
  clientId: string;
  verticalId: string;
  scraperName: string;
  query: string;
  location: string;
  parentJobId: string;
}

/** Progress update stored in job data. */
export interface MiningProgress {
  phase: "scraping" | "enriching" | "grading" | "saving" | "complete" | "error";
  totalQueries: number;
  completedQueries: number;
  recordsFound: number;
  recordsEnriched: number;
  recordsSaved: number;
  duplicatesSkipped: number;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}

const QUEUE_PREFIX = "leadmine-";

let miningQueue: Queue<MiningJobData> | null = null;
let scrapeQueue: Queue<ScrapeJobData> | null = null;

/** Get the main mining orchestration queue. */
export function getMiningQueue(): Queue<MiningJobData> {
  if (!miningQueue) {
    miningQueue = new Queue<MiningJobData>(`${QUEUE_PREFIX}mining`, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return miningQueue;
}

/** Get the scrape sub-task queue. */
export function getScrapeQueue(): Queue<ScrapeJobData> {
  if (!scrapeQueue) {
    scrapeQueue = new Queue<ScrapeJobData>(`${QUEUE_PREFIX}scrape`, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return scrapeQueue;
}

let followUpQueue: Queue<FollowUpJobData> | null = null;

/** Get the automated follow-up sequence queue. */
export function getFollowUpQueue(): Queue<FollowUpJobData> {
  if (!followUpQueue) {
    followUpQueue = new Queue<FollowUpJobData>(`${QUEUE_PREFIX}followup`, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return followUpQueue;
}

let propertyMiningQueue: Queue<PropertyMiningJobData> | null = null;

/** Get the property owner mining queue. */
export function getPropertyMiningQueue(): Queue<PropertyMiningJobData> {
  if (!propertyMiningQueue) {
    propertyMiningQueue = new Queue<PropertyMiningJobData>(`${QUEUE_PREFIX}property-mining`, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return propertyMiningQueue;
}
