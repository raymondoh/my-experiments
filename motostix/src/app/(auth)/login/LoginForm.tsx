"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { AlertCircle, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type LoginFormProps = {
  next: string;
};

type LoginFormValues = {
  email: string;
  password: string;
};

const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access was denied. Please try a different account.",
  AccountNotLinked: "This account is not linked. Please sign in using the original provider.",
  CredentialsSignin: "Incorrect email or password. Please try again.",
  OAuthAccountNotLinked:
    "This e-mail is already linked to another provider. Please sign in using that provider.",
  OAuthCallback: "There was a problem signing you in with Google. Please try again.",
  SessionRequired: "Please sign in to continue."
};

function resolveErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return SIGN_IN_ERROR_MESSAGES[errorCode] ?? "We couldn't sign you in. Please try again.";
}

function LoginForm({ next }: LoginFormProps) {
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const errorParam = searchParams?.get("error");

  const errorMessage = useMemo(() => resolveErrorMessage(errorParam), [errorParam]);

  const showGuardNotice = next !== "/";

  async function handleGoogleSignIn() {
    if (isGoogleLoading || isSubmitting) {
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await signIn("google", { callbackUrl: next });
      if (result?.error) {
        console.error("Google sign-in failed", result.error);
      }
    } catch (error) {
      console.error("Google sign-in failed", error);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const onSubmit = handleSubmit(async values => {
    try {
      const result = await signIn("credentials", {
        redirect: true,
        callbackUrl: next,
        email: values.email,
        password: values.password
      });
      if (result?.error) {
        console.error("Credentials sign-in failed", result.error);
      }
    } catch (error) {
      console.error("Credentials sign-in failed", error);
    }
  });

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <input type="hidden" name="next" value={next} />

        {showGuardNotice && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please sign in to continue to your requested page.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /[^\s@]+@[^\s@]+\.[^\s@]+/,
                message: "Enter a valid email address"
              }
            })}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password", {
              required: "Password is required"
            })}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="space-y-4">
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full text-base"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to Google...
              </span>
            ) : (
              "Continue with Google"
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;

