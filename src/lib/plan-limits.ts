export type Plan = "free" | "miner" | "operator" | "brokerage";

export interface PlanLimits {
  countyScansPerMonth: number | null; // null = unlimited
  gradedLeadsPerMonth: number | null;
  maxLeadsPerMonth:    number | null; // cap on leads mined per month
  maxZipCodes:         number | null; // max ZIPs per mining run
  csvExport: boolean;
  aiAgents: number;
  teamSeats: number;
  leadMachine: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    countyScansPerMonth: 3,
    gradedLeadsPerMonth: 10,
    maxLeadsPerMonth:    25,
    maxZipCodes:         1,
    csvExport:        false,
    aiAgents:         0,
    teamSeats:        1,
    leadMachine:      true,  // free users can see the miner (limited)
    prioritySupport:  false,
    whiteLabel:       false,
  },
  miner: {
    countyScansPerMonth: 15,
    gradedLeadsPerMonth: 500,
    maxLeadsPerMonth:    500,
    maxZipCodes:         5,
    csvExport:        true,
    aiAgents:         1,
    teamSeats:        1,
    leadMachine:      true,
    prioritySupport:  false,
    whiteLabel:       false,
  },
  operator: {
    countyScansPerMonth: 50,
    gradedLeadsPerMonth: 2000,
    maxLeadsPerMonth:    2000,
    maxZipCodes:         15,
    csvExport:        true,
    aiAgents:         3,
    teamSeats:        3,
    leadMachine:      true,
    prioritySupport:  true,
    whiteLabel:       false,
  },
  brokerage: {
    countyScansPerMonth: null,
    gradedLeadsPerMonth: null,
    maxLeadsPerMonth:    null,
    maxZipCodes:         null,
    csvExport:        true,
    aiAgents:         10,
    teamSeats:        10,
    leadMachine:      true,
    prioritySupport:  true,
    whiteLabel:       true,
  },
};

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/** Returns true if the given plan can access a feature. */
export function canAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const val = getLimits(plan)[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number")  return val > 0;
  return val !== null; // null = unlimited = access granted
}
