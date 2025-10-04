// src/app/(marketing)/about/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Shield, Wrench, Smartphone, Star, Building, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Plumbers Portal - the leading SaaS platform connecting customers with professional plumbers across the UK."
};

export default function AboutPage() {
  return (
    <>
      <MarketingHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* --- Hero Section --- */}
          <div className="text-center mb-20 pt-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              About <span className="text-primary">Plumbers Portal</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The leading SaaS platform revolutionizing how customers find and connect with professional plumbers across
              the UK. We don't fix pipes - we connect people.
            </p>
          </div>

          {/* --- Mission Section --- */}
          <div className="mb-20">
            <Card className="border-border shadow-lg bg-card transition-transform hover:-translate-y-1">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl text-card-foreground mb-4">Our Mission</CardTitle>
                <CardDescription className="text-lg max-w-2xl mx-auto">
                  To create the most trusted and efficient marketplace where customers can easily find qualified
                  plumbers, and where plumbing professionals can grow their businesses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">Technology</h3>
                    <p className="text-muted-foreground">
                      A cutting-edge platform that makes finding and hiring plumbers simple and secure.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">Trust</h3>
                    <p className="text-muted-foreground">
                      Verified plumber profiles, secure payments, and a transparent review system.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">Community</h3>
                    <p className="text-muted-foreground">
                      Building lasting relationships between customers and professional tradespeople.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Our Story Section --- */}
          <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Plumbers Portal was founded by a team of homeowners and tech enthusiasts who were frustrated with the
                hassle of finding reliable tradespeople. We knew there had to be a better way than endless phone calls
                and uncertain quotes.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our vision was simple: create a single, trustworthy platform where quality meets convenience. Today,
                we're proud to be the UK's fastest-growing network connecting thousands of customers with skilled,
                vetted plumbers every day.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <Image
                src="/images/diana.jpeg"
                alt="Plumbers Portal Team"
                width={800}
                height={450}
                className="rounded-lg shadow-xl w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* --- How Our Platform Works Section --- */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">How Our Platform Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Users className="h-6 w-6 text-primary" />
                    For Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Search and browse verified plumber profiles",
                      "Post job requirements and receive multiple quotes",
                      "Read genuine reviews and ratings",
                      "Secure messaging and booking system",
                      "Protected payments and dispute resolution"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-card-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Wrench className="h-6 w-6 text-secondary" />
                    For Plumbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Create a professional profile to showcase expertise",
                      "Access to local customers actively seeking services",
                      "Job management tools and scheduling system",
                      "Secure payment processing and invoicing tools",
                      "Build your reputation with customer feedback"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-card-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* --- Stats Section --- */}
          <div className="mb-20">
            <Card className="bg-secondary text-secondary-foreground border-0">
              <CardContent className="py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div className="flex flex-col items-center">
                    <Heart className="h-8 w-8 mb-2" />
                    <div className="text-4xl font-bold">10,000+</div>
                    <div className="opacity-80">Happy Customers</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Wrench className="h-8 w-8 mb-2" />
                    <div className="text-4xl font-bold">500+</div>
                    <div className="opacity-80">Verified Plumbers</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Star className="h-8 w-8 mb-2" />
                    <div className="text-4xl font-bold">4.8/5</div>
                    <div className="opacity-80">Average Rating</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Building className="h-8 w-8 mb-2" />
                    <div className="text-4xl font-bold">50+</div>
                    <div className="opacity-80">UK Cities Covered</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- CTA Section --- */}
          <div className="text-center">
            <Card className="border-0 shadow-lg bg-card">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-xl mb-8 text-muted-foreground">
                  Join the UK's fastest-growing plumbing services marketplace
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/register?role=customer">Find a Plumber</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register?role=tradesperson">Join as a Plumber</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
