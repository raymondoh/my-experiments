// src/app/api/products/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProducts, createProduct, getProductById } from "@/lib/services/products";
import { logActivity } from "@/firebase/actions";

const listParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  onSale: z
    .enum(["true", "false"]) // convert string booleans
    .transform(value => value === "true")
    .optional(),
  limit: z
    .string()
    .transform(value => Number.parseInt(value, 10))
    .pipe(z.number().int().positive().max(100))
    .optional(),
  cursor: z.string().optional(),
  sort: z.enum(["new", "priceAsc", "priceDesc", "rating"]).optional(),
});

type ListParamsInput = z.infer<typeof listParamsSchema>;

const parseListParams = (searchParams: URLSearchParams) => {
  const raw: Record<string, string | undefined> = {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    onSale: searchParams.get("onSale") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  };

  const result = listParamsSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  const data: ListParamsInput = result.data;

  return {
    q: data.q,
    category: data.category,
    onSale: data.onSale,
    limit: data.limit,
    cursor: data.cursor ?? null,
    sort: data.sort,
  } satisfies Parameters<typeof listProducts>[0];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    let params;
    try {
      params = parseListParams(searchParams);
    } catch (error) {
      console.error("Error parsing list params", error);
      return NextResponse.json({ success: false, error: "Invalid query parameters" }, { status: 400 });
    }

    const result = await listProducts(params);
    return NextResponse.json({ success: true, data: result.items, nextCursor: result.nextCursor });
  } catch (error) {
    console.error("Error in /api/products:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product creation)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    // Check if we're getting a valid image URL
    if (!data.image || typeof data.image !== "string" || !data.image.startsWith("http")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product data",
          details: "A valid image URL is required"
        },
        { status: 400 }
      );
    }

    const productId = await createProduct(data);
    const product = await getProductById(productId);

    // Log activity if the logActivity function is available
    try {
      await logActivity({
        userId: session.user.id,
        type: "create_product",
        description: `Created product: ${data.name}`,
        status: "success",
        metadata: {
          productId,
          productName: data.name,
          price: data.price
        }
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Continue execution even if logging fails
    }

    return NextResponse.json({ success: true, id: productId, product });
  } catch (error) {
    console.error("[POST /api/products]", error);
    let data;

    try {
      data = await request.clone().json(); // Use clone() to avoid "body used already" error
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      data = { name: "Unknown" };
    }

    // Log activity for failed product creation
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "create_product",
          description: `Failed to create product: ${error instanceof Error ? error.message : "Unknown error"}`,
          status: "error",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
            attemptedProductName: data?.name || "Unknown"
          }
        });
      }
    } catch (logError) {
      console.error("Failed to log error activity:", logError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
