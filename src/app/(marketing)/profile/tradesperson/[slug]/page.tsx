//src / app / marketing / profile / tradesperson / [slug] / page.tsx;
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { userService } from "@/lib/services/user-service";
import { reviewService } from "@/lib/services/review-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Briefcase, FolderKanban } from "lucide-react";
import SubscriptionGuard from "@/components/auth/subscription-guard";
import CertificationList from "@/components/profile/certification-list";
import { formatDateShortGB, getInitials, formatCitySlug } from "@/lib/utils"; // Import formatCitySlug
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CertificationBadge } from "@/components/certifications/certification-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs"; // Import the Breadcrumbs component

interface TradespersonProfilePageProps {
  params: {
    slug: string;
  };
}

export default async function TradespersonProfilePage({ params }: TradespersonProfilePageProps) {
  const { slug } = params;
  const session = await auth();
  const tradesperson = await userService.getUserBySlug(slug);

  if (!tradesperson || tradesperson.role !== "tradesperson") {
    notFound();
  }

  // Show "Request Quote" button only to customers or unauthenticated users
  const showRequestQuoteButton = !session?.user || session.user.role === "customer";

  const reviews = await reviewService.getReviewsByTradespersonId(tradesperson.id);
  const averageRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const showAdvancedFeatures = subjectTier === "pro" || subjectTier === "business";
  const verifiedCertifications = tradesperson.certifications?.filter(cert => cert.verified) ?? [];

  // --- BREADCRUMB LOGIC ---
  const breadcrumbSegments = [];
  if (tradesperson.citySlug) {
    const cityName = formatCitySlug(tradesperson.citySlug);
    breadcrumbSegments.push({ title: `Plumbers in ${cityName}`, href: `/plumbers/${tradesperson.citySlug}` });
  }
  breadcrumbSegments.push({
    title: tradesperson.businessName || tradesperson.name || "Profile",
    href: `/profile/tradesperson/${tradesperson.slug}`
  });
  // --- END OF BREADCRUMB LOGIC ---

  return (
    <>
      <Breadcrumbs segments={breadcrumbSegments} className="container mb-6" />

      <div className=" flex-1">
        <div className="container mx-auto max-w-6xl py-8 sm:py-12 px-4">
          <div className="space-y-8">
            {/* --- Header Section --- */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={tradesperson.profilePicture || ""} alt={tradesperson.name || "Tradesperson"} />
                <AvatarFallback className="text-4xl">
                  {getInitials(tradesperson.businessName || tradesperson.name)}
                </AvatarFallback>
              </Avatar>
              <div className="pt-2 flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold">{tradesperson.businessName || tradesperson.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">
                  {tradesperson.specialties?.join(" • ") || "Plumbing Professional"}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tradesperson.location?.town || tradesperson.location?.postcode}</span>
                  </div>
                  {showAdvancedFeatures && reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span>
                        {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>

                {showAdvancedFeatures && verifiedCertifications.length > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                    {verifiedCertifications.map(cert => (
                      <CertificationBadge key={cert.id} cert={cert} />
                    ))}
                  </div>
                )}
              </div>

              {/* Conditionally render the button. */}
              {showRequestQuoteButton && (
                <div className="pt-2">
                  <Button asChild size="lg">
                    <Link href={`/dashboard/customer/jobs/create?tradespersonId=${tradesperson.id}`}>
                      Request Quote
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* --- About Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tradesperson.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>

                {/* --- Certifications Section --- */}
                <CertificationList certifications={tradesperson.certifications || []} />

                {/* --- Portfolio Section --- */}
                <SubscriptionGuard allowedTiers={["pro", "business"]} tierOverride={subjectTier}>
                  {tradesperson.portfolio?.length ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-primary" />
                          Portfolio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <Carousel
                            opts={{
                              align: "start",
                              loop: true
                            }}
                            className="w-full">
                            <CarouselContent>
                              {tradesperson.portfolio.map((src, idx) => (
                                <CarouselItem key={idx} className="basis-4/5 md:basis-1/2">
                                  <div className="relative w-full aspect-square">
                                    <Image
                                      src={src}
                                      alt={`Portfolio image ${idx + 1}`}
                                      fill
                                      className="object-cover rounded-md"
                                      sizes="(min-width: 1024px) 20vw, 50vw"
                                      priority={idx < 2}
                                    />
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex" />
                            <CarouselNext className="hidden sm:flex" />
                          </Carousel>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </SubscriptionGuard>
              </div>
              <div className="lg:col-span-1 space-y-8">
                {/* --- Details Section --- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-1">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {tradesperson.specialties?.length ? (
                          tradesperson.specialties.map(s => (
                            <Badge key={s} variant="secondary">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No specialties listed.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Service Areas</h3>
                      <p className="text-muted-foreground">{tradesperson.serviceAreas || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Experience</h3>
                      <p className="text-muted-foreground">
                        {tradesperson.experience ? `${tradesperson.experience} years` : "Not specified"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* --- Reviews Section --- */}
                {showAdvancedFeatures && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reviews.length ? (
                        <div className="space-y-4">
                          {reviews.slice(0, 3).map(
                            (
                              review // Show first 3 reviews
                            ) => (
                              <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      className={
                                        "h-4 w-4 " +
                                        (star <= review.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-muted-foreground")
                                      }
                                    />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  <span>{formatDateShortGB(review.createdAt)}</span>
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No reviews yet.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
