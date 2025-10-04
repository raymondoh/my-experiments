import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";

export async function GET() {
  try {
    // 1. Environment & Authorization Check
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Original Logic
    const users = await userService.getAllUsers();

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error("Debug users error:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // 1. Environment & Authorization Check
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Original Logic
    const users = await userService.getAllUsers();
    let deletedCount = 0;

    for (const user of users) {
      if (user.email !== "admin@example.com" && user.email !== "user@example.com") {
        await userService.deleteUser(user.id);
        deletedCount++;
      }
    }

    console.log(`🧹 Deleted ${deletedCount} users`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} users`
    });
  } catch (error) {
    console.error("Debug delete users error:", error);
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 });
  }
}
