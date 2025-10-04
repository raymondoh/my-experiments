import { NextResponse } from "next/server";
import { getUserLikedProducts, likeProduct, unlikeProduct } from "@/firebase/admin/products";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.likes");

export async function GET() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      log.warn("unauthorized", { method: "GET" });
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          likedProductIds: [] // Always include this to avoid parsing errors
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    log.debug("fetching likes", { userId });

    // Get all liked products for the user
    const result = await getUserLikedProducts(userId);

    if (!result.success) {
      log.error("fetch failed", result.error, { userId });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          likedProductIds: [] // Always include this to avoid parsing errors
        },
        { status: 500 }
      );
    }

    // Extract just the product IDs for the client
    const likedProductIds = result.data.map(product => product.id);
    log.info("likes fetched", { userId, count: likedProductIds.length });

    return NextResponse.json({
      success: true,
      likedProductIds
    });
  } catch (error) {
    log.error("get failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch likes",
        likedProductIds: [] // Always include this to avoid parsing errors
      },
      { status: 500 }
    );
  }
}

// POST and DELETE handlers remain the same
export async function POST(request: Request) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      log.warn("unauthorized", { method: "POST" });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    log.debug("like requested", { userId });

    // Parse the request body
    const body = await request.json();
    const { productId } = body;

    log.debug("payload parsed", { keys: Object.keys(body ?? {}) });

    if (!productId) {
      log.warn("missing productId", { userId });
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Validate IDs
    if (typeof userId !== "string" || userId.trim() === "") {
      log.error("invalid userId", undefined, { userId });
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    if (typeof productId !== "string" || productId.trim() === "") {
      log.error("invalid productId", undefined, { userId });
      return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
    }

    log.info("like create", { userId, productId });

    // Like the product using your Firebase function
    const result = await likeProduct(userId, productId);

    if (!result.success) {
      log.error("like failed", result.error, { userId, productId });
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("post failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add like"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      log.warn("unauthorized", { method: "DELETE" });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    log.debug("unlike requested", { userId });

    // Parse the request body
    const body = await request.json();
    const { productId } = body;

    log.debug("payload parsed", { keys: Object.keys(body ?? {}) });

    if (!productId) {
      log.warn("missing productId", { userId });
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    log.info("like delete", { userId, productId });

    // Unlike the product using your Firebase function
    const result = await unlikeProduct(userId, productId);

    if (!result.success) {
      log.error("unlike failed", result.error, { userId, productId });
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("delete failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove like"
      },
      { status: 500 }
    );
  }
}
