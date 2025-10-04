// src/app/api/admin/promote-user/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { isAdmin } from "@/lib/auth/roles";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";

const promoteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required")
});

export async function POST(request: NextRequest) {
  console.log("🚀 Admin promote user API called");

  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = promoteUserSchema.parse(body);

    const targetUser = await userService.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
    }

    console.log(`👑 Promoting user ${targetUser.email} to admin`);
    const updatedUser = await userService.promoteToAdmin(userId);

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to promote user" }, { status: 500 });
    }

    console.log(`🎉 User ${targetUser.email} promoted to admin successfully`);
    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been promoted to admin`,
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Admin promotion error:", error);
    if (error instanceof z.ZodError) {
      const issue = error.issues?.[0] || (error as { errors?: { message?: string }[] }).errors?.[0];
      return NextResponse.json({ error: issue?.message ?? "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
