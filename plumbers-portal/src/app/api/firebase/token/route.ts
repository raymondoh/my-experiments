// src/app/api/firebase/token/route.ts
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/require-session";

export async function GET() {
  try {
    const session = await requireSession();
    const token = await getFirebaseAdminAuth().createCustomToken(session.user.id);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating Firebase custom token:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
