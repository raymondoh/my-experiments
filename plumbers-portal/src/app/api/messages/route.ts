import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChatsCollection } from "@/lib/firebase/admin";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { standardRateLimiter } from "@/lib/rate-limiter";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const messageSchema = z.object({
  jobId: z.string().min(1),
  text: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await standardRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: NO_STORE_HEADERS });
  }

  console.log("\n--- [API] New Message Request Received ---");
  try {
    const session = await requireSession();

    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { jobId, text } = parsed.data;
    const senderId = session.user.id;
    console.log(`[API] From: ${senderId}, For Job: ${jobId}`);

    const chatRef = ChatsCollection().doc(jobId);
    const chatSnap = await chatRef.get();

    type ChatDoc = { customerId: string; tradespersonId: string };
    const chatData = chatSnap.data() as Partial<ChatDoc> | undefined;

    if (!chatSnap.exists || !chatData?.customerId || !chatData?.tradespersonId) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const { customerId, tradespersonId } = chatData as ChatDoc;

    if (senderId !== customerId && senderId !== tradespersonId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const receiverId = senderId === customerId ? tradespersonId : customerId;
    console.log(`[API] Calculated Receiver: ${receiverId}`);
    const msgRef = await chatRef.collection("messages").add({
      text,
      senderId,
      receiverId,
      createdAt: new Date(),
      readBy: [senderId]
    });

    await notificationService.createNotification(receiverId, "new_message", "You have a new message", {
      jobId,
      messageId: msgRef.id
    });

    const receiver = await userService.getUserById(receiverId);
    if (receiver?.email) {
      // --- THIS IS THE FIX ---
      // We now pass the message text and the sender's name to the email service.
      // The sender's name is retrieved from the session.
      await emailService.sendNewMessageEmail(
        receiver.email,
        jobId,
        text, // Pass the message content
        session.user.name || "A user" // Pass the sender's name, with a fallback
      );
      console.log(`[API] Email sent to ${receiver.email}`);
    }
    console.log("--- [API] Request Processed Successfully ---\n");
    return NextResponse.json({ message: "Message sent", id: msgRef.id }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("Error sending message:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to send message", error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
    console.error("--- [API] Error Sending Message ---", err);
  }
}
