"use client";

import { useEffect } from "react";

import { useCart } from "@/contexts/CartContext";

import { CheckoutSuccess } from "./checkoutSuccess";

interface CheckoutSuccessClientProps {
  orderId?: string | null;
}

export function CheckoutSuccessClient({ orderId }: CheckoutSuccessClientProps) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return <CheckoutSuccess orderId={orderId ?? undefined} />;
}
