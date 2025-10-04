// src/app/api/favorites/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const postSchema = z.object({
  tradespersonId: z.string().min(1, "tradespersonId is required")
});

const deleteQuerySchema = z.object({
  tradespersonId: z.string().min(1, "tradespersonId is required")
});

export async function GET() {
  try {
    const session = await requireSession();

    // Authorization: Only customers can have favorites.
    if (session.user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const favorites = await userService.getFavoriteTradespeople(session.user.id);
    return NextResponse.json({ favorites }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    // Authorization: Only customers can add favorites.
    if (session.user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { tradespersonId } = postSchema.parse(await request.json());

    await userService.addFavoriteTradesperson(session.user.id, tradespersonId);
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Favorites POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();

    // Authorization: Only customers can remove favorites.
    if (session.user.role !== "customer") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const { tradespersonId } = deleteQuerySchema.parse(Object.fromEntries(searchParams));

    await userService.removeFavoriteTradesperson(session.user.id, tradespersonId);
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
