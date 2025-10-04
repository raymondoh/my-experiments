import { NextRequest } from "next/server";

jest.mock("@/lib/services/products", () => ({
  listProducts: jest.fn(),
}));

import { GET } from "@/app/api/products/route";
import { listProducts, type Product } from "@/lib/services/products";

describe("GET /api/products", () => {
  it("returns products with pagination metadata", async () => {
    const mockItems: Product[] = [
      {
        id: "helmet-1",
        name: "Helmet 1",
        slug: "helmet-1",
        price: 199,
        category: "helmets",
        images: ["helmet-1.jpg"],
        createdAtISO: new Date("2024-01-01T00:00:00.000Z").toISOString(),
      },
      {
        id: "helmet-2",
        name: "Helmet 2",
        slug: "helmet-2",
        price: 299,
        category: "helmets",
        images: ["helmet-2.jpg"],
        createdAtISO: new Date("2024-01-02T00:00:00.000Z").toISOString(),
      },
    ];

    jest.mocked(listProducts).mockResolvedValue({ items: mockItems, nextCursor: "cursor-123" });

    const request = new NextRequest("https://example.com/api/products?category=helmets&limit=2");
    const response = await GET(request);

    expect(listProducts).toHaveBeenCalledWith({ category: "helmets", limit: 2, cursor: null, onSale: undefined, q: undefined, sort: undefined });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ ok: true, data: { items: mockItems, nextCursor: "cursor-123" } });
  });
});
