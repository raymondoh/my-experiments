// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { getCategories } from "@/firebase/admin/categories";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.categories");

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    log.error("fetch failed", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}
