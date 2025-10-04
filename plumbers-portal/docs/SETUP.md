# 🚀 Setup Guide

This guide will walk you through setting up the Next.js Authentication Boilerplate from scratch. Follow these steps to get your authentication system running locally.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18.18 or later** - [Download here](https://nodejs.org/)
- **npm, yarn, or pnpm** - Package manager
- **Git** - Version control
- **Code editor** - VS Code recommended
- **Firebase account** - [Create here](https://firebase.google.com/) (optional for mock mode)
- **Resend account** - [Sign up here](https://resend.com/) (optional for mock mode)

## 🏁 Quick Setup (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd your-auth-app

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Stripe Price to Tier Mapping

Stripe price IDs are mapped to internal subscription tiers through the `PRICE_TO_TIER` helper. Set the following environment variables to link your Stripe prices to the `pro` and `business` tiers:

- `STRIPE_PRO_PRICE_ID` and `STRIPE_PRO_PRICE_ID_YEARLY`
- `STRIPE_BUSINESS_PRICE_ID` and `STRIPE_BUSINESS_PRICE_ID_YEARLY`

Checkout sessions use these values to resolve which tier a customer is subscribing to. Missing or incorrect IDs will cause checkout requests to fail.
