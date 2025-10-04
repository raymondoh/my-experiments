# Plumbers Portal

A comprehensive platform connecting customers with professional plumbers for all their plumbing needs. Built with Next.js 15, TypeScript, and Firebase.

## 🚰 Features

### For Customers

- **Find Local Plumbers**: Search and connect with verified plumbers in your area
- **Get Quotes**: Request and compare quotes from multiple professionals
- **Book Services**: Schedule appointments for routine maintenance or emergency repairs
- **Track Projects**: Monitor the progress of your plumbing projects
- **Reviews & Ratings**: Read reviews and rate plumbers based on their work

### For Plumbers

- **Professional Profile**: Showcase your skills, certifications, and experience
- **Job Management**: Receive, accept, and manage plumbing jobs
- **Customer Communication**: Direct messaging with customers
- **Scheduling**: Manage your availability and appointments
- **Payment Processing**: Secure payment handling for completed work

### For Business Owners

- **Team Management**: Manage multiple plumbers and assign jobs
- **Business Analytics**: Track revenue, job completion rates, and customer satisfaction
- **Inventory Management**: Track materials and supplies
- **Customer Database**: Maintain detailed customer records and service history

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for production)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/plumbers-portal.git
   cd plumbers-portal
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

   Fill in your environment variables:
   \`\`\`env

   # App Configuration

   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME="Plumbers Portal"

   # Firebase Configuration (optional for development)

   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY=your-private-key

   # Rate limiting (Upstash Redis)
   UPSTASH_REDIS_REST_URL=https://your-upstash-endpoint
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret
   DEV_API_KEY=dev-123
    ```

### Production Environment

Ensure `NEXTAUTH_SECRET` is set in production; the app will not start without it.

> **Note:** If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are missing, the application falls back to a no-op rate limiter suitable for local development. Provide valid credentials before deploying to production to enforce real rate limits.

4. **Run in development mode**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Development Modes

### Mock Mode (Default)

Perfect for development without Firebase setup:
\`\`\`bash
npm run mock-mode
npm run dev
\`\`\`

### Firebase Mode

For production-like development:
\`\`\`bash
npm run firebase-mode
npm run dev
\`\`\`

## 🧪 Testing

\`\`\`bash

# Run tests

npm test

# Run tests in watch mode

npm run test:watch

# Run tests with coverage

npm run test:coverage
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── app/ # Next.js App Router pages
│ ├── (auth)/ # Authentication pages
│ ├── (dashboard)/ # Protected dashboard pages
│ └── api/ # API routes
├── components/ # Reusable UI components
│ ├── auth/ # Authentication components
│ ├── ui/ # Base UI components (shadcn/ui)
│ └── plumbing/ # Plumbing-specific components
├── lib/ # Utility functions and configurations
│ ├── auth/ # Authentication logic
│ ├── firebase/ # Firebase configuration
│ └── services/ # Business logic services
└── types/ # TypeScript type definitions
\`\`\`

## 🔐 Authentication & Authorization

The app supports multiple user roles:

- **Customer**: Book services, request quotes, manage projects
- **Tradesperson**: Accept jobs, manage schedule, communicate with customers
- **Business Owner**: Manage team, assign jobs, view analytics
- **Manager**: Dispatch jobs, handle customer service
- **Admin**: System administration and user management

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**

### Manual Deployment

\`\`\`bash

# Build the application

npm run build

# Start production server

npm start
\`\`\`

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password, Google)
3. Create Firestore database
4. Generate service account credentials
5. Update environment variables

### Email Configuration

Configure email service for notifications:

- Welcome emails
- Job notifications
- Password reset emails

## 📊 Database Schema

### Core Collections

- `users/` - User profiles and authentication data
- `jobs/` - Plumbing job requests and details
- `quotes/` - Price quotes from plumbers
- `reviews/` - Customer reviews and ratings
- `messages/` - Communication between users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.plumbers-portal.com](https://docs.plumbers-portal.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/plumbers-portal/issues)
- **Email**: support@plumbers-portal.com

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced scheduling system
- [ ] Payment processing integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

---

Built with ❤️ for the plumbing community
