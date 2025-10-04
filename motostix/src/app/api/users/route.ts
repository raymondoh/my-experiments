import type { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/http";
import { getUserProfile, listUsers } from "@/lib/services/users";
import { parseSearchParams, listUsersQuery } from "@/lib/validation/api";

const log = createLogger("api.users");

export async function GET(request: NextRequest) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("unauthorized", { method: "GET" });
      return unauthorized();
    }

    const adminProfile = await getUserProfile(session.user.id);
    if (adminProfile?.role !== "admin") {
      log.warn("forbidden", { userId: session.user.id });
      return forbidden("Admin access required");
    }

    const parsed = parseSearchParams(listUsersQuery, request.nextUrl.searchParams);
    if (!parsed.success) {
      log.warn("invalid query", { issues: parsed.error.flatten() });
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { q, limit, cursor, role } = parsed.data;
    const result = await listUsers({ q, limit, cursor: cursor ?? null, role });

    return ok(result);
  } catch (error) {
    log.error("list failed", error);
    return serverError("Failed to list users");
  }
}
