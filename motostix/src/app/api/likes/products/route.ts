import { NextResponse } from "next/server";
import { getUserLikedProducts } from "@/firebase/admin/products";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.likes.products");

export async function GET() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");

    // Get the session using auth()
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      log.warn("unauthorized", { reason: "no-session" });
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          products: [] // Always include this to avoid parsing errors
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    log.debug("fetching liked products", { userId });

    // Get all liked products for the user
    const result = await getUserLikedProducts(userId);

    if (!result.success) {
      log.error("fetch failed", result.error, { userId });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          products: [] // Always include this to avoid parsing errors
        },
        { status: 500 }
      );
    }

    log.info("liked products fetched", { userId, count: result.data.length });

    return NextResponse.json({
      success: true,
      products: result.data
    });
  } catch (error) {
    log.error("unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch liked products",
        products: [] // Always include this to avoid parsing errors
      },
      { status: 500 }
    );
  }
}
