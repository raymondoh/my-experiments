import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";

export type Tier = "basic" | "pro" | "business";

export const asTier = (v?: string | null): Tier => (v === "pro" || v === "business" ? v : "basic");

/** Does the user's actual tier meet ANY of the required tiers? */
export const meets = (actual: Tier, required: Tier | Tier[]) => {
  const order: Tier[] = ["basic", "pro", "business"];
  const actualIdx = order.indexOf(asTier(actual));
  const reqList = Array.isArray(required) ? required : [required];
  return reqList.some(r => actualIdx >= order.indexOf(asTier(r)));
};

/** Server-side guard that returns the effective tier (DB > session) or throws if insufficient. */
export async function requireTier(required: Tier | Tier[]) {
  const session = await requireSession();
  const dbUser = await userService.getUserById(session.user.id);
  const effective = asTier(dbUser?.subscriptionTier ?? session.user.subscriptionTier ?? "basic");
  if (!meets(effective, required)) {
    throw new Error("FORBIDDEN_TIER");
  }
  return effective;
}
