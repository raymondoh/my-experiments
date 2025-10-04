import { type NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/services/storage-service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.upload");

export async function POST(request: NextRequest) {
  try {
    log.info("upload start");

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      log.warn("unauthorized", { reason: "no-session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      log.warn("no file provided", { userId: session.user.id });
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use the storage service
    const result = await uploadFile({
      file,
      userId: session.user.id,
      userRole: session.user.role || "user"
    });

    if (result.success) {
      log.info("upload success", { userId: session.user.id });
      return NextResponse.json({ url: result.url });
    } else {
      log.warn("upload failed", { userId: session.user.id, error: result.error });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  } catch (error) {
    log.error("upload error", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown upload error" }, { status: 500 });
  }
}
