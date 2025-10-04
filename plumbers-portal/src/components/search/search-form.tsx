"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchFormProps {
  initialQuery?: string;
}

export function SearchForm({ initialQuery = "" }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query) {
      router.push(`/search`);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 p-2 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search for 'boiler repair' or 'plumber in london'..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="px-8">
          Find Plumbers
        </Button>
      </form>
    </div>
  );
}
