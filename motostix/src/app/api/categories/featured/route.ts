// src/app/api/categories/featured/route.ts
import { NextResponse } from "next/server";
import { getFeaturedCategories } from "@/firebase/admin/categories";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.categories.featured");

export async function GET() {
  try {
    const categories = await getFeaturedCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    log.error("fetch failed", error);
    return NextResponse.json({ success: false, error: "Failed to fetch featured categories" }, { status: 500 });
  }
}
