import { render, screen } from "@testing-library/react";

import ProductGrid from "@/components/ProductGrid";

describe("ProductGrid", () => {
  it("renders product names and formatted prices", () => {
    render(
      <ProductGrid
        products={[
          { id: "helmet-1", name: "Helmet 1", price: 199.99 },
          { id: "helmet-2", name: "Helmet 2", price: 299.5 },
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: /products/i });
    expect(list.childElementCount).toBe(2);

    expect(screen.getByText("Helmet 1")).toBeInTheDocument();
    expect(screen.getByText("Helmet 2")).toBeInTheDocument();
    expect(screen.getByText("$199.99")).toBeInTheDocument();
    expect(screen.getByText("$299.50")).toBeInTheDocument();
  });
});
