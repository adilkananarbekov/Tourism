# Go Kyrgyzstan Travel

Go Kyrgyzstan Travel is a production-oriented travel website for selling tours in
Kyrgyzstan. Guests can browse tours, view real media, and send a quick request
with their name plus Telegram or phone contact. Website leads can be sent to
your own API.

## Technology stack

### Frontend

- React 18 for the user interface
- TypeScript for typed application code
- Vite for local development and production builds
- React Router for page routing
- Tailwind CSS for responsive styling and theme support
- Radix UI primitives for accessible UI components
- Lucide React for interface icons
- React Helmet Async for SEO metadata
- Leaflet and OpenStreetMap tiles for map previews

### Backend and data

- Express API backend (`backend/server.mjs`) for tours, requests, events, and admin login
- SQLite database in `backend/data/go-kyrgyzstan-travel.sqlite` (auto-created on first run)
- JWT-based admin authentication with password hashing support (`bcrypt`)

### Deployment and tooling

- GitHub for source control
- GitHub Pages for the static website deployment
- npm scripts for development, build, and deployment

## Launching the project

From the project folder:

```bash
npm install
```

Create a `.env` file by copying `.env.example` and filling in values.

```bash
copy .env.example .env
```

For frontend to call your backend API, set:

```bash
VITE_API_BASE_URL=https://kyrgyz.tours
VITE_API_TOURS_PATH=/api/tours
VITE_API_GUEST_REQUESTS_PATH=/api/guest-requests
VITE_API_EVENTS_PATH=/api/events
```

For backend runtime, set:

```bash
API_PORT=4000
CORS_ORIGIN=https://kyrgyz.tours,http://localhost:5173
DATABASE_PATH=backend/data/go-kyrgyzstan-travel.sqlite
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@kyrgyz.tours
JWT_SECRET=change-this-to-a-long-random-secret
ADMIN_PASSWORD_HASH=<bcrypt-hash>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_ALLOWED_USERNAMES=Jakypbekovv1
TELEGRAM_WEBHOOK_SECRET=change-this-to-a-long-random-secret
TELEGRAM_POLLING_ENABLED=true
UPLOADS_DIR=public/uploads
UPLOADS_PUBLIC_PATH=/uploads
```

Generate `ADMIN_PASSWORD_HASH` from your chosen password:

```bash
npm run admin:hash -- "YourStrongAdminPassword"
```

Do not put private passwords or secrets in `VITE_` variables because Vite bundles
them into public JavaScript.

For production on `kyrgyz.tours`, set `UPLOADS_DIR` to a folder served by nginx,
for example `/var/www/go-kyrgyzstan-travel/uploads`. Admin image uploads return
URLs under `UPLOADS_PUBLIC_PATH`, such as `/uploads/tours/photo.webp`.

Run backend API:

```bash
npm run server:start
```

Run frontend app:

```bash
npm run dev
```

Build and preview (optional):

```bash
npm run build
npm run preview
```

Production builds default to root hosting (`/`) for `kyrgyz.tours`. If you need
a subpath build, set `VITE_BASE_PATH=/your-subpath/` before running `npm run build`.

Backend health check:

```bash
curl http://localhost:4000/api/health
```

## Security notes

- Do not commit `.env`, service account files, private keys, bot tokens, or service role keys.
- Keep API passwords, bot tokens, webhook secrets, and service role keys only in server-side configuration.
- Keep `JWT_SECRET` and admin credentials only on the server side.
- Use `ADMIN_PASSWORD_HASH` instead of plaintext `ADMIN_PASSWORD`.

## Admin panel

- Login route: `/admin/login`
- Dashboard: `/admin/dashboard`
- Admin login is now validated by `POST /api/admin/login` on your backend.
- Configure these values in `.env`:
  - `ADMIN_USERNAME`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD_HASH` (recommended)
  - `JWT_SECRET`

## Backend API routes

- `GET /api/health`
- `GET /api/tours`
- `POST /api/guest-requests`
- `POST /api/events`
- `GET /api/events`
- `POST /api/admin/login`
- `GET /api/admin/me` (Bearer token)
- `GET /api/admin/tours` (Bearer token)
- `POST /api/admin/tours` (Bearer token)
- `PUT /api/admin/tours/:id` (Bearer token)
- `DELETE /api/admin/tours/:id` (Bearer token)
- `GET /api/admin/guest-requests` (Bearer token)
- `PATCH /api/admin/guest-requests/:id` (Bearer token)
- `GET /api/admin/events` (Bearer token)
- `GET /api/admin/telegram/status` (Bearer token)
- `POST /api/admin/telegram/test` (Bearer token)

## Telegram notifications

Set `TELEGRAM_BOT_TOKEN` in the backend environment. The backend polls Telegram
by default, so open the bot in Telegram and send `/start`. The backend stores
that chat id and will forward new guest requests to it.

Set `TELEGRAM_ALLOWED_USERNAMES` to a comma-separated allowlist such as
`Jakypbekovv1`. When this is configured, only those Telegram usernames can
register a chat with `/start` or `/connect`.

If you prefer a webhook instead of polling, also set `TELEGRAM_WEBHOOK_SECRET`
and register it:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://kyrgyz.tours/api/telegram/webhook/$TELEGRAM_WEBHOOK_SECRET"
```


## Pages and routes

- `/` Home
- `/tours` Tours listing
- `/tours/:tourId` Tour detail + booking flow
- `/create-tour` Seller tour submission (pending admin approval)
- `/join-tour` Join a group tour
- `/blogs` Travel blogs + videos
- `/feedback` Feedback form and testimonials
- `/auth` Sign in / sign up
- `/dashboard` Buyer/Seller dashboard (profile + bookings/submissions)

The dashboard stores a local profile in `localStorage` and attempts to sync
bookings or seller submissions from the local data store.

## Maps

Tour detail pages show a map preview using OpenStreetMap tiles (Leaflet). You can tweak
the default center using:

- `VITE_MAP_DEFAULT_LAT`
- `VITE_MAP_DEFAULT_LNG`
- `VITE_MAP_DEFAULT_ZOOM`

## Assets

Place required images under `public/images`. See `public/images/README.md` for the expected filenames and usages.
