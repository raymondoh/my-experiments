// src/app/(marketing)/contact/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, MessageSquare, HelpCircle, Headphones, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Plumbers Portal support team. We're here to help with platform questions, technical issues, and account support."
};

// Reusable component for contact methods
const ContactDetail = ({
  icon: Icon,
  title,
  detail,
  subDetail
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  subDetail?: string;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
    <div>
      <div className="font-medium text-card-foreground">{title}</div>
      <div className="text-muted-foreground">{detail}</div>
      {subDetail && <div className="text-sm text-muted-foreground">{subDetail}</div>}
    </div>
  </div>
);

export default function ContactPage() {
  return (
    <>
      <MarketingHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* --- Hero Section --- */}
          <section className="mb-16 pt-16">
            <Card className="border-border bg-card text-center">
              <CardHeader>
                <CardTitle className="text-4xl md:text-6xl font-bold">
                  Contact <span className="text-primary">Support</span>
                </CardTitle>
                <CardDescription className="mx-auto max-w-2xl text-xl text-muted-foreground">
                  Need help with your account, have platform questions, or experiencing technical issues? Our support
                  team is here to help.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* --- Contact Information (Left Column) --- */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Headphones className="h-5 w-5 text-primary" />
                    Contact Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ContactDetail
                    icon={Phone}
                    title="Support Helpline"
                    detail="0800 123 4567"
                    subDetail="Mon-Fri 9AM-6PM"
                  />
                  <Separator />
                  <ContactDetail
                    icon={Mail}
                    title="General Support"
                    detail="support@plumbersportal.com"
                    subDetail="Response within 4 hours"
                  />
                  <Separator />
                  <ContactDetail
                    icon={Mail}
                    title="Technical Issues"
                    detail="tech@plumbersportal.com"
                    subDetail="For app bugs & problems"
                  />
                  <Separator />
                  <ContactDetail icon={MapPin} title="Office Address" detail="123 Tech Hub, London, SW1A 1AA" />
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Self-Help Resources
                  </CardTitle>
                  <CardDescription>Find answers to common questions instantly.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="link" asChild className="h-auto justify-start p-0">
                      <Link href="/help/faq">
                        Frequently Asked Questions <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="link" asChild className="h-auto justify-start p-0">
                      <Link href="/help/getting-started">
                        Getting Started Guide <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="link" asChild className="h-auto justify-start p-0">
                      <Link href="/terms">
                        Terms of Service <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- Contact Form (Right Column) --- */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription>
                    Tell us about your issue and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName" className="mb-2">
                          First Name *
                        </Label>
                        <Input id="firstName" name="firstName" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="mb-2">
                          Last Name *
                        </Label>
                        <Input id="lastName" name="lastName" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-2">
                        Email Address *
                      </Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="mb-2">
                        Issue Category *
                      </Label>
                      <Select name="subject" required>
                        <SelectTrigger>
                          <SelectValue placeholder="What type of help do you need?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account">Account Issues</SelectItem>
                          <SelectItem value="technical">Technical Problems</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="feedback">Platform Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message" className="mb-2">
                        Describe Your Issue *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={6}
                        placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Submit Support Request
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="mt-6 border-primary bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">Platform Support Only</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We provide support for using the Plumbers Portal platform. For actual plumbing work,
                        emergencies, or service issues, please contact your chosen plumber directly through the
                        platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
