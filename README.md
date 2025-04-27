# FreestyleFiend

A collaborative, audio-driven rap battle and voting platform. Built with Next.js 14+, TypeScript, TailwindCSS, Zustand, shadcn/ui, and AWS Amplify for authentication and storage. Fully responsive, accessible, and optimized for Vercel deployment.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Accessibility & SEO](#accessibility--seo)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication (sign up, sign in, password reset) via AWS Cognito (Amplify v6)
- Audio recording and playback (Web Audio API, MediaRecorder)
- Upload and storage of audio files (AWS S3)
- Leaderboard and voting system
- Modern dark theme (black background, purple accents)
- Mobile-first responsive design
- Accessible (WCAG 2.1 AA), SEO-optimized
- Robust error handling and edge case management
- Unit tests (Vitest) & E2E tests (Playwright)

## Tech Stack
- **Framework:** Next.js 14+
- **Language:** TypeScript
- **Styling:** TailwindCSS, shadcn/ui
- **State Management:** Zustand
- **Forms & Validation:** react-hook-form + zod
- **Authentication & Storage:** AWS Amplify (v6), Cognito, S3
- **Testing:** Vitest, Playwright
- **Deployment:** Vercel
- **Package Manager:** pnpm (preferred)

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/YOUR_USERNAME/freestyleFiendFrontend.git
   cd freestyleFiendFrontend
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   # or
   npm install
   ```
3. **Set environment variables:**
   - Copy `.env.example` to `.env.local` and fill in required values (see [Environment Variables](#environment-variables)).

## Environment Variables
Set the following in your `.env.local` (or via Vercel dashboard):

```
NEXT_PUBLIC_USER_POOL_ID=your_cognito_user_pool_id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your_cognito_client_id
NEXT_PUBLIC_AWS_REGION=your_aws_region
NEXT_PUBLIC_API_BASE_URL=https://your-api-base-url
NEXT_PUBLIC_COOKIE_DOMAIN=.yourdomain.com
```

## Development
- **Start dev server:**
  ```sh
  pnpm dev
  # or
  npm run dev
  ```
- **Lint & format:**
  ```sh
  pnpm lint && pnpm format
  ```

## Testing
- **Unit tests:**
  ```sh
  pnpm test
  # or
  npm run test
  ```
- **E2E tests:**
  ```sh
  pnpm test:e2e
  # or
  npm run test:e2e
  ```
- **Test setup:** See `src/test/setup.ts` for global test config.

## Deployment
- **Vercel:**
  - Connect your repo to Vercel. Set all required environment variables in the Vercel dashboard.
  - Deploys automatically from `main` branch.
- **Manual build:**
  ```sh
  pnpm build
  pnpm start
  ```

## Accessibility & SEO
- Follows WCAG 2.1 AA guidelines where feasible
- Uses semantic HTML, keyboard navigation, and ARIA roles
- SEO-optimized with Next.js best practices

## Architecture
- **Component-driven:** Atomic design (atoms, molecules, organisms)
- **API-first:** Strong contracts between frontend and backend
- **Minimal coupling:** Clear separation of concerns
- **Error boundaries:** Wrap major dynamic components
- **File structure:** Flat, predictable, organized by feature/component

## Contributing
1. Fork the repo & create a feature branch
2. Write clear, tested code (unit & E2E)
3. Submit a pull request with detailed description
4. Ensure all tests pass before requesting review

## License
MIT

---

> For questions or support, open an issue or contact the maintainer.
