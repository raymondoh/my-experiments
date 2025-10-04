# Troubleshooting Guide

This guide helps you resolve common issues you might encounter while using the authentication boilerplate.

## 🚨 Common Issues

### 1. Application Won't Start

#### Error: `Module not found: Can't resolve '@/components/...'`

**Cause**: TypeScript path mapping not configured correctly.

**Solution**:
\`\`\`json
// tsconfig.json - Ensure this configuration exists
{
"compilerOptions": {
"baseUrl": ".",
"paths": {
"@/_": ["./src/_"]
}
}
}
\`\`\`

#### Error: `listen EADDRINUSE: address already in use :::3000`

**Cause**: Port 3000 is already in use.

**Solutions**:
\`\`\`bash

# Option 1: Use different port

npm run dev -- -p 3001

# Option 2: Kill process using port 3000

lsof -ti:3000 | xargs kill -9

# Option 3: Find and stop the process

npx kill-port 3000
\`\`\`

#### Error: `Cannot find module 'next/font/google'`

**Cause**: Using older Next.js version.

**Solution**:
\`\`\`bash

# Update to Next.js 15

npm install next@latest react@latest react-dom@latest

# Or use legacy import

import { Inter } from '@next/font/google'
\`\`\`

### 2. Authentication Issues

#### Error: `NextAuth configuration error`

**Cause**: Missing or incorrect environment variables.

**Solution**:
\`\`\`bash

# Check .env.local file exists and contains:

NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Generate a secure secret

openssl rand -base64 32
\`\`\`

#### Error: `Session is null after login`

**Cause**: Session configuration or callback issues.

**Solutions**:

1. Check NextAuth configuration:
   \`\`\`typescript
   // src/auth.ts
   export const authConfig = {
   session: {
   strategy: "jwt", // Ensure this is set
   },
   callbacks: {
   async session({ session, token }) {
   // Ensure session callback returns session
   return session
   }
   }
   }
   \`\`\`

2. Clear browser cookies and try again
3. Check browser developer tools for errors

#### Error: `User not found` during login

**Cause**: User doesn't exist in the database.

**Solutions**:

1. **Mock Mode**: Check console logs for user creation
2. **Firebase Mode**: Check Firebase Console → Authentication → Users
3. Register the user first before attempting login

### 3. Firebase Issues

#### Error: `Firebase Admin not initialized`

**Cause**: Missing or incorrect Firebase environment variables.

**Solution**:
\`\`\`bash

# Check .env.local contains all required Firebase variables:

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Ensure private key format is correct (with \n characters)

\`\`\`

#### Error: `Permission denied` in Firestore

**Cause**: Firestore security rules are too restrictive.

**Solution**:
\`\`\`javascript
// Update Firestore rules in Firebase Console
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// Allow authenticated users to read/write their own data
match /users/{userId} {
allow read, write: if request.auth != null && request.auth.uid == userId;
}
}
}
\`\`\`

#### Error: `Firebase project not found`

**Cause**: Incorrect project ID or project doesn't exist.

**Solutions**:

1. Verify project ID in Firebase Console
2. Check `FIREBASE_PROJECT_ID` in environment variables
3. Ensure Firebase project is active

### 4. Email Issues

#### Error: `You can only send testing emails to your own email address`

**Cause**: Resend domain not verified (expected behavior).

**Solutions**:

1. **For Testing**: Use your registered Resend email address
2. **For Production**: Verify your domain in Resend dashboard
3. **Quick Fix**: Test with `raymondmhylton@gmail.com` (your registered email)

#### Error: `Invalid API key` (Resend)

**Cause**: Missing or incorrect Resend API key.

**Solution**:
\`\`\`bash

# Check .env.local contains:

RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev

# Ensure API key starts with 're\_'

# Regenerate key in Resend dashboard if needed

\`\`\`

#### Error: `Failed to send verification email`

**Cause**: Various email service issues.

**Solutions**:

1. Check console logs for detailed error messages
2. Verify Resend API key is correct
3. Check internet connection
4. Verify email address format

### 5. Build and Deployment Issues

#### Error: `Type error: Cannot find module` during build

**Cause**: TypeScript configuration or missing dependencies.

**Solutions**:
\`\`\`bash

# Install missing dependencies

npm install

# Check TypeScript configuration

npm run type-check

# Clear Next.js cache

rm -rf .next
npm run build
\`\`\`

#### Error: `Environment variables not available in production`

**Cause**: Environment variables not configured in deployment platform.

**Solutions**:

1. **Vercel**: Add variables in Project Settings → Environment Variables
2. **Netlify**: Add in Site Settings → Environment Variables
3. **Railway**: Add in Project → Variables
4. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access

#### Error: `Firebase functions not working in production`

**Cause**: Firebase Admin SDK initialization issues.

**Solution**:
\`\`\`typescript
// Ensure build-safe initialization
if (!isBuildTime && !admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert({
projectId: env.FIREBASE_PROJECT_ID,
clientEmail: env.FIREBASE_CLIENT_EMAIL,
privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}),
})
}
\`\`\`

### 6. Testing Issues

#### Error: `Jest encountered an unexpected token`

**Cause**: Jest configuration issues with ES modules.

**Solution**:
\`\`\`javascript
// jest.config.js
module.exports = {
testEnvironment: 'jsdom',
setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
moduleNameMapping: {
'^@/(.\*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
},
}
\`\`\`

#### Error: `ReferenceError: fetch is not defined`

**Cause**: Fetch not available in test environment.

**Solution**:
\`\`\`javascript
// jest.setup.js
import 'whatwg-fetch' // Add this import

// Or mock fetch
global.fetch = jest.fn()
\`\`\`

#### Error: `Cannot read properties of undefined (reading 'useRouter')`

**Cause**: Next.js router not mocked in tests.

**Solution**:
\`\`\`javascript
// jest.setup.js
jest.mock('next/navigation', () => ({
useRouter() {
return {
push: jest.fn(),
replace: jest.fn(),
prefetch: jest.fn(),
}
},
useSearchParams() {
return new URLSearchParams()
},
usePathname() {
return '/'
},
}))
\`\`\`

## 🔧 Debugging Tips

### 1. Enable Debug Logging

\`\`\`bash

# Add to .env.local for detailed logs

DEBUG=true
NODE_ENV=development
\`\`\`

### 2. Check Browser Developer Tools

1. **Console Tab**: Look for JavaScript errors
2. **Network Tab**: Check API request/response
3. **Application Tab**: Inspect cookies and local storage
4. **Sources Tab**: Set breakpoints for debugging

### 3. Server-Side Debugging

\`\`\`bash

# Check server logs

npm run dev

# Enable verbose logging

DEBUG=\* npm run dev
\`\`\`

### 4. Database Debugging

#### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Check **Authentication** → **Users** for user data
3. Check **Firestore** → **Data** for database records
4. Review **Usage** tab for quota limits

#### Mock Mode Debugging

\`\`\`javascript
// Check mock data in browser console
console.log('Mock users:', global.mockUsers)
\`\`\`

## 🛠️ Development Tools

### Recommended VS Code Extensions

\`\`\`json
// .vscode/extensions.json
{
"recommendations": [
"bradlc.vscode-tailwindcss",
"esbenp.prettier-vscode",
"dbaeumer.vscode-eslint",
"ms-vscode.vscode-typescript-next",
"formulahendry.auto-rename-tag"
]
}
\`\`\`

### VS Code Settings

\`\`\`json
// .vscode/settings.json
{
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"typescript.preferences.importModuleSpecifier": "relative",
"tailwindCSS.experimental.classRegex": [
["cva\$$([^)]*)\$$", "[\"'`]([^"'`]*)._?[\"'`]"],
["cx\$$([^)]_)\$$", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
]
}
\`\`\`

## 📊 Performance Issues

### Slow Build Times

**Solutions**:
\`\`\`bash

# Clear Next.js cache

rm -rf .next

# Update dependencies

npm update

# Use SWC compiler (should be default in Next.js 15)

# Check next.config.js for swcMinify: true

\`\`\`

### Large Bundle Size

**Solutions**:
\`\`\`bash

# Analyze bundle

npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

# Use dynamic imports for large components

const HeavyComponent = dynamic(() => import('./HeavyComponent'))
\`\`\`

### Memory Issues

**Solutions**:
\`\`\`bash

# Increase Node.js memory limit

NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check for memory leaks in components

# Use React DevTools Profiler

\`\`\`

## 🔍 Getting More Help

### 1. Check Documentation

- [Setup Guide](./SETUP.md)
- [Firebase Setup](./FIREBASE_SETUP.md)
- [Email Setup](./EMAIL_SETUP.md)
- [Testing Guide](./TESTING.md)

### 2. Enable Verbose Logging

\`\`\`bash

# Add to your component for debugging

console.log('Debug info:', { user, session, error })
\`\`\`

### 3. Check Dependencies

\`\`\`bash

# Verify all dependencies are installed

npm ls

# Check for security vulnerabilities

npm audit

# Update dependencies

npm update
\`\`\`

### 4. Community Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Testing Library](https://testing-library.com/)

## 🚨 Emergency Fixes

### Reset to Working State

\`\`\`bash

# Clear all caches and reinstall

rm -rf node_modules .next
npm install
npm run dev
\`\`\`

### Revert to Mock Mode

\`\`\`bash

# Edit .env.local

NEXT_PUBLIC_APP_MODE=mock

# Restart server

npm run dev
\`\`\`

### Database Reset (Mock Mode)

\`\`\`javascript
// Add to any component temporarily
useEffect(() => {
if (typeof window !== 'undefined') {
global.mockUsers?.clear()
global.mockUsersInitialized = false
}
}, [])
\`\`\`

## 📞 Support Channels

If you're still experiencing issues:

1. **Check the logs** - Most issues show detailed error messages
2. **Search existing issues** - Someone might have faced the same problem
3. **Create a minimal reproduction** - Isolate the problem
4. **Provide environment details** - OS, Node version, browser, etc.

---

**Remember**: Most issues have simple solutions. Start with the basics (environment variables, dependencies, cache clearing) before diving into complex debugging.

Good luck with your authentication boilerplate! 🚀

---

**Previous**: [Testing Guide](./TESTING.md) | **Next**: [API Reference](./API.md)
\`\`\`

Now let's create the API reference documentation:
