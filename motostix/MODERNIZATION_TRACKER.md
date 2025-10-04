# Motostix Modernization Tracker

This tracker will be updated as each step is completed.

## Repository Audit
- [ ] Review Plumbers Portal reference to catalog required architectural patterns.
- [ ] Map current Motostix directories against target src/app structure.
- [ ] Identify legacy modules slated for removal or refactor.
- [ ] Document environment variables and secrets currently in use.
- [ ] Note outstanding technical debt or blockers impacting modernization.

## App Router & Layout
- [ ] Scaffold src/app with RootLayout mirroring Plumbers Portal provider wiring.
- [ ] Implement global error and not-found boundaries in alignment with reference app.
- [ ] Migrate legacy pages/routes into App Router server components.
- [ ] Establish shared loading states and dynamic rendering flags where needed.
- [ ] Verify metadata propagation through layout.tsx and page-level exports.

## Configuration & Metadata
- [ ] Port siteConfig pattern for navigation, SEO, and marketing content.
- [ ] Centralize runtime metadata defaults and OG tags under shared config.
- [ ] Mirror getAppMode helper with memoization for runtime mode detection.
- [ ] Validate environment variables using Zod schemas for server and client.
- [ ] Update marketing pages to consume centralized configuration sources.

## Services Layer
- [ ] Create lib/services directory structure based on Plumbers Portal modules.
- [ ] Implement data access services encapsulating Firebase and Stripe usage.
- [ ] Add pagination and caching helpers consistent with reference patterns.
- [ ] Introduce mock/hybrid data adapters driven by runtime mode helper.
- [ ] Write unit tests covering service contracts and edge cases.

## Authentication
- [ ] Adopt NextAuth v5 configuration with Google and credentials providers.
- [ ] Implement session and JWT callbacks enriching role and permissions data.
- [ ] Configure role-aware redirects and access control guards.
- [ ] Replace legacy auth handlers with shared server actions.
- [ ] Sync client providers to ensure session context is available app-wide.

## UI & Styling
- [ ] Import Radix UI + shadcn/ui component library with CVA variants.
- [ ] Align Tailwind config and design tokens with reference design system.
- [ ] Replace legacy components with standardized UI primitives.
- [ ] Audit forms to leverage typed server actions and shared validation.
- [ ] Ensure accessibility checks align with Radix best practices.

## Tooling & Testing
- [ ] Update package.json scripts to match lint, type-check, and test commands.
- [ ] Configure Jest/RTL setup consistent with Plumbers Portal baselines.
- [ ] Align ESLint, Prettier, and TypeScript configs with reference repo.
- [ ] Add CI workflows for build, lint, and test coverage gates.
- [ ] Document new tooling usage in README or contributor guides.

## Deployment Readiness
- [ ] Validate Firebase and hosting settings for new architecture.
- [ ] Review environment variable management for production and staging.
- [ ] Run full build and integration tests to confirm deployment success.
- [ ] Prepare migration notes covering data backfills and rollout steps.
- [ ] Coordinate monitoring/logging updates for modernized stack.

## Repository Audit Results
### Routes Overview
- **Global shell**
  - `/layout.tsx` – Root HTML wrapper delegating rendering to the client-side provider stack and loading global styles.
  - `/client-layout.tsx` – Client-only layout wiring session, search, cart, likes providers plus header, footer, search modal, and cart sidebar around page content.
  - `/page.tsx` (`/`) – Force-dynamic marketing homepage assembling hero, category tiles, and multiple product carousels from Firebase data sources.
  - `/error.tsx` – Client error boundary offering retry/navigation when render failures occur.
  - `/not-found.tsx` – Static 404 screen with call-to-action back to home.
  - `/[...slug]/page.tsx` – Auth-aware catch-all 404 that optionally points users to dashboards based on session role.
  - `/not-authorized/page.tsx` – Branded 403 page encouraging users to sign in or return home.
- **Storefront (`/(root)`)**
  - `/products/page.tsx` – Server component list page coordinating filters, category cards, and grid results from Firebase queries.
  - `/about/page.tsx` – Marketing story page with placeholder product carousel data and narrative copy.
  - `/contact/page.tsx` – Contact information and FAQ section with embedded contact form component.
  - `/search/page.tsx` – Client redirector that forwards search queries to `/products` with pre-populated filters.
  - `/returns-policy`, `/terms-of-service`, `/privacy-policy`, `/shipping-policy` – Static policy pages rendered via shared `PageHeader` and prose content.
- **Authentication (`/(auth)`)**
  - `/(auth)/layout.tsx` – Client layout wrapping auth flows in the theme provider and centered card shell.
  - `/(auth)/login/page.tsx` (`/login`) – Sign-in screen orchestrating login form, metadata, and login redirect messaging.
  - `/(auth)/register/page.tsx` (`/register`) – Account creation flow with register form and metadata.
  - `/(auth)/forgot-password/page.tsx`, `/(auth)/reset-password/page.tsx` – Password recovery request and reset experiences using shared auth headers.
  - `/(auth)/verify-email/page.tsx`, `/(auth)/resend-verification/page.tsx`, `/(auth)/verify-success/page.tsx` – Email verification flows covering code entry, resend, and success confirmation.
  - `/(auth)/auth-action/page.tsx` – Client handler that routes Firebase auth action modes to the proper page variants.
- **Dashboard shell (`/(dashboard)`)**
  - `/(dashboard)/layout.tsx` – Auth-gated dashboard shell managing sidebar state, role routing, and metadata for private pages.
  - `/(dashboard)/user/layout.tsx`, `/(dashboard)/admin/layout.tsx` – Role-specific layout guards layering additional metadata/security for user and admin spaces.
  - `/(dashboard)/user/page.tsx` (`/user`) – Account overview combining Firestore profile data and recent activity preview.
  - `/(dashboard)/user/profile`, `/settings`, `/orders`, `/likes`, `/activity`, `/data-privacy` – Dedicated user subpages for profile editing, security preferences, order history, liked products, activity log, and privacy tools.
  - `/(dashboard)/admin/page.tsx` (`/admin`) – Admin overview aggregating system stats and recent activity with Firestore queries.
  - `/(dashboard)/admin/products`, `/orders`, `/users`, `/activity`, `/settings`, `/profile`, `/not-authorized` – Admin management views for catalog, orders, users, audit logs, admin preferences, profile, and restricted-access messaging.
- **Commerce**
  - `/checkout/page.tsx` – Checkout view wrapping the Stripe Elements provider around the checkout form.
  - `/checkout/success/page.tsx` – Order confirmation screen that suspends a client component to fetch session details.
- **Debug utilities (`/debug/*`)**
  - `/debug/homepage-data`, `/sales-product`, `/fix-missing-onsale-field`, `/products-schema`, `/form-comparison`, `/test-sale-carousel` – Internal troubleshooting dashboards for Firebase product data, schema validation, carousel behavior, and admin tooling gaps.

### API Endpoints
- `/api/activity-logs` (GET) – Surfaces recent activity feed entries for dashboards with optional pagination cursor support.
- `/api/categories` (GET) – Returns product categories from Firebase admin utilities for storefront filtering.
- `/api/contact` (POST) – Validates contact form submissions and sends emails via Resend.
- `/api/likes` (GET/POST/DELETE) – Authenticated endpoints for fetching, adding, and removing liked product IDs tied to the current user.
- `/api/likes/products` (GET) – Returns full liked product documents for the signed-in user.
- `/api/products` (GET/POST) – Lists products with extensive query filters and allows admins to create new items, logging activity on success/failure.
- `/api/products/[id]` (GET/PUT/DELETE) – Handles individual product retrieval and admin updates with validation, logging, and cache revalidation.
- `/api/orders` (GET) – Authenticated endpoint returning the requesting user’s orders via server action helper.
- `/api/ratings` (POST) – Persists product review ratings and updates aggregates in Firestore inside a transaction.
- `/api/users` (GET) – Admin user listing that serializes fetched accounts for management interfaces.
- `/api/checkout` (POST) – Creates Stripe Checkout sessions from cart payloads after verifying authentication.
- `/api/create-payment-intent` (POST) – Builds Stripe PaymentIntents server-side using secure product pricing and shipping calculations.
- `/api/webhooks/stripe` (POST) – Processes Stripe webhook events to create orders and dispatch emails, verifying signatures and constructing order summaries.
- `/api/mailchimp/subscribe` (POST) – Adds subscribers to the configured Mailchimp list with validation and duplicate handling.
- `/api/upload` (POST) – Authenticated file upload handler delegating to the storage service abstraction.
- `/api/auth/[...nextauth]` (GET/POST) – Exposes NextAuth handler endpoints configured in `src/auth.ts`.

### Environment Variables
| Variable(s) | Usage |
| --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements loads the publishable key for client-side checkout forms. |
| `STRIPE_SECRET_KEY` | Server routes create checkout sessions, payment intents, and webhook handlers using the Stripe secret key. |
| `STRIPE_WEBHOOK_SECRET` | Validates incoming Stripe webhook signatures before processing events. |
| `RESEND_API_KEY` | Powers transactional and contact emails through the Resend SDK. |
| `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID` | Configure the marketing subscription endpoint against Mailchimp audiences. |
| `NEXT_PUBLIC_APP_URL` | Builds email action links for auth flows and order confirmations. |
| `SITE_URL`, `OG_IMAGE_URL`, `SITE_TWITTER` | Provide site-wide metadata defaults for marketing pages and SEO tags. |
| `NODE_ENV` | Used for environment branching in config, middleware logging, and NextAuth debug mode. |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` | Initialize Firebase Admin SDK for Firestore/Auth/Storage access on the server. |
| `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET` | Configure the Google OAuth provider within NextAuth. |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Bootstrap the client-side Firebase SDK with runtime validation of required keys. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional Upstash Redis credentials to enable API rate limiting helpers. |

### External Integrations
- **Firebase Admin & Client SDKs** – Firestore, Auth, and Storage access layers for both server and client contexts.
- **NextAuth.js** – Authentication pipeline with Google OAuth, credentials flow, and Firestore adapter customization.
- **Stripe** – Checkout sessions, PaymentIntents, and webhook-based order processing for commerce flows.
- **Resend** – Outbound email delivery for contact form submissions and order confirmations.
- **Mailchimp Marketing API** – Newsletter subscription endpoint powering audience management.
- **Upstash Redis** – Rate limiting utility that activates when Upstash credentials are present.

### Technical Debt / Improvement Notes
- Root layout metadata is entirely commented out, indicating site-wide SEO defaults are not wired into the App Router yet.
- Dashboard server components execute Firestore queries directly and emit extensive console logging, highlighting the need for a centralized service layer and structured logging strategy.
- Marketing pages still rely on placeholder copy and hard-coded product data, underscoring the need for real content sourcing and shared product utilities.
- Multiple debug-only routes live under `/debug`, exposing internal tooling in production builds and bypassing authentication controls.
- API handlers manage Firebase operations and validation inline, duplicating logic that should reside within dedicated service modules.
- Environment handling throws runtime errors and lacks schema-based validation, motivating the adoption of a centralized env loader similar to the target architecture.
