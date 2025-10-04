"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to open billing portal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className={className} onClick={onClick} disabled={loading}>
      {loading ? "Opening…" : "Manage subscription"}
    </Button>
  );
}
