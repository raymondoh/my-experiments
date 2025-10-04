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
