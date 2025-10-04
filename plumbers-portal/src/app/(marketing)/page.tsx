import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import HeroSection from "@/components/marketing/hero-section";
import HowItWorksSection from "@/components/marketing/how-it-works-section";
import WhyChooseUsSection from "@/components/marketing/why-choose-us-section";
import CtaSection from "@/components/marketing/cta-section";
import { JobCard } from "@/components/cards/job-card";
import { TradespersonResults } from "@/components/search/tradesperson-results";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FeaturedTradespeopleCarousel } from "@/components/marketing/featured-tradespeople-carousel";

// FIX: Change caching strategy from revalidation to dynamic rendering.
// This ensures the server always fetches the latest data on every request.
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q = "" } = await searchParams;
  const query = q;
  const isSearchMode = Boolean(query);

  const [searchResults, featuredTradespeople, recentJobs] = await Promise.all([
    isSearchMode
      ? userService.searchTradespeople({ query, page: 1, limit: 50 }).then(result => result.users)
      : Promise.resolve([]),
    !isSearchMode ? userService.getFeaturedTradespeople(8) : Promise.resolve([]),
    !isSearchMode ? jobService.getRecentOpenJobs(8) : Promise.resolve([])
  ]);

  return (
    <div>
      <HeroSection />

      {isSearchMode ? (
        <section className="container py-16 lg:py-24">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Search results for "{query}"</h2>
          <TradespersonResults tradespeople={searchResults} />
        </section>
      ) : (
        <>
          <section className="py-12 lg:py-12">
            <HowItWorksSection />
          </section>

          {featuredTradespeople.length > 0 && (
            <section className="container py-12 lg:py-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Featured Tradespeople</h2>
                <p className="text-lg text-muted-foreground mt-2">Top-rated and verified professionals in your area.</p>
              </div>

              <div className="max-w-5xl mx-auto">
                <FeaturedTradespeopleCarousel tradespeople={featuredTradespeople} />
              </div>
              <div className="mt-8 text-center">
                <Button asChild variant="outline">
                  <Link href="/search">Browse All Tradespeople</Link>
                </Button>
              </div>
            </section>
          )}

          {recentJobs.length > 0 && (
            <section className="container py-12 lg:py-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Recently Posted Jobs</h2>
                <p className="text-lg text-muted-foreground mt-2">Opportunities available for quoting right now.</p>
              </div>

              <div className="max-w-5xl mx-auto">
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent>
                    {recentJobs.map(job => (
                      <CarouselItem key={job.id} className="basis-4/5 md:basis-1/3 lg:basis-1/3">
                        <div className="p-0 h-full">
                          <JobCard job={job} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
              </div>
              <div className="mt-8 text-center">
                <Button asChild>
                  <Link href="/dashboard/tradesperson/job-board">View Job Board</Link>
                </Button>
              </div>
            </section>
          )}

          <section className="py-12 lg:py-12">
            <WhyChooseUsSection />
          </section>

          <section className="py-12 lg:py-24">
            <CtaSection />
          </section>
        </>
      )}
    </div>
  );
}
