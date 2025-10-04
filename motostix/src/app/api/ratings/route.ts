import { NextRequest } from "next/server";

import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { createLogger } from "@/lib/logger";
import { rateProduct } from "@/lib/services/products";
import { rateProductBody } from "@/lib/validation/api";

const log = createLogger("api.ratings");

export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("rate unauthorized", { reason: "no-session" });
      return unauthorized();
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (parseError) {
      log.warn("rate body invalid", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return badRequest("Invalid JSON body");
    }

    const parsed = rateProductBody.safeParse(payload);
    if (!parsed.success) {
      log.warn("rate body validation failed", { issues: parsed.error.issues });
      return badRequest("Invalid rating data", parsed.error.flatten());
    }

    const result = await rateProduct({
      productId: parsed.data.productId,
      userId: session.user.id,
      rating: parsed.data.rating,
    });

    log.info("rating submitted", {
      productId: parsed.data.productId,
      userId: session.user.id,
    });

    return ok(result);
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}
