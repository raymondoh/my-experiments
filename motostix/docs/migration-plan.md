# Motostix Modernization Plan

This document captures the high-level tasks and architectural checkpoints required to align Motostix with the Plumbers Portal reference implementation (Next.js 15 App Router, TypeScript, NextAuth.js v5, Firebase Firestore, Tailwind CSS, Radix UI + shadcn/ui, Jest/RTL).

## 1. Repository Audit
- [ ] Inventory existing routes (pages directory, API routes) and map to new `src/app` tree.
- [ ] Identify legacy Firebase/Stripe interactions that need refactoring into modular services.
- [ ] Document environment variables currently in use.

## 2. App Router & Layout Scaffolding
- [ ] Move Next.js entry under `src/app` with RootLayout composed of theme, auth, favorites providers.
- [ ] Introduce route-level `metadata`, `error.tsx`, and `loading.tsx` mirroring Plumbers Portal conventions.
- [ ] Convert top-level navigation and marketing pages to server components.

## 3. Configuration & Metadata
- [ ] Implement shared `siteConfig` (branding, nav, SEO defaults) consumed by layout, marketing, and metadata exports.
- [ ] Normalize runtime mode detection via memoized `getAppMode` helper.
- [ ] Add Zod-backed `env` module validating required variables.

## 4. Services Layer
- [ ] Create `lib/services/` with domain-specific modules (user, catalog, cart, checkout, favorites).
- [ ] Wrap Firebase/Stripe SDK setup in singleton factories, supporting mock/hybrid modes per environment.
- [ ] Provide typed interfaces for data access and pagination utilities.

## 5. Authentication
- [ ] Adopt NextAuth v5 with Google + credentials providers, role-aware redirects, and JWT enrichment.
- [ ] Introduce server actions for login/register flows replacing form handlers.
- [ ] Sync session hooks with shared providers for client components.

## 6. UI & Styling
- [ ] Port Radix-based component library (buttons, inputs, cards, sheets) with CVA utilities.
- [ ] Align Tailwind config, theme tokens, and global styles with Plumbers Portal setup.
- [ ] Update marketing pages to use shared UI primitives.

## 7. Tooling & Testing
- [ ] Update `package.json` scripts (lint, test, typecheck, format) to match reference repo.
- [ ] Configure Jest + RTL for App Router + server actions coverage.
- [ ] Integrate lint-staged / Husky if required for commit hygiene.

## 8. Deployment Readiness
- [ ] Ensure `next.config.ts` reflects experimental App Router settings.
- [ ] Validate Firebase emulator configuration for local development.
- [ ] Provide `.env.example` with updated variable list.

## 9. Migration Notes
- [ ] Communicate breaking changes (route paths, auth flows) to stakeholders.
- [ ] Document fallback plan for phased rollout if full migration is staged.
- [ ] Track follow-ups in issue tracker (e.g., QA of server actions, Stripe revalidation).

---

_Last updated: 2025-10-04_
