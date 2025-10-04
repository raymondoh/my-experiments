import { NextRequest } from "next/server";

import { ok, badRequest, forbidden, serverError, unauthorized } from "@/lib/http";
import { createLogger } from "@/lib/logger";
import { createProduct, listProducts } from "@/lib/services/products";
import { createProductBody, listProductsQuery, parseSearchParams } from "@/lib/validation/api";

const log = createLogger("api.products");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams;
    const parsed = parseSearchParams(listProductsQuery, searchParams);

    if (!parsed.success) {
      log.warn("list params invalid", { issues: parsed.error.issues });
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const params = parsed.data;
    const result = await listProducts({
      q: params.q,
      category: params.category,
      onSale: params.onSale,
      limit: params.limit,
      cursor: params.cursor ?? null,
      sort: params.sort,
    });

    log.debug("products listed", {
      count: result.items.length,
      hasNext: Boolean(result.nextCursor),
      filter: {
        category: params.category,
        onSale: params.onSale,
        sort: params.sort,
      },
    });

    return ok({ items: result.items, nextCursor: result.nextCursor });
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("create unauthorized", { reason: "no-session" });
      return unauthorized();
    }

    if (session.user.role !== "admin") {
      log.warn("create forbidden", { userId: session.user.id, role: session.user.role });
      return forbidden("Admin access required");
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (parseError) {
      log.warn("create body invalid", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return badRequest("Invalid JSON body");
    }

    const parsed = createProductBody.safeParse(payload);
    if (!parsed.success) {
      log.warn("create body validation failed", { issues: parsed.error.issues });
      return badRequest("Invalid product data", parsed.error.flatten());
    }

    const id = await createProduct(parsed.data);
    log.info("product created", { productId: id, userId: session.user.id });

    return ok({ id });
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}
