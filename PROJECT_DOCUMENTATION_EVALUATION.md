# CryptoWatch - Project Documentation and Technical Evaluation Package

## 1. Project Overview

### General Presentation

CryptoWatch is a full-stack web application for cryptocurrency market monitoring. It allows authenticated users to view market data from CoinGecko, search cryptocurrencies, open detailed cryptocurrency pages, save personal watchlists, create price alerts, and receive alert emails through an SMTP-based notification workflow.

The implemented project is built with the Next.js App Router, TypeScript strict mode, Tailwind CSS, Redux Toolkit, MongoDB with Mongoose, NextAuth, Recharts, Nodemailer, and the CoinGecko API. The installed package versions show a modern stack: Next.js 16.2.6, React 19.2.4, Tailwind CSS 4, Redux Toolkit 2.12.0, Mongoose 9.6.2, NextAuth 4.24.14, Recharts 3.8.1, and Nodemailer 7.0.13.

### Main Objectives

The real implementation targets the following objectives:

- Provide a protected SaaS-style dashboard for cryptocurrency market monitoring.
- Retrieve cryptocurrency data from CoinGecko through a server-side API proxy.
- Display global market indicators and top cryptocurrency market rows.
- Support user registration, login, session handling, and protected routes.
- Persist user-specific watchlists in MongoDB.
- Persist user-specific price alerts in MongoDB.
- Send email notifications when active alerts are triggered by current prices.
- Provide responsive navigation, dark/light theme support, loading states, empty states, and toast feedback.

### Target Users

The target users are individual cryptocurrency followers, students, investors, or analysts who want a simple authenticated dashboard to monitor market movements, save interesting assets, and configure threshold-based price alerts.

### Real Implemented Features

The following features are implemented in the codebase:

- Email/password registration and login.
- NextAuth credentials authentication with JWT sessions.
- Protected dashboard routes through middleware and server-side layout checks.
- Dashboard overview with global CoinGecko statistics and top 100 market rows.
- Dashboard market filtering: top gainers, top losers, highest market cap, and lowest market cap.
- Quasi real-time dashboard market refresh every 30 seconds using polling.
- Sortable cryptocurrency market table.
- Cryptocurrency detail page with price, market metrics, description, watchlist button, price chart, and alert form.
- Search bar with debounce, keyboard navigation, CoinGecko search results, and navigation to detail pages.
- MongoDB-backed user watchlist.
- MongoDB-backed price alerts.
- Cron-style alert checking endpoint protected by `CRON_SECRET`.
- SMTP email sending with Nodemailer.
- Profile page for updating name and password.
- Dark/light/system theme support using `next-themes`.
- Responsive sidebar/navbar layout.
- Toast notifications using Sonner.

Not implemented, despite being mentioned in the older README:

- WebSocket live updates.
- Real-time in-app alert polling.
- Advanced filters by category, custom market cap range, or custom 24h variation range.
- Portfolio valuation/trade tracking.
- Deployment configuration beyond local app and Docker Compose for MongoDB.

## 2. Functional Analysis

### Authentication

Purpose: Authentication protects dashboard data and ties watchlists, alerts, and profile data to a specific user.

User workflow:

1. A new user opens `/register`, enters name, email, password, and confirmation.
2. The client validates required fields, email format, password length, and password confirmation.
3. The registration API creates a MongoDB user after checking duplicate email.
4. The user opens `/login`, enters credentials, and signs in through NextAuth credentials.
5. Authenticated users are redirected to `/dashboard`; unauthenticated users attempting dashboard routes are redirected to `/login`.

Technical implementation:

- Registration is handled by `app/api/auth/register/route.ts`.
- Login is handled by NextAuth in `app/api/auth/[...nextauth]/route.ts` using `lib/auth.ts`.
- Passwords are hashed with bcrypt using 10 salt rounds.
- NextAuth uses JWT sessions and adds `userId`, `email`, and `name` to the token/session.
- `middleware.ts` protects `/dashboard/:path*`.
- `app/dashboard/layout.tsx` also validates the session and user existence server-side before rendering the dashboard shell.

### Dashboard

Purpose: The dashboard gives users an overview of market status and the top cryptocurrency assets.

User workflow:

1. The user logs in and lands on `/dashboard`.
2. The page displays global market statistics: total market cap, 24h volume, BTC dominance, and active cryptocurrencies.
3. The user applies a market filter: highest market cap, lowest market cap, top gainers, or top losers.
4. The user reviews the cryptocurrency table and can still sort by rank, name, symbol, price, 24h change, market cap, and volume.
5. The user can open an asset detail page or add/remove a coin from the watchlist.

Technical implementation:

- `app/dashboard/page.tsx` is an async server component.
- It fetches markets and global stats in parallel with `Promise.all`.
- It calls `getMarkets(1, { revalidate: 60 })` and `getGlobalStats({ revalidate: 60 })`.
- `DashboardCryptoPanel` receives the server-rendered initial market rows, connects the `useCryptoData` polling hook, and applies client-side filters.
- `CryptoTable` is a client component responsible for sorting, rendering market rows, and watchlist actions.
- The dashboard polls `/api/crypto?endpoint=markets&fresh=true` every 30 seconds after hydration. This preserves SSR initial rendering and avoids an immediate duplicate hydration request.
- Dashboard route output is dynamic because the protected layout depends on the authenticated session.

### Crypto Filtering

Purpose: Filtering satisfies the academic requirement for "Recherche et filtrage des monnaies numeriques" by letting users quickly focus on different market views without extra API calls.

User workflow:

1. The user opens the dashboard.
2. The user selects a filter from the dropdown above the market table.
3. The visible rows update instantly on the client.
4. The user can still use the existing table column sorting after applying the filter.

Technical implementation:

- `components/crypto/DashboardCryptoPanel.tsx` owns the filter state.
- Filtering uses `useMemo` to derive visible rows from the currently loaded market data.
- Supported filters are top gainers, top losers, highest market cap, and lowest market cap.
- The filter changes the table's default sort direction by remounting `CryptoTable` with a stable `key`, while preserving the existing table sorting implementation.
- Filtering is local to the already loaded CoinGecko market rows and does not trigger additional CoinGecko requests.

### Watchlist

Purpose: The watchlist allows users to save cryptocurrency IDs and later view only those tracked assets.

User workflow:

1. From the dashboard table or crypto detail page, the user clicks add to watchlist.
2. The client sends the selected crypto ID to `/api/watchlist`.
3. The server persists the ID in the user's MongoDB watchlist.
4. The `/dashboard/watchlist` page loads the saved IDs and fetches current market rows for them.
5. The user can remove assets from the watchlist.

Technical implementation:

- State is managed by `redux/slices/watchlistSlice.ts`.
- `useWatchlist.ts` hydrates the watchlist once and exposes add/remove/refetch helpers.
- API logic is implemented in `app/api/watchlist/route.ts`.
- MongoDB persistence uses `models/Watchlist.ts`.
- `$addToSet` prevents duplicate crypto IDs.
- The watchlist page batches market retrieval by calling `/api/crypto?endpoint=markets&ids=...`.
- `CryptoTable` applies optimistic UI state while add/remove operations are in progress.

### Alerts

Purpose: Alerts let users define a threshold for a cryptocurrency price and choose whether the price should trigger above or below that target.

User workflow:

1. The user opens a cryptocurrency detail page.
2. The user chooses `Above` or `Below`, enters a positive target price, and submits the form.
3. The alert is saved in MongoDB.
4. The user can view all alerts on `/dashboard/alerts`.
5. The user can delete saved alerts.
6. When an external scheduler calls `/api/alerts/check` with valid authorization, active alerts are checked against current CoinGecko prices. Triggered alerts send email notifications and are marked inactive.

Technical implementation:

- Alert creation UI is implemented in `components/crypto/PriceAlertForm.tsx`.
- Alert list UI is implemented in `components/alerts/AlertsList.tsx`.
- Redux alert state lives in `redux/slices/alertsSlice.ts`.
- Alert API CRUD operations are implemented in `app/api/alerts/route.ts`.
- Alert checking is implemented in `app/api/alerts/check/route.ts`.
- The alert checker batches CoinGecko simple price requests by unique crypto IDs.
- Active duplicate alerts are prevented using both application-level checks and a partial unique MongoDB index.
- Alert processing uses a `notificationLockedAt` lock to reduce duplicate email sends during concurrent checks.

Important limitation: Alert checking is not automatic by itself. The project exposes the secure endpoint, but it requires an external cron job or scheduler to call it.

### Search

Purpose: Search helps users quickly find a cryptocurrency by name or symbol and navigate to its detail page.

User workflow:

1. The user types in the navbar search input.
2. The UI waits for a 400 ms debounce.
3. Results appear in a dropdown.
4. The user clicks a result or uses keyboard navigation and Enter.
5. The app navigates to `/dashboard/crypto/[id]`.

Technical implementation:

- `components/SearchBar.tsx` is a client component.
- It calls `/api/crypto?endpoint=search&q=...`.
- It uses `AbortController` to cancel outdated requests.
- It stores only the top 8 results in the dropdown.
- It implements combobox/listbox ARIA attributes and keyboard handling for Escape, ArrowUp, ArrowDown, and Enter.

### Charts

Purpose: Charts visualize historical price changes for a selected cryptocurrency.

User workflow:

1. The user opens a crypto detail page.
2. The user views a price history chart.
3. The user can switch between 7 days, 30 days, 90 days, and 1 year.
4. Tooltips show the price and timestamp.

Technical implementation:

- `components/crypto/PriceChart.tsx` uses Recharts.
- Chart data is fetched from `/api/crypto?endpoint=chart&id=...&days=...`.
- It uses `AbortController` to cancel outdated period/asset requests.
- It maps CoinGecko `prices` pairs into chart points.
- It adjusts chart colors based on the resolved theme from `next-themes`.

### Profile System

Purpose: The profile system lets users view their stored name/email and update their name or password.

User workflow:

1. The user opens the profile menu in the navbar and clicks Profile.
2. The profile page loads current user data.
3. The user changes their name and optionally enters a new password.
4. The API validates and persists the update.

Technical implementation:

- Server page: `app/dashboard/profile/page.tsx`.
- Client form: `components/profile/ProfileForm.tsx`.
- API route: `app/api/profile/route.ts`.
- Email is read-only in the UI.
- Password updates require at least 8 characters and are hashed with bcrypt.

### SMTP Email Notifications

Purpose: SMTP email notifications inform users when price alerts trigger.

User workflow:

1. A user creates an active alert.
2. A cron/scheduler calls `/api/alerts/check`.
3. The endpoint retrieves active alerts and current prices.
4. Matching alerts send emails to alert owners.
5. Triggered alerts are marked inactive with `triggeredAt`.

Technical implementation:

- `lib/mail.ts` uses Nodemailer.
- SMTP settings are read from environment variables:
  - `EMAIL_SERVER_HOST`
  - `EMAIL_SERVER_PORT`
  - `EMAIL_SERVER_USER`
  - `EMAIL_SERVER_PASSWORD`
  - `EMAIL_FROM`
- HTML and plain-text email bodies are generated.
- Values inserted into HTML are escaped with `escapeHtml`.
- The transporter is cached in memory.

### Responsive UI

Purpose: The application is designed to work on desktop and mobile dashboard layouts.

User workflow:

- On desktop, the sidebar is visible and the navbar contains the search bar.
- On smaller screens, the sidebar becomes a slide-out menu and the search bar appears below the navbar controls.
- Tables use horizontal scrolling and hide lower-priority columns on smaller breakpoints.

Technical implementation:

- Layout is implemented with Tailwind responsive utilities.
- `DashboardLayout`, `Sidebar`, and `Navbar` control responsive navigation.
- `CryptoTable` hides columns with `sm`, `md`, and `lg` breakpoints while preserving access to key data.

### Dark/Light Mode

Purpose: The user can switch between dark and light visual modes.

User workflow:

1. The user clicks the theme toggle in auth pages or dashboard navbar.
2. The theme switches between light and dark.
3. The preference is persisted in local storage.

Technical implementation:

- `components/layout/ThemeProvider.tsx` wraps the application with `next-themes`.
- Theme state uses `attribute="class"` and storage key `cryptowatch-theme`.
- `ThemeToggle.tsx` switches between light and dark based on `resolvedTheme`.
- `app/globals.css` defines light/dark CSS variables and a Tailwind custom dark variant.

## 3. Technical Architecture

### Frontend Architecture

The frontend is organized around Next.js App Router pages and reusable React components. Server components are used for protected page initialization and SEO-friendly content, while client components handle interactive UI such as forms, search, sorting, watchlist toggles, charts, toasts, theme switching, and Redux-powered state.

Main frontend routes:

- `/login`: login form.
- `/register`: registration form.
- `/dashboard`: market overview.
- `/dashboard/watchlist`: user's saved cryptocurrencies.
- `/dashboard/alerts`: user's saved alerts.
- `/dashboard/crypto/[id]`: cryptocurrency detail page.
- `/dashboard/profile`: profile management page.

### Backend Architecture

The backend is implemented with Next.js route handlers inside `app/api`. It handles authentication, database persistence, external API proxying, and alert checking.

Implemented API routes:

- `POST /api/auth/register`: register a user.
- `GET/POST /api/auth/[...nextauth]`: NextAuth handler.
- `GET /api/crypto`: proxy for CoinGecko market/search/detail/chart/global endpoints.
- `GET/POST/DELETE /api/watchlist`: user watchlist operations.
- `GET/POST/DELETE /api/alerts`: user alert operations.
- `GET /api/alerts/check`: cron-style alert processing and email sending.
- `GET/PATCH /api/profile`: profile read and update.

### API Proxy Architecture

The project does not call CoinGecko directly from most UI surfaces. It routes requests through `app/api/crypto/route.ts`, which validates an `endpoint` query parameter and delegates to `lib/coingecko.ts`.

Supported proxy endpoints:

- `markets`
- `detail`
- `chart`
- `search`
- `global`

This design centralizes CoinGecko request construction, API key handling, error conversion, timeout behavior, retry logic, and Next.js fetch caching/revalidation.

For dashboard polling, `/api/crypto?endpoint=markets&fresh=true` passes `cache: "no-store"` to the CoinGecko client. This keeps SSR rendering cache-friendly while allowing the client-side dashboard refresh loop to request fresh rows every 30 seconds.

### MongoDB Models

MongoDB access is implemented through Mongoose models:

- `UserModel` in `models/User.ts`.
- `WatchlistModel` in `models/Watchlist.ts`.
- `AlertModel` in `models/Alert.ts`.

Database connection logic is centralized in `lib/mongodb.ts`, with a global cache to avoid creating repeated Mongoose connections during development or serverless execution.

### Redux State Management

Redux Toolkit manages client-side state for:

- Watchlists: `redux/slices/watchlistSlice.ts`.
- Alerts: `redux/slices/alertsSlice.ts`.

The store is configured in `redux/store.ts` and provided globally by `redux/Provider.tsx`. Typed hooks are exposed in `redux/hooks.ts`.

Redux is used for shared authenticated dashboard state, while server-rendered market data is fetched directly in server components.

### SSR Usage

The dashboard and crypto detail pages use server-side data fetching:

- `/dashboard` fetches top markets and global stats on the server.
- `/dashboard/crypto/[id]` fetches cryptocurrency details on the server and generates metadata.
- `/dashboard/layout.tsx` verifies the session and loads user data on the server.
- `/dashboard/profile` fetches initial profile data on the server.

Next.js route output indicates dashboard and API routes are dynamic, while `/login` and `/register` are statically generated.

### Reusable Components

Important reusable components include:

- `CryptoTable`: sortable market table and watchlist actions.
- `DashboardCryptoPanel`: dashboard filtering and 30-second market polling.
- `SearchBar`: debounced crypto search and navigation.
- `PriceChart`: Recharts historical price chart.
- `PriceAlertForm`: alert creation form.
- `WatchlistButton`: detail-page watchlist action.
- `AlertsList`: alert list and delete actions.
- `ProfileForm`: profile editing.
- `DashboardLayout`, `Sidebar`, `Navbar`: authenticated dashboard shell.
- `ThemeProvider`, `ThemeToggle`: theme system.
- `NotificationToaster`: global toast system.

### Folder Organization

The actual project structure is:

```text
cryptowatch/
  app/
    (auth)/login
    (auth)/register
    api/auth
    api/crypto
    api/watchlist
    api/alerts
    api/profile
    dashboard
  components/
    alerts/
    crypto/
    layout/
    profile/
    SearchBar.tsx
  hooks/
  lib/
  models/
  redux/
  types/
  public/
```

Note: The README describes folders such as `components/ui`, `components/dashboard`, `CryptoCard`, `MarketStats`, and `userSlice`, but these are not present in the current implementation.

## 4. Database Design

### User Model

File: `models/User.ts`

Fields:

- `name`: string, required, trimmed.
- `email`: string, required, unique, lowercased, trimmed.
- `password`: string, required, bcrypt-hashed.
- `createdAt`: date, defaults to current date.

Relations:

- `Watchlist.userId` references `User`.
- `Alert.userId` references `User`.

Persistence logic:

- Registration creates a user after checking duplicate email.
- A Mongoose `pre("save")` hook hashes passwords unless already hashed.
- Authentication compares a submitted password with the stored hash.
- Profile updates can change name and password.

### Watchlist Model

File: `models/Watchlist.ts`

Fields:

- `userId`: ObjectId, references User, required, unique, indexed.
- `cryptos`: string array of CoinGecko crypto IDs.
- `createdAt`: timestamp from Mongoose.
- `updatedAt`: timestamp from Mongoose.

Relations:

- One watchlist document belongs to one user.
- Each crypto is stored as a CoinGecko ID string, not as a separate local crypto document.

Persistence logic:

- `findByUserId(userId)` retrieves the current user's watchlist.
- `addCrypto(userId, cryptoId)` uses upsert and `$addToSet`.
- `removeCrypto(userId, cryptoId)` uses `$pull`.
- A validator rejects duplicate crypto IDs.

### Alert Model

File: `models/Alert.ts`

Fields:

- `userId`: ObjectId, references User, required, indexed.
- `cryptoId`: string, required, trimmed, lowercased.
- `cryptoSymbol`: string, required, uppercased.
- `cryptoName`: string, required.
- `targetPrice`: number, required, positive.
- `condition`: enum, `"above"` or `"below"`.
- `active`: boolean, defaults to true.
- `triggeredAt`: date or null.
- `notificationLockedAt`: date or null.
- `createdAt`: timestamp from Mongoose.

Relations:

- Many alerts can belong to one user.
- Alerts refer to external CoinGecko IDs rather than a local cryptocurrency table.

Persistence logic:

- Active duplicate alerts are prevented by a partial unique index on user, crypto, condition, target price, and active status.
- `findActiveByUser` returns active alerts for a user.
- `markTriggered` sets `active=false`, records `triggeredAt`, and clears the notification lock.
- Alert check processing temporarily sets `notificationLockedAt` to prevent duplicate sends.

## 5. API Integration

### CoinGecko Integration

CoinGecko integration is centralized in `lib/coingecko.ts`.

Implemented external endpoints:

- `/coins/markets`: market table and watchlist market rows.
- `/coins/{id}`: detail page data.
- `/coins/{id}/market_chart`: price chart data.
- `/search`: navbar search results.
- `/global`: global market statistics.
- `/simple/price`: batched alert price checks.

### API Proxy Strategy

The internal API route `/api/crypto` validates a query parameter named `endpoint`, then maps it to the appropriate CoinGecko function. This avoids exposing API details throughout the UI and keeps error handling consistent.

### Async Handling

The implementation uses async/await across:

- Server component data fetching.
- Next.js route handlers.
- Redux async thunks.
- Client-side search/chart/watchlist requests.
- MongoDB operations.
- SMTP email sending.

### Optimization Strategies

Implemented optimizations:

- Server-side parallel fetching with `Promise.all` for dashboard data.
- SSR initial market rows are reused by the client polling hook to prevent a duplicate hydration fetch.
- Next.js fetch caching and revalidation for CoinGecko requests, defaulting to 60 seconds.
- `cache: "no-store"` for alert checks and selected authenticated client requests where fresh data is required.
- Mongoose connection caching through `globalThis`.
- Batched CoinGecko requests for watchlist market rows and alert price checks.
- Client-side dashboard filtering with `useMemo`, avoiding extra CoinGecko calls for filter changes.
- Abortable client-side fetches for search, charts, watchlist market loading, and dashboard market polling.

### Batched Requests

Implemented batching:

- Watchlist page sends all saved crypto IDs to `/api/crypto?endpoint=markets&ids=...`.
- Alert checker collects unique crypto IDs and requests prices with one `/simple/price` call.
- Dashboard fetches markets and global stats in parallel.

### Retry and Error Handling

Implemented retry/error behavior:

- CoinGecko requests have a default timeout of 10 seconds.
- CoinGecko requests retry up to 2 times by default.
- HTTP 429 responses use `Retry-After` when available or exponential delay.
- Errors are normalized into `CoinGeckoApiError`.
- API routes return structured `{ data, error }` JSON responses.
- Client components show errors through inline messages and Sonner toasts.

## 6. Security

### Password Hashing

Passwords are hashed with bcrypt. Registration hashes before creation, and the User model also includes a pre-save hashing hook. Profile password updates also hash the new password.

### Protected Routes

Dashboard routes are protected by:

- `middleware.ts`, which checks the NextAuth JWT token.
- `app/dashboard/layout.tsx`, which checks the server session and validates that the user still exists in MongoDB.
- API routes for watchlist, alerts, and profile, which call `getServerSession`.

### NextAuth Sessions

NextAuth uses the credentials provider with JWT sessions. The JWT callback stores `userId`, email, and name. The session callback exposes those values to authenticated UI and API logic.

### Environment Variables

Sensitive configuration is read from environment variables:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `COINGECKO_API_KEY`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `CRON_SECRET`

`.env.example` documents these variables. `.env.local` is present locally but should not be committed.

### SMTP Protection

SMTP credentials are not hardcoded in the email implementation. `lib/mail.ts` requires SMTP variables at runtime and throws clear errors if they are missing.

### CRON_SECRET Protection

The alert check endpoint is protected by `CRON_SECRET` in production. It accepts the secret through:

- `Authorization: Bearer <secret>`
- `x-cron-secret`
- `?secret=...`

In production, the endpoint returns 503 if `CRON_SECRET` is missing. In non-production environments, missing `CRON_SECRET` is allowed for easier local testing.

## 7. Performance Optimizations

### Batched CoinGecko Requests

The application avoids one request per saved crypto or one request per alert. Watchlist market data and alert price checks are batched by ID list.

### Hydration Guards

Watchlist state includes a `hydrated` flag. `fetchWatchlist` uses a Redux thunk condition to avoid repeated fetches unless `force` is requested.

### Fetch Optimization

The CoinGecko client supports:

- `force-cache` by default.
- `next.revalidate` for server caching.
- `no-store` when fresh data is required.
- Next.js cache tags in the request options type.

### AbortController Usage

`AbortController` is used in:

- `SearchBar`
- `PriceChart`
- `WatchlistPage`
- `useCryptoData`

This prevents stale responses from overwriting newer UI state and cancels unnecessary requests.

### SSR Rendering

Server-side rendering is used for important data-loaded pages. This improves initial page consistency and keeps protected data checks close to the server.

### Redux Optimization

Redux Toolkit reduces boilerplate and uses async thunk conditions for watchlist hydration. Selectors are defined for watchlist, alerts, and active alerts. `createSelector` is used for derived active alert state.

## 8. UI/UX Design

### Responsive Design

The UI uses a responsive SaaS dashboard layout:

- Sticky top navbar.
- Desktop sidebar.
- Mobile slide-out sidebar.
- Mobile search row.
- Responsive grid statistic cards.
- Tables with horizontal scrolling and breakpoint-specific columns.

### Dashboard UX

The dashboard prioritizes high-level market information first, followed by a sortable top cryptocurrency table. Primary actions are visible in table rows: view details and add/remove watchlist.

### Sidebar and Navbar

The sidebar contains Dashboard, Watchlist, and Alerts routes. The navbar contains search, theme toggle, user menu, profile link, and logout action.

### Toast Notifications

Sonner toasts provide feedback for:

- Login/register validation.
- Successful authentication.
- Watchlist add/remove.
- Alert creation/deletion.
- Profile update.
- API failures.
- Recently triggered alert emails after alert data is refetched.

### Loading States

Implemented loading states include:

- Dashboard loading skeleton in `app/dashboard/loading.tsx`.
- Table loading messages.
- Search dropdown loading state.
- Chart loading panel.
- Alert list loading state.
- Profile refreshing/submitting states.
- Button-level saving/creating/removing states.

### Empty States

Implemented empty states include:

- Empty watchlist guidance.
- Empty alerts message.
- No search results message.
- No chart data available message.
- Missing CoinGecko description fallback.

### Charts UX

The chart includes period controls, theme-aware colors, responsive sizing, axis formatting, and custom tooltip content. It communicates loading, error, and empty states clearly.

## 9. Implemented Objectives Checklist

| Objective | Status | Evaluation |
|---|---:|---|
| User authentication | ✓ Fully implemented | Registration, login, bcrypt hashing, NextAuth credentials, JWT sessions, protected routes. |
| Protected dashboard | ✓ Fully implemented | Middleware and server layout both enforce authentication. |
| Real-time crypto tracking | ✓ Fully implemented for quasi real-time scope | Dashboard market rows use SSR initial data and then refresh automatically every 30 seconds through polling. No WebSocket infrastructure is implemented. |
| Market trends/dashboard | ✓ Fully implemented | Global stats, top 100 markets, market cap/volume/BTC dominance, sortable table. |
| Personal watchlist | ✓ Fully implemented | MongoDB persistence, add/remove actions, watchlist page, batched market data loading. |
| Price alerts | ✓ Fully implemented | Create, list, delete, store, prevent duplicates, active/triggered state. |
| Email notifications | △ Partially implemented | SMTP sending and alert checking are implemented, but automatic execution depends on an external scheduler calling `/api/alerts/check`. |
| Search and filtering | ✓ Fully implemented | Debounced CoinGecko search plus dashboard filters for top gainers, top losers, highest market cap, and lowest market cap. |
| Charts | ✓ Fully implemented | Recharts price history with 7d/30d/90d/1y periods. |
| Profile system | ✓ Fully implemented | View profile, update name, update password. Email change is not implemented. |
| Responsive UI | ✓ Fully implemented | Sidebar/navbar adapt to screen size; tables and pages use responsive layouts. |
| Dark/light mode | ✓ Fully implemented | `next-themes`, theme toggle, persisted preference, dark styling. |
| Advanced filters | △ Partially implemented | Simple dashboard market filters are implemented. Category filters and custom numeric filter ranges are not implemented. |
| WebSocket live notifications | ✗ Not implemented | No WebSocket code exists. |
| Portfolio tracking | ✗ Not implemented | Watchlist exists, but there is no holdings, quantity, profit/loss, or portfolio valuation feature. |
| Deployment | ✗ Not implemented | No real deployment configuration or deployed URL is included. |

## 10. Limitations and Future Improvements

Current limitations:

- Alert emails require an external cron scheduler; the app does not schedule checks internally.
- In-app alert notifications are not live unless alert data is manually/refetch-triggered by page behavior.
- Dashboard market rows refresh every 30 seconds, but global statistic cards remain server-rendered and revalidate on page load/navigation rather than polling in the client.
- Search supports only name/symbol lookup through CoinGecko, not advanced filters.
- Profile email cannot be changed.
- No portfolio holdings, quantities, cost basis, profit/loss, or valuation features are implemented.
- No automated test suite is present in the current project.
- The README contains outdated/planned features and architecture entries that do not match the current source code.

Realistic future improvements:

- Add a hosted cron job for `/api/alerts/check`.
- Add WebSocket or Server-Sent Events for live prices and real-time alert updates.
- Add push notifications or browser notifications.
- Add advanced analytics such as moving averages, volatility, and market dominance charts.
- Add portfolio tracking with quantities, average buy price, and profit/loss.
- Add multilingual support, especially English/French consistency across the UI.
- Add automated tests for API routes, Redux slices, authentication, and alert processing.
- Add production deployment documentation and monitoring.
- Add advanced filters and saved dashboard preferences.

## 11. Conclusion

CryptoWatch is a functional full-stack cryptocurrency monitoring application. It demonstrates a strong integration of modern web development concepts: protected Next.js App Router pages, typed React components, Redux Toolkit state management, MongoDB persistence through Mongoose, external API integration through CoinGecko, Recharts data visualization, and SMTP email delivery with Nodemailer.

The project successfully implements the core academic objectives of authentication, dashboard visualization, watchlist management, search, charts, profile management, and alert persistence. Its most technically advanced part is the alert notification workflow, which includes batched price checks, duplicate prevention, notification locking, and email generation.

The main limitations are not architectural failures but scope boundaries: real-time WebSocket updates, automatic production scheduling, advanced analytics, and portfolio accounting are not implemented. Overall, CryptoWatch is a credible SaaS-style dashboard foundation with a clear separation between frontend components, backend API routes, database models, and external service integration.

## PPT Support Section

### Short Presentation Summary

CryptoWatch is a Next.js full-stack dashboard for monitoring cryptocurrency markets. It uses CoinGecko for market data, MongoDB for user-specific watchlists and alerts, NextAuth for secure authentication, Recharts for price history visualization, Redux Toolkit for dashboard state, and Nodemailer for email notifications when configured price alerts are triggered.

### Suggested PPT Slide Structure

1. Title slide: CryptoWatch, team/class/module information.
2. Problem statement: need for centralized crypto monitoring and personalized alerts.
3. Project objectives: market tracking, watchlist, alerts, secure user accounts.
4. Technology stack: Next.js, TypeScript, Tailwind, Redux, MongoDB, NextAuth, CoinGecko, Recharts, Nodemailer.
5. Functional overview: authentication, dashboard, search, details, watchlist, alerts, profile.
6. Architecture diagram: browser, Next.js pages/components, API routes, MongoDB, CoinGecko, SMTP.
7. Database design: User, Watchlist, Alert models and relationships.
8. API integration: CoinGecko proxy endpoints and error/retry strategy.
9. Alert workflow: create alert, cron check, batch prices, send email, mark triggered.
10. Security: bcrypt, sessions, protected routes, environment variables, `CRON_SECRET`.
11. UI/UX: responsive dashboard, sidebar/navbar, dark mode, loading/empty states, toasts.
12. Evaluation checklist: fully implemented, partial, not implemented.
13. Limitations and future improvements.
14. Demo plan.
15. Conclusion.

### Suggested Demo Flow

1. Show registration page and explain validation.
2. Log in with an existing user.
3. Show dashboard overview cards and sortable crypto table.
4. Use search to find a cryptocurrency.
5. Open a detail page and show metrics, chart periods, and description.
6. Add the cryptocurrency to the watchlist.
7. Open the watchlist page and show persisted saved assets.
8. Create a price alert from the detail page.
9. Open the alerts page and show saved alert management.
10. Explain the email workflow by showing `/api/alerts/check` conceptually or running it only if SMTP and `CRON_SECRET` are configured.
11. Open profile and show name/password update capability.
12. Toggle dark/light mode and show responsive layout if presenting on different viewport sizes.

### Important Screenshots/Pages to Show

- `/login`: authentication entry point.
- `/register`: account creation and validation.
- `/dashboard`: global market dashboard and top crypto table.
- Navbar search dropdown: CoinGecko search integration.
- `/dashboard/crypto/[id]`: asset detail, chart, watchlist button, alert form.
- `/dashboard/watchlist`: persisted personal watchlist.
- `/dashboard/alerts`: alert management.
- `/dashboard/profile`: profile update form.
- Dark mode view of dashboard.
- Mobile sidebar/navbar layout if responsive design is part of the defense.

## Validation Notes

Validation performed on 2026-05-24:

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser smoke test: dashboard rendered, market filter dropdown changed table rows instantly, and the polling status changed from "Quasi real-time polling active" to "Last refreshed ..." after the 30-second interval.
- Build output confirms dynamic routes for dashboard and API routes, and static routes for `/login` and `/register`.
- Next.js emitted a warning that the `middleware` file convention is deprecated in favor of `proxy` in the installed Next.js version. This is not a functional failure, but it is a future maintenance item.
