import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createLogger } from "@/lib/logger";
import { listOrders, type OrderStatus } from "@/lib/services/orders";

const log = createLogger("api.orders");

const orderStatusSchema = z.enum([
  "created",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "failed",
  "any",
]);

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .refine((value) => value === undefined || /^\d+$/.test(value), {
      message: "limit must be a positive integer",
    })
    .transform((value) => (value === undefined ? undefined : Number.parseInt(value, 10)))
    .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
      message: "limit must be a positive integer",
    }),
  cursor: z.string().optional(),
  status: orderStatusSchema.optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      log.warn("invalid query params", { issues: parseResult.error.issues });
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { limit, cursor, status, userId } = parseResult.data;

    const statusFilter = (status ?? "any") as OrderStatus | "any";
    const resolvedUserId = isAdmin ? userId ?? undefined : session.user.id;

    const orders = await listOrders({
      userId: resolvedUserId,
      limit,
      cursor: cursor ?? null,
      status: statusFilter,
    });

    return NextResponse.json(orders);
  } catch (error) {
    log.error("failed to list orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
