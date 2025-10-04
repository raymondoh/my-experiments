// src/app/(marketing)/plumbers/[city]/[service]/page.tsx
import { userService } from "@/lib/services/user-service";
import { formatCitySlug, toSlug } from "@/lib/utils";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/layout/breadcrumbs"; // Import the Breadcrumbs component

export async function generateStaticParams() {
  const params: { city: string; service: string }[] = [];
  for (const city of CITIES) {
    for (const service of POPULAR_SERVICES) {
      params.push({ city: toSlug(city), service: toSlug(service) });
    }
  }
  return params;
}

interface CityServicePageProps {
  params: { city: string; service: string };
  searchParams: { page?: string }; // Corrected type (no promise)
}

const ITEMS_PER_PAGE = 4;

export default async function CityServicePage({ params, searchParams }: CityServicePageProps) {
  const { city, service } = params;
  const currentPage = Number(searchParams?.page) || 1;

  const { users: tradespeople, total } = await userService.findTradespeopleByCityAndService({
    citySlug: city,
    serviceSlug: service,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const displayCity = formatCitySlug(city);
  const displayService = formatCitySlug(service);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // --- BREADCRUMB LOGIC ---
  const breadcrumbSegments = [
    { title: `Plumbers in ${displayCity}`, href: `/plumbers/${city}` },
    { title: displayService, href: `/plumbers/${city}/${service}` }
  ];
  // --- END OF BREADCRUMB LOGIC ---

  return (
    <>
      <Breadcrumbs segments={breadcrumbSegments} className="mb-6" />
      <main className="container mx-auto py-8">
        <h1 className="mb-2 text-3xl font-bold">
          {displayService} services in {displayCity}
        </h1>
        <p className="text-muted-foreground mb-6">{total} tradespeople found.</p>

        {tradespeople.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tradespeople.map(tp => (
              <TradespersonCard key={tp.id} tradesperson={tp} />
            ))}
          </div>
        ) : (
          <p>No tradespeople were found for this city and service combination.</p>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </main>
    </>
  );
}
