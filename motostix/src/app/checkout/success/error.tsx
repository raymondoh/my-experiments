"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type CheckoutSuccessErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CheckoutSuccessError({ error, reset }: CheckoutSuccessErrorProps) {
  useEffect(() => {
    console.error("checkout success error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full items-center justify-center px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your order confirmation. You can retry or return to the shop.
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="w-full sm:w-auto">
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
