# CryptoWatch

CryptoWatch is a Next.js App Router application for tracking cryptocurrency market data, user watchlists, and price alerts.

## Stack

- Next.js 16 with App Router architecture compatible with the Next.js 14 style
- React 19
- TypeScript strict mode
- Tailwind CSS
- MongoDB with Mongoose
- NextAuth.js credentials authentication
- Redux Toolkit and React Redux
- Recharts

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the required environment variables:

```bash
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit
```

## Project Structure

```text
app/
  (auth)/
    login/
    register/
  api/
    auth/
lib/
  auth.ts
  mongodb.ts
models/
redux/
  slices/
hooks/
components/
  crypto/
  ui/
types/
```

## Authentication

Authentication uses NextAuth.js with a credentials provider and JWT sessions. The shared `authOptions` live in `lib/auth.ts`, while the route handler is defined in `app/api/auth/[...nextauth]/route.ts`.

The session exposes:

- `userId`
- `email`
- `name`

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `NEXTAUTH_SECRET` | Yes | Secret used by NextAuth.js |
| `NEXTAUTH_URL` | Yes | Application URL used by NextAuth.js |

## Current Phase

The project is prepared for the next Redux and dashboard implementation phase. Authentication, MongoDB connection, login, register, and route protection foundations are in place.
