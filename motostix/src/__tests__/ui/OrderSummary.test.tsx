import { render, screen, within } from "@testing-library/react";

import { OrderSummary } from "@/components/checkout/OrderSummary";
import type { Order } from "@/lib/services/orders";

const buildOrder = (): Order => ({
  id: "order_1234567890",
  userId: "user_1",
  email: "customer@example.com",
  items: [
    {
      productId: "prod_1",
      name: "Moto Helmet",
      price: 199.99,
      quantity: 1,
      image: null,
    },
    {
      productId: "prod_2",
      name: "Riding Gloves",
      price: 49.5,
      quantity: 2,
      image: null,
    },
  ],
  currency: "usd",
  subtotal: 298.99,
  shipping: 10,
  total: 308.99,
  status: "paid",
  stripePaymentIntentId: "pi_123",
  stripeCheckoutSessionId: "cs_test_123",
  stripeEventId: "evt_123",
  createdAtISO: "2024-05-01T12:00:00.000Z",
  updatedAtISO: "2024-05-01T12:05:00.000Z",
  metadata: {},
  shippingAddress: null,
});

describe("OrderSummary", () => {
  it("renders order details and totals", () => {
    const order = buildOrder();
    render(<OrderSummary order={order} />);

    expect(screen.getByRole("heading", { name: /order confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(order.email)).toBeInTheDocument();

    const expectedDate = new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(order.createdAtISO));
    expect(screen.getByText(new RegExp(expectedDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();

    const itemsList = screen.getByRole("list");
    const itemEntries = within(itemsList).getAllByRole("listitem");
    expect(itemEntries).toHaveLength(order.items.length);

    for (const item of order.items) {
      expect(within(itemsList).getByText(item.name)).toBeInTheDocument();
      expect(
        within(itemsList).getByText(new RegExp(`Quantity: ${item.quantity}`)),
      ).toBeInTheDocument();
    }

    expect(screen.getByText("$298.99")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("$308.99")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /continue shopping/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my orders/i })).toBeInTheDocument();
  });
});
