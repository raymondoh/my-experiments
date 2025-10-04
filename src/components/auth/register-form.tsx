"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";
import { Wrench, User, ArrowRight, Mail, AlertCircle, Eye, EyeOff, Check } from "lucide-react";
import { registerAction, googleSignInAction, type RegisterFormState } from "@/actions/auth/register";

export function RegisterForm({ defaultRole = "customer" }: { defaultRole?: string }) {
  // State for the selected role, used in the hidden form input
  const [userType, setUserType] = useState(defaultRole);

  // State for the visually active tab
  const [activeTab, setActiveTab] = useState(defaultRole);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [state, formAction, isPending] = useActionState<RegisterFormState, FormData>(registerAction, {
    errors: {},
    success: false
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await googleSignInAction();
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const tabTriggerStyles = [
    "flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm rounded-md border transition-all",
    "w-full whitespace-normal break-words text-center leading-snug",
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary",
    "data-[state=active]:ring-2 data-[state=active]:ring-primary/30",
    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border",
    "data-[state=inactive]:hover:bg-accent/50"
  ].join(" ");

  const ctaLabel = userType === "tradesperson" ? "Create Tradesperson Account" : "Create Customer Account";

  // Success screen
  if (state.success) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
            <CardDescription className="text-muted-foreground">We&apos;ve sent you a verification link</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Please check your email and click the verification link to complete your account setup.
            </p>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Didn&apos;t receive it? Check spam or{" "}
            <Button variant="link" className="p-0 h-auto text-xs" asChild>
              <Link href="/resend-verification">resend email</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
          <Wrench className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Join Plumbers Portal</CardTitle>
          <CardDescription className="text-muted-foreground">Get started in less than 2 minutes</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.errors?._form && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.errors._form[0]}</AlertDescription>
          </Alert>
        )}

        <Button
          variant="outline"
          type="button"
          disabled={isGoogleLoading || isPending}
          onClick={handleGoogleSignIn}
          className="w-full bg-transparent">
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="space-y-2 pb-4">
          <Label htmlFor="accountType" className="text-sm">
            I’m signing up as{" "}
            <span aria-hidden="true" className="text-muted-foreground">
              [select one]
            </span>
          </Label>

          <Tabs
            value={activeTab}
            onValueChange={value => {
              setActiveTab(value);
              setUserType(value);
            }}
            defaultValue="customer"
            className="w-full">
            <TabsList className="grid w-full grid-cols-2 items-stretch p-1 bg-muted/30 rounded-lg gap-2">
              <TabsTrigger value="customer" className={tabTriggerStyles}>
                <User className={activeTab === "customer" ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-60"} />
                <span>I need a plumber</span>
                {activeTab === "customer" && <Check className="h-5 w-5" />}
              </TabsTrigger>
              <TabsTrigger value="tradesperson" className={tabTriggerStyles}>
                <Wrench className={activeTab === "tradesperson" ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-60"} />
                <span>I am a plumber</span>
                {activeTab === "tradesperson" && <Check className="h-5 w-5" />}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={userType} />

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required disabled={isPending} autoComplete="name" />
            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required disabled={isPending} autoComplete="email" />
            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isPending}
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={isPending}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {state.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
            )}
          </div>
          {/* --- START: New Terms and Conditions Checkbox --- */}
          <div className="flex items-start space-x-3 pt-2">
            {/* The name="terms" attribute is what sends the value to the server action */}
            <Checkbox id="terms" name="terms" />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the
                <Button variant="link" asChild className="p-0 h-auto ml-1">
                  <Link href="/terms-of-service" target="_blank">
                    Terms of Service
                  </Link>
                </Button>
                and
                <Button variant="link" asChild className="p-0 h-auto ml-1">
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </Button>
                .
              </label>
              {state.errors?.terms && <p className="text-sm text-destructive">{state.errors.terms[0]}</p>}
            </div>
          </div>
          {/* --- END: New Terms and Conditions Checkbox --- */}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center space-y-3 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
