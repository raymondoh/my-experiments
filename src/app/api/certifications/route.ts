//src/app/api/certifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import type { UpdateUserData } from "@/lib/types/user";
import type { Certification } from "@/lib/types/certification";
import { storageService } from "@/lib/services/storage-service";
import { randomUUID } from "crypto";
import { verifyCertification } from "@/lib/services/certification-verification";

const certificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  metadata: z.record(z.string(), z.string().nullable()).optional(),
  fileUrl: z.string().url().nullable().optional(),
  verified: z.boolean().optional(),
  verifiedAt: z.coerce.date().nullable().optional(),
  verifiedBy: z.string().optional()
});

const payloadSchema = z.object({
  certifications: z.array(certificationSchema)
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const json = await req.json();
    const { certifications } = payloadSchema.parse(json);

    const update: UpdateUserData = { certifications };
    const updatedUser = await userService.updateUser(session.user.id, update);
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update certifications" }, { status: 500 });
    }
    return NextResponse.json({ success: true, certifications: updatedUser.certifications });
  } catch (error) {
    console.error("Certification update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const formData = await req.formData();
    const file = formData.get("file");
    const issuingBody = formData.get("issuingBody") as string;
    const name = formData.get("name") as string;
    const metadataString = formData.get("metadata") as string | null;
    const metadata = metadataString ? JSON.parse(metadataString) : {};

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const validation = storageService.validateFile(file, {
      allowedTypes: ["application/pdf", "image/jpeg", "image/png"]
    });
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const certId = randomUUID();
    // --- THIS IS THE FIX ---
    // Use the new admin upload method
    const path = `certifications/${issuingBody}/${session.user.id}/${certId}/${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const fileUrl = await storageService.uploadFileAsAdmin(file, path);
    // --- END OF FIX ---

    let certification: Certification = {
      id: certId,
      name,
      issuingBody,
      metadata,
      fileUrl,
      verified: false
    };

    const verificationResult = await verifyCertification(certification);
    certification = { ...certification, ...verificationResult };

    const user = await userService.getUserById(session.user.id);
    const certifications = user?.certifications ? [...user.certifications, certification] : [certification];
    await userService.updateUser(session.user.id, { certifications });

    return NextResponse.json({ success: true, certification });
  } catch (error) {
    console.error("Certification upload error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
