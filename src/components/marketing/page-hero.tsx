// src/components/marketing/page-hero.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageHeroProps {
  title: string;
  subtitle: string;
  cta?: { href: string; label: string }[];
}

export function PageHero({ title, subtitle, cta }: PageHeroProps) {
  return (
    <div className="text-center my-12">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
      {cta && cta.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-x-4">
          {cta.map(item => (
            <Button key={item.href} asChild size="lg">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
