import { type NextRequest, NextResponse } from "next/server";
import { getProductById as fetchProductById, updateProduct as updateProductService, deleteProduct as deleteProductService } from "@/lib/services/products";
import { productUpdateSchema } from "@/schemas/product";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/firebase/actions";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.products.id");

// GET - Fetch a single product by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  log.debug("GET invoked");
  try {
    // Await params in Next.js 15
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    log.debug("fetching product", { productId: id });

    const product = await fetchProductById(id);
    log.debug("product fetched", { productId: id, found: !!product });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    log.error("get failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch product"
      },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    log.info("update start", { productId: id });

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("unauthorized", { reason: "no-session" });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product updates)
    if (session.user.role !== "admin") {
      log.warn("forbidden", { userId: session.user.id, role: session.user.role });
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
      log.debug("payload parsed", { keys: body ? Object.keys(body) : [] });
    } catch (parseError) {
      log.warn("payload parse failed", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error"
        },
        { status: 400 }
      );
    }

    // Log specific fields for debugging
    if (body?.name) {
      log.debug("update name requested", { productId: id });
    }

    log.debug("sale fields", {
      onSale: body?.onSale,
      salePrice: body?.salePrice,
      price: body?.price,
    });

    // Validate the request body against the schema
    const validated = productUpdateSchema.safeParse(body);

    if (!validated.success) {
      log.error("validation failed", validated.error, {
        issueCount: validated.error.errors.length,
        productId: id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product data",
          validationErrors: validated.error.errors,
          details: validated.error.message
        },
        { status: 400 }
      );
    }

    // Log the validated data
    if (validated.data.name) {
      log.debug("validated name", { productId: id });
    }

    // Update the product using the new Firebase admin function
    log.debug("updating product", { productId: id });
    await updateProductService(id, validated.data);
    const updatedProduct = await fetchProductById(id);
    log.info("update success", {
      productId: id,
      userId: session.user.id,
      updatedFields: Object.keys(validated.data),
    });

    // Log activity for audit trail
    try {
      await logActivity({
        userId: session.user.id,
        type: "update_product",
        description: `Updated product: ${validated.data.name || "Unknown"}`,
        status: "success",
        metadata: {
          productId: id,
          productName: validated.data.name,
          updatedFields: Object.keys(validated.data),
          onSale: validated.data.onSale,
          salePrice: validated.data.salePrice
        }
      });
    } catch (logError) {
      log.error("activity log failed", logError, { productId: id });
      // Continue execution even if logging fails
    }

    // Revalidate relevant paths to ensure UI updates
    try {
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath(`/products/${id}`);
      revalidatePath("/products");
      revalidatePath("/"); // Home page might show featured products
    } catch (revalidateError) {
      log.warn("revalidate failed", {
        productId: id,
        error: revalidateError instanceof Error ? revalidateError.message : String(revalidateError),
      });
      // Continue execution even if revalidation fails
    }

    log.info("update completed", { productId: id });
    return NextResponse.json({
      success: true,
      data: updatedProduct,
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error("update failed", error);

    // Prepare error response
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const errorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    // Try to get product ID for error logging
    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch (paramError) {
      log.warn("param resolution failed", {
        error: paramError instanceof Error ? paramError.message : String(paramError),
      });
    }

    // Log activity for failed update
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "update_product",
          description: `Failed to update product: ${errorMessage}`,
          status: "error",
          metadata: {
            productId: errorDetails.productId,
            error: errorMessage
          }
        });
      }
    } catch (logError) {
      log.error("activity log failed", logError, { phase: "error" });
    }

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// DELETE - Remove a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    log.info("delete start", { productId: id });

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      log.warn("unauthorized", { reason: "no-session" });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product deletion)
    if (session.user.role !== "admin") {
      log.warn("forbidden", { userId: session.user.id, role: session.user.role });
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Delete the product using the product service
    await deleteProductService(id);

    // Log activity for audit trail
    try {
      await logActivity({
        userId: session.user.id,
        type: "delete_product",
        description: `Deleted product with ID: ${id}`,
        status: "success",
        metadata: {
          productId: id
        }
      });
    } catch (logError) {
      log.error("activity log failed", logError, { productId: id, action: "delete" });
      // Continue execution even if logging fails
    }

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath("/"); // Home page might show featured products
    } catch (revalidateError) {
      log.warn("revalidate failed", {
        productId: id,
        action: "delete",
        error: revalidateError instanceof Error ? revalidateError.message : String(revalidateError),
      });
      // Continue execution even if revalidation fails
    }

    log.info("delete completed", { productId: id });
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log.error("delete failed", error);

    // Prepare error response
    const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
    const errorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    // Try to get product ID for error logging
    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch (paramError) {
      log.warn("param resolution failed", {
        error: paramError instanceof Error ? paramError.message : String(paramError),
      });
    }

    // Log activity for failed deletion
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "delete_product",
          description: `Failed to delete product: ${errorMessage}`,
          status: "error",
          metadata: {
            productId: errorDetails.productId,
            error: errorMessage
          }
        });
      }
    } catch (logError) {
      log.error("activity log failed", logError, { phase: "error" });
    }

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
