import type { VerticalConfig } from "./base";
import { roofingVertical } from "./roofing";
import { realEstateVertical } from "./real-estate";

export type { VerticalConfig, ScoringWeights } from "./base";

/** Registry of all available vertical configs, keyed by id. */
const verticalRegistry = new Map<string, VerticalConfig>([
  [roofingVertical.id, roofingVertical],
  [realEstateVertical.id, realEstateVertical],
]);

/** Get a vertical config by id. Throws if not found. */
export function getVertical(id: string): VerticalConfig {
  const v = verticalRegistry.get(id);
  if (!v) throw new Error(`Unknown vertical: ${id}`);
  return v;
}

/** List all registered vertical ids. */
export function listVerticals(): string[] {
  return Array.from(verticalRegistry.keys());
}

/** Register a new vertical at runtime (for future verticals). */
export function registerVertical(config: VerticalConfig): void {
  verticalRegistry.set(config.id, config);
}
