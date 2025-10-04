import { createLogger } from "@/lib/logger";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { getLikedProductIds, likeProduct, unlikeProduct } from "@/lib/services/users";
import { likeBody } from "@/lib/validation/api";

const log = createLogger("api.likes");

export async function GET() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("unauthorized", { method: "GET" });
      return unauthorized();
    }

    const ids = await getLikedProductIds(session.user.id);
    return ok({ ids });
  } catch (error) {
    log.error("get failed", error);
    return serverError("Failed to fetch likes");
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("unauthorized", { method: "POST" });
      return unauthorized();
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      log.warn("invalid json", { method: "POST" });
      return badRequest("Invalid JSON body");
    }

    const parsed = likeBody.safeParse(json);
    if (!parsed.success) {
      log.warn("invalid body", { issues: parsed.error.flatten() });
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    await likeProduct(session.user.id, parsed.data.productId);

    return ok({});
  } catch (error) {
    log.error("post failed", error);
    return serverError("Failed to add like");
  }
}

export async function DELETE(request: Request) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      log.warn("unauthorized", { method: "DELETE" });
      return unauthorized();
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      log.warn("invalid json", { method: "DELETE" });
      return badRequest("Invalid JSON body");
    }

    const parsed = likeBody.safeParse(json);
    if (!parsed.success) {
      log.warn("invalid body", { issues: parsed.error.flatten() });
      return badRequest("Invalid request body", parsed.error.flatten());
    }

    await unlikeProduct(session.user.id, parsed.data.productId);

    return ok({});
  } catch (error) {
    log.error("delete failed", error);
    return serverError("Failed to remove like");
  }
}
