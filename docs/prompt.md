# Plumbers Portal – Project Brief (Source of Truth)

## Core

- Next.js 15 (app router), TypeScript, Firebase (Auth/Admin/Firestore), NextAuth, shadcn/ui, Stripe.
- Roles: customer | tradesperson | admin. Subscription tiers: basic | pro | business.

## Non-negotiables

- Server is authoritative: API routes & server components guard with requireSession()/requireRole().
- Stripe imports from `@/lib/stripe/server`. Webhook IDs → Firestore, no client trust.
- Basic tradespeople can submit quotes but are **capped at 5/month**, enforced in `jobService.createQuote()`. UI shows upsell; API enforces.
- Any new API route follows the established import/guard patterns above.

## Payments

- **Subscriptions (tradespeople upgrades):** Stripe Checkout + Webhooks (`checkout.session.completed`, `customer.subscription.*`) → set `subscriptionTier`, `subscriptionStatus`, `stripeCustomerId`.
- **Marketplace (customer↔tradesperson):** `/api/payments/checkout` creates PaymentIntent (deposit/final) with metadata {jobId, payerUserId, paymentType}. Optional `/api/payments/capture` if manual capture is used.

## Data touchpoints

- Users: role, subscriptionTier, subscriptionStatus, stripeCustomerId, monthlyQuotesUsed, quoteResetDate.
- Jobs: depositPaymentIntentId?, finalPaymentIntentId?, quoteCount, status.

## DX

- zod for input, friendly errors, `no-store` on mutating routes.
- Keep decisions in `docs/adr.md` (one-liners).
  EOF

# 3) docs/todo.md

cat > docs/todo.md <<'EOF'

# Backlog (Prioritized)

## P0 – Payments (Marketplace)

- [ ] Finalize `/api/payments/checkout` (with strong job ownership checks).
- [ ] (If needed) `/api/payments/capture` role/ownership rules.
- [ ] Customer-side UI: pay deposit & pay final flows (Job detail page).
- [ ] Tradesperson/customer receipts (email + in-app notifications).

## P0 – Subscriptions

- [ ] Confirm `/api/stripe/webhook` env mappings (PRICE_TO_TIER).
- [ ] Upgrade UI: pass {userId,tier} metadata to Checkout Session.
- [ ] Post-checkout refresh of session or rely on fresh Firestore fetch.

## P1 – Quotes Limit

- [ ] Verify `createQuote()` monthly reset & cap paths (Basic=5).
- [ ] Add lightweight unit test for limit branches.

## P1 – Security & Admin

- [ ] Ensure all admin routes & admin-only UI actions use `requireRole("admin")`.
- [ ] (Optional) Admin-only payment capture endpoint (document when added).

## P2 – UX Polish

- [ ] Show remaining quotes this month to Basic tradespeople.
- [ ] Better error toasts for payment/quote-limit/server errors.

## P3 – Ops

- [ ] `.env.example` kept in sync, no secrets in repo.
- [ ] Write “How to test Stripe (test mode)” doc.

(Keep brief; move completed items to bottom with date.)
EOF

# 4) docs/payments.md

cat > docs/payments.md <<'EOF'

# Payments

## 1) Subscriptions (Tradespeople Upgrades)

- Create checkout session with metadata { userId, tier }.
- Webhook:
  - `checkout.session.completed`: set stripeCustomerId, subscriptionStatus=active, and if tier resolved → subscriptionTier.
  - `customer.subscription.updated/created`: update subscriptionStatus, infer new tier from price → subscriptionTier.
  - `customer.subscription.deleted`: downgrade subscriptionTier → "basic"; set subscriptionStatus.

## 2) Marketplace (Customer ↔ Tradesperson)

- `POST /api/payments/checkout`:
  - Body: { jobId, amount (pence), type: "deposit"|"final" }.
  - Guard: requireSession(); ensure the caller is authorized for that job (typically the job’s customer).
  - Create PaymentIntent (automatic payment methods). Save id on Job: `depositPaymentIntentId` or `finalPaymentIntentId`.
- `POST /api/payments/capture` (optional/manual):
  - Body: { paymentIntentId }. Guard: requireSession(); ensure caller is allowed to capture.
- Webhook (optional extensions):
  - `payment_intent.succeeded`: mark job milestone paid.
  - `charge.refunded`: annotate job timeline / notify both sides.

### Testing (Stripe Test Mode)

- Use 4242 4242 4242 4242 etc.
- Watch events in dashboard; verify Firestore writes (`Users.subscriptionTier`, `Jobs.depositPaymentIntentId`).
  EOF

# 5) docs/limits.md

cat > docs/limits.md <<'EOF'

# Quote Limits

- Basic tradespeople: 5 quotes per calendar month.
- Enforced exclusively in `jobService.createQuote()`:
  - On month rollover (or if `quoteResetDate` passed), reset `monthlyQuotesUsed` and set next month’s `quoteResetDate` (1st of next month @ 00:00).
  - If over limit → throw friendly error string containing “quote limit”.
- UI: allow submit → show friendly 403 with upgrade CTA.
  EOF

# 6) docs/security.md

cat > docs/security.md <<'EOF'

# Security & API Patterns

- All mutating routes: `requireSession()` early; then role/ownership checks.
- Admin-only: `requireRole("admin")` (or equivalent) in the route itself.
- Validate with zod; return typed JSON; `no-store` for responses that mustn’t cache.
- Stripe: import from `@/lib/stripe/server`; verify webhook signatures with secret.
- Never trust client role/tier; fetch fresh from Firestore when it matters.
- New API routes must follow these imports/patterns.
  EOF

# 7) (optional) append to .env.example

cat >> .env.example <<'EOF'

# --- Stripe (test) ---

STRIPE*SECRET_KEY=sk_test***_
STRIPE*WEBHOOK_SECRET=whsec*_**
STRIPE*PRO_PRICE_ID=price***_
STRIPE*PRO_PRICE_ID_YEARLY=price*_**
STRIPE*BUSINESS_PRICE_ID=price***_
STRIPE*BUSINESS_PRICE_ID_YEARLY=price*_**
EOF
