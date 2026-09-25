# Go Kyrgyzstan Travel

Website of Go Kyrgyzstan Travel, a tour operator in Kyrgyzstan. Guests browse
tours in English or Russian, check which routes fit their travel month, pick a
departure date, read place guides, and send a booking or custom-trip request.
Every request is stored in SQLite and forwarded to the team in Telegram.

Live site: https://kyrgyz.tours

## What the site does

- **Tour catalogue.** Tour pages at `/tours/:tourSlug` with a day-by-day
  programme or a route outline, price, practical information, a Leaflet /
  OpenStreetMap preview and related tours.
- **Seasonal home.** The home page (`/` and `/ru`) has a month selector. Tours
  are ranked for that month and labelled as available, "check access" or next
  season, based on each tour's `availableMonths`.
- **Booking calendar.** Tours marked as scheduled show open departures with the
  seats left (`GET /api/tours/:id/departures`). On-request tours accept flexible
  dates. In the admin, the team creates departures and moves bookings between
  them. A pending request does not hold seats; confirming a booking takes the
  seats in one SQLite transaction, so a departure cannot be oversold.
- **Destination hubs.** `/destinations/song-kul`, `/destinations/issyk-kul` and
  `/destinations/kel-suu` (also under `/ru/destinations/...`) link the tours
  and guides for each area.
- **Guides.** Travel and place guides under `/blogs` and `/blogs/:slug`.
- **Requests.** A booking form on each tour page and a custom-trip form at
  `/feedback`. Both validate input in the browser and again on the server.
- **Russian version.** Home, tours, tour pages, destinations, the request form
  and the legal pages have `/ru` routes.
- **Privacy.** Cookie consent, privacy policy (`/privacy-policy`) and terms
  (`/terms-of-use`). First-party analytics runs only after consent, drops
  contact details from events, keeps raw events for 7 days and daily totals for
  13 months.
- **Admin panel.** `/admin/login` and `/admin/dashboard`, with tabs for tours,
  sights, guides, custom leads, bookings, the departure calendar, analytics,
  reviews, users and site settings. Admins can upload images.

## Architecture

```
Browser --> nginx --> prerendered HTML and assets from dist/
               '----> /api --> Express (backend/server.mjs) --> SQLite
                                  '--> Telegram Bot API (new requests)
```

- **Frontend (`src/app`, `src/admin`).** React 18, TypeScript, Vite 6,
  Tailwind CSS 4, Radix UI primitives, React Router 6, react-helmet-async,
  react-hook-form with zod, Leaflet. Fonts are self-hosted in `public/fonts`.
- **Backend (`backend/`).** Express 5 with helmet, CORS and rate limits on the
  public forms, analytics events and logins, better-sqlite3, JWT admin
  sessions with bcrypt password hashes. `backend/booking-calendar.mjs` holds
  the departure and capacity logic.
- **Content (`data/`).** Seed tours, Russian tour copy, guides, destinations,
  tour slugs, and SEO titles and descriptions. The API seeds its database from
  these files, and the frontend imports them at build time.
- **Static SEO prerender (`scripts/`).** After `vite build`,
  `generate-seo-pages.mjs` writes an HTML file for every public route, with
  canonical and hreflang links, JSON-LD structured data, readable page content
  and `sitemap.xml`. `check-seo-output.mjs` then fails the build if a sitemap
  route has no prerendered page, a canonical link does not match, or a page
  lacks a title, a meta description or exactly one H1.
- **Telegram.** The backend forwards each new request to the connected chats.
  It polls the Bot API by default; a webhook route can be used instead.

Older account pages from the first version are still in the router: `/auth`,
`/dashboard` (buyer and seller profile) and `/create-tour` (seller
submissions). `/join-tour` is also still routed and listed in the sitemap.

## Local run

```bash
npm install
cp .env.example .env    # on Windows: copy .env.example .env
```

The root `npm install` covers the API as well. `backend/package.json` lists
only the API dependencies, for installing the backend on its own.

Set `JWT_SECRET` and an admin password hash in `.env`:

```bash
npm run admin:hash -- "your-admin-password"   # prints ADMIN_PASSWORD_HASH
```

`.env.example` points `VITE_API_BASE_URL` at the live site. For local work,
set it to `http://localhost:4000`; otherwise the dev frontend sends tours,
requests and admin logins to the production API.

Start the API (port 4000 by default) and the Vite dev server:

```bash
npm run server:dev
npm run dev
```

Health check: `curl http://localhost:4000/api/health`.

## Environment variables

Names only. Keep real values in `.env` on the server, never in git.

| Group | Variables |
| --- | --- |
| Frontend (bundled into public JS, no secrets) | `VITE_API_BASE_URL`, `VITE_API_TOURS_PATH`, `VITE_API_GUEST_REQUESTS_PATH`, `VITE_API_EVENTS_PATH`, `VITE_ASSET_BASE_URL`, `VITE_MAP_DEFAULT_LAT`, `VITE_MAP_DEFAULT_LNG`, `VITE_MAP_DEFAULT_ZOOM`, `VITE_BASE_PATH` (only for a subpath build) |
| API server | `API_PORT` (or `PORT`), `API_HOST`, `CORS_ORIGIN`, `PUBLIC_SITE_URL`, `DATABASE_PATH`, `UPLOADS_DIR`, `UPLOADS_PUBLIC_PATH`, `HEIF_CONVERT_BIN` |
| Admin | `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `JWT_EXPIRES_IN` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS`, `TELEGRAM_ALLOWED_USERNAMES`, `TELEGRAM_POLLING_ENABLED`, `TELEGRAM_WEBHOOK_SECRET` |

Notes:

- Use `ADMIN_PASSWORD_HASH`, not a plain `ADMIN_PASSWORD`.
- Do not put passwords or tokens in `VITE_` variables: Vite bundles them into
  public JavaScript.
- `TELEGRAM_ALLOWED_USERNAMES` is a comma-separated list of Telegram usernames
  that may connect a chat with `/start` or `/connect`. When it is empty, any
  chat that sends `/start` is accepted.

## Build and tests

```bash
npm run typecheck                                 # tsc --noEmit
npm run build                                     # vite build + SEO prerender + SEO output check
npm run check                                     # typecheck + backend syntax check + build
node --test backend/booking-calendar.test.mjs     # booking calendar unit tests
node backend/scripts/test-analytics-storage.mjs   # analytics storage, retention and redaction test
```

The analytics test starts the API against a temporary SQLite database.

## Deployment

Production runs on a Linux server:

- nginx serves the prerendered `dist/` from timestamped release folders behind
  a `current` symlink. Switching the link publishes a release in one step, and
  the previous release stays on disk for rollback.
- The Express API runs as a systemd service behind nginx under `/api`. The
  SQLite database lives outside the release folders, and the backend release
  script backs it up before switching.
- After a switch, a smoke check requests the main routes, the sitemap and
  `/api/health`.

The deploy scripts and the server configuration are kept outside this
repository.
