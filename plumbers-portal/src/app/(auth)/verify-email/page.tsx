// src/app/(auth)/verify-email/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

type Status = "loading" | "success" | "error" | "expired";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") ?? "";
  const continueUrl = searchParams.get("continue"); // optional

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const [email, setEmail] = useState(emailFromQuery);

  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const successRedirectTarget = useMemo(
    () =>
      continueUrl
        ? `/login?message=verified&callbackUrl=${encodeURIComponent(continueUrl)}`
        : "/login?message=verified",
    [continueUrl]
  );

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your link.");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg: string = data?.error ?? "Verification failed. The link may be invalid or expired.";

        // Heuristic: treat any "expired" text as an expired token case.
        if (String(errMsg).toLowerCase().includes("expired")) {
          setStatus("expired");
          setMessage("Your verification link has expired. You can request a new one below.");
        } else {
          setStatus("error");
          setMessage(errMsg);
        }
        return;
      }

      setStatus("success");
      setMessage(data?.message || "Email verified successfully! Redirecting...");

      // Redirect shortly after success
      const t = setTimeout(() => {
        router.push(successRedirectTarget);
      }, 2000);
      return () => clearTimeout(t);
    } catch (e) {
      setStatus("error");
      setMessage("An unknown error occurred while verifying your email.");
    }
  }, [token, router, successRedirectTarget]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  async function handleResend() {
    setIsResending(true);
    setResendFeedback(null);
    setResendError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store"
      });

      // API intentionally returns a generic success message to avoid enumeration.
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; message?: string };
        setResendFeedback(data?.message || "If an account exists for that email, we've sent a verification link.");
      } else {
        setResendError("Something went wrong. Please try again in a moment.");
      }
    } catch {
      setResendError("Something went wrong. Please try again in a moment.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />}
          {status === "success" && <CheckCircle className="h-8 w-8 mx-auto text-green-500" />}
          {(status === "error" || status === "expired") && <XCircle className="h-8 w-8 mx-auto text-destructive" />}

          <p className="text-muted-foreground">{message}</p>

          {/* Resend flow for expired/invalid tokens */}
          {(status === "expired" || status === "error") && (
            <div className="space-y-3 text-left">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button type="button" className="w-full" onClick={handleResend} disabled={isResending || !email}>
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>

              {resendFeedback && <p className="text-sm text-foreground/80">{resendFeedback}</p>}
              {resendError && <p className="text-sm text-destructive">{resendError}</p>}
            </div>
          )}

          {/* Manual nav */}
          {status !== "loading" && (
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
