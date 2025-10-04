import { Badge } from "@/components/ui/badge";

type Tier = "basic" | "pro" | "business" | null | undefined;

export default function SubscriptionBadge({ tier }: { tier: Tier }) {
  const t = (tier ?? "basic") as "basic" | "pro" | "business";
  const variant = t === "business" ? "default" : t === "pro" ? "secondary" : "outline";
  const label = t.toUpperCase();

  return <Badge variant={variant}>{label}</Badge>;
}
