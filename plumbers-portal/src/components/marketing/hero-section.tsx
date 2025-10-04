import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/search-form";

export default function HeroSection() {
  return (
    <section className="py-20 text-center bg-background">
      <div className="container">
        <Badge className="mb-4">🚰 Professional Plumbing Services</Badge>
        <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
          Connect with <span className="text-primary">Trusted Plumbers</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Post your job for free and receive competitive quotes from qualified professionals in your area.
        </p>
        <SearchForm />
      </div>
    </section>
  );
}
