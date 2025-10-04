import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/services/orders";

type OrderSummaryProps = {
  order: Order;
};

const createCurrencyFormatter = (currency: string) => {
  const normalized = currency?.toUpperCase?.() ?? "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
};

const formatOrderDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
};

export function OrderSummary({ order }: OrderSummaryProps) {
  const formatter = createCurrencyFormatter(order.currency);
  const formatCurrency = (value: number) => formatter.format(value);
  const formattedDate = formatOrderDate(order.createdAtISO);

  const subtotal = formatCurrency(order.subtotal);
  const shipping = formatCurrency(order.shipping);
  const total = formatCurrency(order.total);

  return (
    <section
      aria-labelledby="order-summary-heading"
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
    >
      <div className="space-y-2 text-center">
        <h1 id="order-summary-heading" className="text-3xl font-semibold tracking-tight">
          Order confirmed
        </h1>
        <p className="text-base text-muted-foreground">
          A confirmation email has been sent to <span className="font-medium text-foreground">{order.email}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border/60 px-6 py-5">
          <p className="text-sm text-muted-foreground">Order number</p>
          <p className="break-all text-lg font-semibold">{order.id}</p>
          <p className="mt-2 text-sm text-muted-foreground">Placed on {formattedDate}</p>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold">Items</h2>
              <ul className="mt-3 divide-y divide-border/60" role="list">
                {order.items.map((item) => {
                  const lineTotal = formatCurrency(item.price * item.quantity);
                  const unitPrice = formatCurrency(item.price);
                  return (
                    <li key={`${item.productId}-${item.name}`} className="flex items-start justify-between gap-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{lineTotal}</p>
                        <p className="text-xs text-muted-foreground">{unitPrice} each</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{subtotal}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">{shipping}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{total}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="/user/orders">View my orders</Link>
        </Button>
      </div>
    </section>
  );
}
