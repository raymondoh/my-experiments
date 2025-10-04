import { NextRequest } from "next/server";

import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { createLogger } from "@/lib/logger";
import { deleteProduct, getProductById, updateProduct } from "@/lib/services/products";
import { productId, updateProductBody } from "@/lib/validation/api";

const log = createLogger("api.products.id");

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsedId = productId.safeParse(id);

    if (!parsedId.success) {
      log.warn("invalid product id", { issues: parsedId.error.issues });
      return badRequest("Invalid product id", parsedId.error.flatten());
    }

    const product = await getProductById(parsedId.data);

    if (!product) {
      return notFound("Product not found");
    }

    return ok(product);
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsedId = productId.safeParse(id);

    if (!parsedId.success) {
      log.warn("update invalid id", { issues: parsedId.error.issues });
      return badRequest("Invalid product id", parsedId.error.flatten());
    }

    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("update unauthorized", { reason: "no-session" });
      return unauthorized();
    }

    if (session.user.role !== "admin") {
      log.warn("update forbidden", { userId: session.user.id, role: session.user.role });
      return forbidden("Admin access required");
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (parseError) {
      log.warn("update body invalid", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return badRequest("Invalid JSON body");
    }

    const parsedBody = updateProductBody.safeParse(payload);
    if (!parsedBody.success) {
      log.warn("update body validation failed", { issues: parsedBody.error.issues });
      return badRequest("Invalid product data", parsedBody.error.flatten());
    }

    await updateProduct(parsedId.data, parsedBody.data);
    const updated = await getProductById(parsedId.data);

    log.info("product updated", {
      productId: parsedId.data,
      userId: session.user.id,
      fields: Object.keys(parsedBody.data),
    });

    return ok({ id: parsedId.data, product: updated });
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsedId = productId.safeParse(id);

    if (!parsedId.success) {
      log.warn("delete invalid id", { issues: parsedId.error.issues });
      return badRequest("Invalid product id", parsedId.error.flatten());
    }

    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("delete unauthorized", { reason: "no-session" });
      return unauthorized();
    }

    if (session.user.role !== "admin") {
      log.warn("delete forbidden", { userId: session.user.id, role: session.user.role });
      return forbidden("Admin access required");
    }

    await deleteProduct(parsedId.data);

    log.info("product deleted", { productId: parsedId.data, userId: session.user.id });

    return ok({ id: parsedId.data });
  } catch (err) {
    log.error("unhandled", err);
    return serverError();
  }
}
