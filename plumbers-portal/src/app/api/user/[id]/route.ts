// src/app/api/user/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { userService } from "@/lib/services/user-service";
import { z } from "zod";

// The context's params object can be a promise in newer Next.js versions.
// We'll type it inline and await it in the function body.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the promise to get the actual params object
    const resolvedParams = await params;
    const { id } = z.object({ id: z.string() }).parse(resolvedParams);

    const user = await userService.getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only return public-safe data
    const publicUserData = {
      id: user.id,
      name: user.name,
      businessName: user.businessName,
      googleBusinessProfileUrl: user.googleBusinessProfileUrl
    };

    return NextResponse.json({ user: publicUserData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    console.error("[v0] API User fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
