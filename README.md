This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Payment Architecture Overview
HireGo AI uses a streamlined, two-provider payment architecture supporting only **Stripe** and **PayU**.
- **Stripe**: Handles primary credit card processing and international payments.
- **PayU**: Handles domestic (India) transactions and local payment methods.
- *Note*: Legacy providers (PhonePe and Razorpay) have been completely purged from the codebase and database schema. Do not attempt to use them.

## Development Setup Instructions
1. **Clone the repository** and install dependencies using `npm install`.
2. **Environment Variables**: Copy `.env.example` to `.env.local` and fill in the required database, custom JWT/session, Redis, storage, and provider values.
3. **Database Setup**: Run `npx prisma migrate dev` to apply the latest database schema to your local PostgreSQL instance.
4. **Start Development Server**: Run `npm run dev` and navigate to `http://localhost:3000`.

## Testing Instructions
HireGo AI includes a comprehensive suite of tests to ensure production readiness.
- **Offline Tests**: Run `npm run test:audit` (contains ~175 tests validating core logic and payments).
- **Phase 5 Tests**: Run `npm run test:phase5` for integration testing of recent architectural phases.
- Ensure all tests pass before proposing a pull request.

## CI and deployment
The repository uses GitHub Actions for validation and security checks:
- `phase5-verification.yml`: Runs the Phase 5 tests and type-checking on pull requests.
- `security.yml`: Runs dependency review on pull requests plus CodeQL and secret scanning.
- `deploy.yml`: Validates Prisma migrations against disposable PostgreSQL, typechecks, lints, tests, audits dependencies, and builds the application.

The workflow does **not** deploy Vercel or Railway. Follow `DEPLOYMENT.md` and
`DEPLOYMENT_CHECKLIST.md` for controlled deployment, provider verification,
worker health, and release sign-off.
