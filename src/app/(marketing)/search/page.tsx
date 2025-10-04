import { userService } from "@/lib/services/user-service";
import { TradespersonResults } from "@/components/search/tradesperson-results";
import { Pagination } from "@/components/ui/pagination";
import { SearchForm } from "@/components/search/search-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 4;

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const currentPage = Number(params.page) || 1;

  const { users: searchResults, total } = await userService.searchTradespeople({
    query,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const heading = query ? `Search results for "${query}"` : "Browse All Tradespeople";
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // --- BREADCRUMB LOGIC ---
  const segments = [{ title: "Search", href: "/search" }];
  if (query) {
    segments.push({
      title: `"${query}"`,
      href: `/search?q=${encodeURIComponent(query)}`
    });
  }

  return (
    <>
      <Breadcrumbs segments={segments} className="mb-8" />
      <div className="container mx-auto py-8">
        <SearchForm initialQuery={query} />

        <h1 className="text-3xl font-bold mb-2 mt-8">{heading}</h1>
        <p className="text-muted-foreground mb-6">{total} tradespeople found.</p>

        <TradespersonResults tradespeople={searchResults} />

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
