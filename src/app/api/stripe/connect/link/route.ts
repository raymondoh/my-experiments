// src/app/api/stripe/connect/link/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { stripe } from "@/lib/stripe/server";

export async function POST(_req: NextRequest) {
  const session = await requireSession();
  if (session.user.role !== "tradesperson") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const user = await userService.getUserById(session.user.id);
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const acct = await stripe.accounts.create({ type: "express", email: user.email ?? undefined });
    accountId = acct.id;
    await userService.updateUser(user.id, { stripeConnectAccountId: accountId });
  }

  const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tradesperson?connect=retry`;
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tradesperson?connect=done`;

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding"
  });

  return NextResponse.json({ url: link.url });
}
