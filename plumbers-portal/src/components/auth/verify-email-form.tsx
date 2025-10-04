"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface VerifyEmailFormProps {
  token?: string;
  error?: string;
}

export function VerifyEmailForm({ token, error }: VerifyEmailFormProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  const verifyEmailWithPost = useCallback(
    async (verificationToken: string) => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: verificationToken }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully!");
          setUserRole(data.role);
          // Redirect based on role after a short delay
          setTimeout(() => {
            const redirectPath = data.redirectPath || "/dashboard";
            window.location.href = `/login?message=verified&callbackUrl=${encodeURIComponent(
              redirectPath,
            )}`;
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    },
    [],
  );

  useEffect(() => {
    if (error) {
      setStatus("error");
      switch (error) {
        case "no-token":
          setMessage("No verification token provided.");
          break;
        case "invalid-token":
          setMessage("Invalid or expired verification token.");
          break;
        case "user-not-found":
          setMessage("User not found.");
          break;
        case "verification-failed":
          setMessage("Email verification failed. Please try again.");
          break;
        default:
          setMessage("An error occurred during verification.");
      }
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    verifyEmailWithPost(token);
  }, [token, error, verifyEmailWithPost]);

  const getRedirectPath = () => {
    if (userRole === "tradesperson") {
      return "/onboarding/tradesperson";
    }
    return "/onboarding/customer";
  };

  // Loading state
  if (status === "loading") {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Email Verification
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Verifying your email address...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-accent p-4 rounded-lg border border-border text-center">
            <p className="text-muted-foreground">
              Please wait while we verify your email...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your email has been successfully verified
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <p className="text-green-600 dark:text-green-400 font-medium text-center mb-2">
              {message}
            </p>
            {userRole && (
              <p className="text-green-700 dark:text-green-500 text-sm text-center">
                Redirecting you to {userRole === "tradesperson" ? "tradesperson" : "customer"} onboarding...
              </p>
            )}
          </div>

          <div className="bg-accent p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">What&apos;s next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Complete your profile setup</li>
              <li>
                • {userRole === "tradesperson" ? "Add your service areas" : "Add your location"}
              </li>
              <li>• Start using Plumbers Portal!</li>
            </ul>
          </div>

          <Button
            onClick={() => {
              const redirectPath = getRedirectPath();
              window.location.href = `/login?message=verified&callbackUrl=${encodeURIComponent(
                redirectPath,
              )}`;
            }}
            className="w-full"
          >
            Continue to {userRole === "tradesperson" ? "Tradesperson" : "Customer"} Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-destructive rounded-lg flex items-center justify-center shadow-lg">
          <XCircle className="h-6 w-6 text-destructive-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            Verification Failed
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We couldn&apos;t verify your email address
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="bg-accent p-4 rounded-lg border border-border">
          <h4 className="font-medium text-foreground mb-2">What you can do:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check if the link has expired</li>
            <li>• Try registering again with a valid email</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => (window.location.href = "/login")}
            className="w-full"
          >
            Go to Login
          </Button>
          <Button
            onClick={() => (window.location.href = "/register")}
            variant="outline"
            className="w-full"
          >
            Register Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

