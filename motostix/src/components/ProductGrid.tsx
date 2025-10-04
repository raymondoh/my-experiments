import type { Product } from "@/lib/services/products";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

type ProductGridProps = {
  products: Array<Pick<Product, "id" | "name" | "price">>;
};

const ProductGrid = ({ products }: ProductGridProps) => {
  if (!products.length) {
    return <p role="status">No products available.</p>;
  }

  return (
    <ul aria-label="products" className="grid gap-4">
      {products.map(product => (
        <li key={product.id} className="rounded border p-4">
          <h3 className="text-base font-semibold">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{currencyFormatter.format(product.price)}</p>
        </li>
      ))}
    </ul>
  );
};

export default ProductGrid;
