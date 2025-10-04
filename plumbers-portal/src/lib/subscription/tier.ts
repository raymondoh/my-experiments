export type Tier = "basic" | "pro" | "business";

export const TIER_ORDER: Tier[] = ["basic", "pro", "business"];

export function meets(required: Tier, actual?: Tier) {
  const a = TIER_ORDER.indexOf(actual ?? "basic");
  const r = TIER_ORDER.indexOf(required);
  return a >= r;
}

export function asTier(x: unknown): Tier {
  return x === "pro" || x === "business" ? x : "basic";
}
