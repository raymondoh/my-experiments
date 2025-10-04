// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOptionalFreshSession, requireSession } from "@/lib/auth/require-session";
import { notificationService } from "@/lib/services/notification-service";
import { z } from "zod";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const NotificationIdsSchema = z.object({
  notificationIds: z.array(z.string()).nonempty()
});

// GET: tolerate unauthenticated callers (return empty list instead of redirect)
export async function GET() {
  try {
    const session = await getOptionalFreshSession();

    if (!session?.user?.id) {
      // No session -> don’t redirect from an API route
      return NextResponse.json({ notifications: [] }, { status: 200, headers: NO_STORE_HEADERS });
    }

    const notifications = await notificationService.getNotificationsForUser(session.user.id);
    return NextResponse.json({ notifications }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = NotificationIdsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { notificationIds } = result.data;

    await notificationService.markNotificationsAsRead(session.user.id, notificationIds);

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
