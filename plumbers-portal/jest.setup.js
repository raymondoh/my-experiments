// jest.setup.js
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.APP_MODE = "mock";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.STRIPE_SUCCESS_URL = "http://localhost:3000/success";
process.env.STRIPE_CANCEL_URL = "http://localhost:3000/cancel";
process.env.STRIPE_PLATFORM_FEE_BPS = "100";
