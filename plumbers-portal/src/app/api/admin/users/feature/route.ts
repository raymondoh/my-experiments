// src/app/api/admin/users/feature/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { requireRole } from "@/lib/auth/guards";
import { UsersCollection } from "@/lib/firebase/admin"; // Corrected import path

const Body = z.object({
  userId: z.string().min(1),
  isFeatured: z.boolean(),
  featureExpiresAt: z.string().datetime().nullable().optional() // ISO, if provided
});

export async function POST(req: Request) {
  await requireSession();
  await requireRole("admin");

  const json = await req.json();
  const { userId, isFeatured, featureExpiresAt } = Body.parse(json);

  await UsersCollection()
    .doc(userId)
    .set(
      {
        isFeatured,
        featureExpiresAt: featureExpiresAt ? new Date(featureExpiresAt) : null,
        updatedAt: new Date()
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
