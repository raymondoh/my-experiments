import type { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { getLikedProducts } from "@/lib/services/users";
import { listLikedProductsQuery, parseSearchParams } from "@/lib/validation/api";

const log = createLogger("api.likes.products");

export async function GET(request: NextRequest) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("unauthorized", { method: "GET" });
      return unauthorized();
    }

    const parsed = parseSearchParams(listLikedProductsQuery, request.nextUrl.searchParams);
    if (!parsed.success) {
      log.warn("invalid query", { issues: parsed.error.flatten() });
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { limit, cursor } = parsed.data;
    const result = await getLikedProducts(session.user.id, { limit, cursor: cursor ?? null });

    return ok(result);
  } catch (error) {
    log.error("get failed", error);
    return serverError("Failed to fetch liked products");
  }
}
