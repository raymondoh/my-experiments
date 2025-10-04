// src/app/(marketing)/plumbers/[city]/page.tsx
import { userService } from "@/lib/services/user-service";
import { formatCitySlug, toSlug } from "@/lib/utils";
import { CITIES } from "@/lib/config/locations";
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/layout/breadcrumbs"; // Import the Breadcrumbs component

export async function generateStaticParams() {
  return CITIES.map(city => ({ city: toSlug(city) }));
}

interface CityPageProps {
  params: { city: string };
  searchParams: { page?: string }; // Corrected type (no promise)
}

const ITEMS_PER_PAGE = 4;

export default async function CityPlumbersPage({ params, searchParams }: CityPageProps) {
  const { city } = params;
  const currentPage = Number(searchParams?.page) || 1;

  const { users: tradespeople, total } = await userService.findTradespeopleByCity({
    citySlug: city,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const displayName = formatCitySlug(city);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // --- BREADCRUMB LOGIC ---
  const breadcrumbSegments = [{ title: `Plumbers in ${displayName}`, href: `/plumbers/${city}` }];
  // --- END OF BREADCRUMB LOGIC ---

  return (
    <>
      <Breadcrumbs segments={breadcrumbSegments} className="container mb-6" />
      <main className="container mx-auto py-8">
        <h1 className="mb-2 text-3xl font-bold">Plumbers in {displayName}</h1>
        <p className="text-muted-foreground mb-6">{total} tradespeople found.</p>

        {tradespeople.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tradespeople.map(tp => (
              <TradespersonCard key={tp.id} tradesperson={tp} />
            ))}
          </div>
        ) : (
          <p>No tradespeople found for this area.</p>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </main>
    </>
  );
}
