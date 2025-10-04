# 🚀 Firebase Starter App

A modern, production-ready boilerplate built with Next.js 15, Firebase, TailwindCSS, and a modular, scalable architecture.  
Designed for rapid full-stack development — secure, flexible, and future-proof.

---

## ✨ Features

- Next.js 15 App Router
- Server Actions + Server Components
- Firebase Authentication & Firestore Integration
- TailwindCSS + shadcn/ui components
- Google OAuth + Email/Password Authentication
- Robust form handling and validation
- Toast notifications for UX feedback
- Skeleton loaders and dynamic UI states
- Secure file uploads to Firebase Storage
- Reusable component library and utilities
- Modular folder structure for scalability
- Ready for production deployment (Vercel or custom hosting)

---

## 🛠️ Project Structure

Key folders to know:

| Folder            | Purpose                                                       |
| :---------------- | :------------------------------------------------------------ |
| `/src/actions`    | Server actions (auth, products, users, etc.)                  |
| `/src/app`        | Main Next.js pages, layouts, routes                           |
| `/src/components` | UI components (form elements, dialogs, cards, etc.)           |
| `/src/firebase`   | Firebase Admin + Client SDK setup                             |
| `/src/lib`        | Utility functions (date helpers, API handlers, etc.)          |
| `/src/providers`  | Context providers (SessionProvider, ThemeProvider, etc.)      |
| `/src/schemas`    | Validation schemas (e.g., with Zod)                           |
| `/src/types`      | TypeScript types for users, products, auth, etc.              |
| `/src/utils`      | Utility helpers (e.g., file uploads, Firebase error handling) |

---

## ⚙️ Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
# then edit .env.local
```

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
SITE_URL=http://localhost:3000
SITE_TWITTER=https://twitter.com/example
OG_IMAGE_URL=http://localhost:3000/og.jpg

npm run dev

Technologies Used
Next.js 15 (App Router, Server Actions, RSC)

TailwindCSS + shadcn/ui

Firebase Authentication, Firestore, Storage

Next-Auth (for credential and OAuth authentication)

Zod (optional for form validation)

Sonner (for toast notifications)

Lucide Icons (for UI icons)

TypeScript (full type safety)

📋 Notes
Firebase Emulator Suite setup is recommended for local testing.

Production-ready best practices applied (auth flows, error handling, uploads).

Easily extendable for e-commerce, admin dashboards, SaaS, or community apps.

🙏 Acknowledgments
Big thanks to the Next.js, Firebase, and open-source communities
for the tools and inspiration that made this starter possible.

---

## Environment Variables

Environment configuration lives in [`.env.example`](./.env.example). Copy it to `.env.local` and replace each placeholder with the values from your Firebase, Stripe, Google Cloud, and email providers.

| Scope | Key(s) | Notes |
| --- | --- | --- |
| Client (`NEXT_PUBLIC_*`) | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, Firebase web config | Safe to expose to the browser. Use the Firebase Web App settings and Stripe publishable key. |
| Server | Stripe + Firebase Admin credentials | Keep private. The Firebase Admin key must retain escaped newlines (e.g. `\n`) in `.env.local`. |
| Server | NextAuth Google OAuth | Create OAuth credentials in Google Cloud and add your authorized redirect URI (e.g. `http://localhost:3000/api/auth/callback/google`). |
| Server | Resend + Mailchimp | Required for transactional (Resend) and marketing (Mailchimp) email flows. |
| Optional | Upstash Redis | Leave commented unless caching/queues are enabled. |
| SEO | `SITE_URL`, `OG_IMAGE_URL`, `SITE_TWITTER` | Set for production to generate accurate meta tags. |

Run `cp .env.example .env.local` to start from the documented template.

## Local Development (Firebase Emulator)

1. Install the Firebase CLI once: `npm install -g firebase-tools` and authenticate with `firebase login`.
2. Install project dependencies: `pnpm install`.
3. In one terminal, start the Firebase emulators for Auth and Firestore:
   ```bash
   firebase emulators:start --only auth,firestore
   ```
   (If you add Storage, include `--only auth,firestore,storage`).
4. In another terminal, run the Next.js dev server: `pnpm dev`.

When the emulators are running, add the following overrides to `.env.local` so both the Admin SDK and the browser SDK talk to the local services:

```bash
# Admin SDK overrides
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 # optional
```

The Firebase Web SDK does not automatically read these host variables. In `src/lib/firebase` make sure you call `connectAuthEmulator`, `connectFirestoreEmulator`, and related helpers when `process.env.NODE_ENV !== "production"` or behind a custom flag.

> **Tip:** The repo does not ship with seed scripts. Use the Firebase Emulator UI (http://localhost:4000) or `firebase firestore:import` to load sample data.

## Stripe Webhooks (Dev)

1. Install and log in to the Stripe CLI: `brew install stripe` (or download from Stripe) and `stripe login`.
2. Forward events to your local API route:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Copy the webhook signing secret displayed by the CLI and place it in `STRIPE_WEBHOOK_SECRET` in `.env.local`.
4. Use your test keys (`sk_test_*` and `pk_test_*`) while developing. The CLI will replay events each time you run the listener.

### Checkout success flow testing

The checkout success page now verifies the Stripe session server-side and fetches the synced order from Firestore. To exercise the flow end-to-end:

1. Start the Stripe CLI forwarding events so webhook events reach your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Create a test Checkout Session against the `/api/checkout` endpoint (replace the cookie and product payload with values valid for your environment):
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=<your-session-token>" \
     -d '{
       "items": [
         {
           "product": {
             "id": "demo-product",
             "name": "Demo Moto Helmet",
             "price": 199.99,
             "description": "Track-ready protection",
             "image": "https://example.com/helmet.jpg",
             "onSale": false
           },
           "quantity": 1
         }
       ]
     }'
   ```
3. After Stripe redirects you back, open the URL `http://localhost:3000/checkout/success?session_id=<CHECKOUT_SESSION_ID>` to see the confirmed order summary.

## Email (Resend)

Create a project in the [Resend dashboard](https://resend.com) and verify your sending domain. Once verified, generate an API key and save it as `RESEND_API_KEY`. You can add test email addresses in Resend to avoid sending to real users during development.

## Newsletter (Mailchimp)

Generate an API key from the [Mailchimp dashboard](https://usX.admin.mailchimp.com/account/api/) and note the `usX` prefix—it becomes your `MAILCHIMP_SERVER_PREFIX`. Choose or create an audience list and copy its ID (under *Audience settings > Audience name and defaults*) into `MAILCHIMP_AUDIENCE_ID`.
