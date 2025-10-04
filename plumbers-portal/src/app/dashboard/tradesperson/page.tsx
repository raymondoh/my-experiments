// src/app/dashboard/tradesperson/page.tsx
import { requireSession } from "@/lib/auth/require-session";
import { redirect } from "next/navigation";
import { userService } from "@/lib/services/user-service";
import { jobService } from "@/lib/services/job-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, User, FileText, CheckCircle, Percent, Banknote } from "lucide-react";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import ManageSubscriptionButton from "@/components/subscriptions/manage-subscription-button";
import ManagePayoutsButton from "@/components/subscriptions/manage-payouts-button";
import { ProfileCompletenessCard } from "@/components/dashboard/profile-completeness-card";
import GettingStartedChecklist from "@/components/dashboard/getting-started-checklist";

export default async function TradespersonDashboardPage() {
  // The layout guard handles role protection. We use requireSession to get fresh user data.
  const session = await requireSession();
  if (!session.user) {
    // Should not happen due to layout guard, but good for type safety
    redirect("/login");
  }

  const user = await userService.getUserById(session.user.id);
  const quotes = await jobService.getQuotesByTradespersonId(session.user.id);

  const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;
  const pendingQuotes = quotes.filter(q => q.status === "pending").length;
  const acceptanceRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

  // Use the fresh session data which is already enriched by requireSession
  const effectiveRole = session.user.role;
  const effectiveTier = session.user.subscriptionTier ?? "basic";

  // --- Profile completeness (tradesperson only) ---
  const missing: string[] = [];
  const totalChecks = 7;
  const hasDisplayName = Boolean(user?.businessName?.trim()) || Boolean(user?.name?.trim());
  if (!hasDisplayName) missing.push("Business/trading name");
  if (!user?.profilePicture) missing.push("Profile photo");
  if (!user?.description) missing.push("About/description");
  if (!user?.specialties || user.specialties.length === 0) missing.push("Specialties");
  if (!user?.location?.town && !user?.location?.postcode) missing.push("Location");
  if (!user?.experience) missing.push("Years of experience");
  if (!user?.serviceAreas) missing.push("Service areas");
  const percent = Math.max(0, Math.min(100, Math.round(((totalChecks - missing.length) / totalChecks) * 100)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tradesperson Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "user"}!</p>
      </div>

      <GettingStartedChecklist user={user} hasQuoted={quotes.length > 0} />

      <div className="flex items-center gap-3">
        <SubscriptionBadge tier={effectiveTier} />
        {effectiveRole === "tradesperson" &&
          (effectiveTier === "basic" ? (
            <Link href="/pricing">
              <Button size="sm">Upgrade to Pro</Button>
            </Link>
          ) : (
            <ManageSubscriptionButton className="h-9" />
          ))}
      </div>

      {/* --- Complete your profile card --- */}
      <ProfileCompletenessCard
        completeness={percent}
        missingFields={missing}
        profileEditUrl="/dashboard/tradesperson/profile/edit"
        title="Complete Your Profile"
        description={`Your profile is ${percent}% complete. Finish these items to stand out in search and win more jobs.`}
      />

      {/* --- Quick Stats Section --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
            <p className="text-xs text-muted-foreground">{pendingQuotes} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedQuotes}</div>
            <p className="text-xs text-muted-foreground">Based on accepted quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">Ratio of accepted to total quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Action Cards --- */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Find New Work
            </CardTitle>
            <CardDescription>Browse the job board to find new opportunities in your service area.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/tradesperson/job-board">Go to Job Board</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Manage Your Profile
            </CardTitle>
            <CardDescription>
              Keep your business details and specialties up to date to attract customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/tradesperson/profile">View My Profile</Link>
            </Button>
          </CardContent>
        </Card>
        {/* --- THIS IS THE NEW PAYOUTS CARD --- */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Manage Payouts
            </CardTitle>
            <CardDescription>
              {user?.stripeConnectAccountId
                ? "View your Stripe dashboard to see earnings and manage your bank details."
                : "Connect with Stripe to securely receive payments directly to your bank account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManagePayoutsButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
