# Kyrgyz Travel

Kyrgyz Travel is a production-oriented tourism website for selling tours in
Kyrgyzstan. Guests can browse tours, explore route ideas, view real media, and
send a quick request with their name plus Telegram or phone contact. Website
leads are stored in Supabase and forwarded to the admin through Telegram.

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

- Supabase PostgreSQL for guest requests, tours, content data, and event tracking
- Supabase Edge Functions for guest request handling, Telegram notifications, and event tracking
- Supabase Storage for managed tourism media assets
- Supabase Row Level Security policies for protecting private lead and admin data
- Firebase Auth and Firestore for the existing account/admin flows
- Telegram Bot API for sending website lead notifications to the admin chat

### Deployment and tooling

- GitHub for source control
- GitHub Pages for the static website deployment
- Supabase hosted Edge Functions for backend endpoints
- npm scripts for development, build, deployment, and data/media upload helpers

## Launching the project

From the project folder:

```bash
npm install
```

Create a `.env` file (copy from `.env.example`) and fill in the missing values
from Firebase Console > Project settings > General > Your apps (Web app config)
and Supabase Project Settings > API.

```bash
copy .env.example .env
```

For guest submissions through Supabase, set:

```bash
VITE_SUPABASE_URL=https://ufxxhnqbiyaqnwfgrtlw.supabase.co
VITE_SUPABASE_GUEST_REQUEST_FUNCTION=guest-request
VITE_SUPABASE_TELEGRAM_FUNCTION=telegram-notify
```

`VITE_SUPABASE_ANON_KEY` is optional for the current guest flow because the app
submits booking requests through the public `guest-request` Edge Function.

Run the app:

```bash
npm run dev
```

Build and preview (optional):

```bash
npm run build
npm run preview
```

If Firebase is not configured, the UI will fall back to the local sample tours.

## Supabase guest requests

The Supabase migration is in `supabase/migrations/202604220001_guest_requests_and_telegram.sql`.
It creates:

- `bookings` for tour booking requests
- `custom_tour_requests` for custom itinerary requests
- `tours` for future Supabase-backed tour content
- `app_secrets` for server-side bot settings, protected by RLS with no public policies

Guest visitors can submit booking and custom tour forms without creating an
account when `VITE_SUPABASE_URL` is configured. The frontend posts to the
`guest-request` Edge Function, which inserts the row with the Supabase service
role and sends the Telegram notification server-side. Public clients cannot read
or update submitted guest data.

The Telegram notification Edge Functions are:

- `guest-request`: receives website booking/custom tour requests and sends Telegram alerts
- `telegram-webhook`: answers Telegram `/start` and stores the chat ID
- `telegram-notify`: helper for notifying from an existing Supabase row

The bot token, chat ID, and webhook secret are stored in `app_secrets`; do not
put them in `.env` or commit them to the repo.

## Security notes

- Do not commit `.env`, service account files, private keys, bot tokens, or service role keys.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, and webhook secrets only in Supabase secrets or protected local environment variables.
- Do not expose admin passwords through `VITE_` variables because Vite bundles them into public JavaScript.
- Firebase and Supabase public client keys can appear in the frontend, but database access must be protected with Firebase rules and Supabase RLS policies.

## Admin panel

- Login route: `/admin/login`
- Dashboard: `/admin/dashboard`
- Configure these values in `.env` before building:
  - `VITE_ADMIN_USERNAME`
  - `VITE_ADMIN_EMAIL` (create this email in Firebase Auth to access Firestore admin data)
- The admin password is the Firebase Auth password for `VITE_ADMIN_EMAIL`; do not put it in a `VITE_` variable because Vite client variables are bundled into the public site.

## Firebase Auth

This project uses Firebase Email/Password authentication for buyers and sellers. Enable
Email/Password in Firebase Console and create the admin user matching `VITE_ADMIN_EMAIL`
so the admin dashboard can read/write Firestore.

## Pages and routes

- `/` Home
- `/tours` Tours listing
- `/tours/:tourId` Tour detail + booking flow
- `/custom-tour` Custom tour request form
- `/create-tour` Seller tour submission (pending admin approval)
- `/join-tour` Join a group tour
- `/explore` Explore the seven oblasts (data from `src/data/kyrgyz_region_places.json`)
- `/blogs` Travel blogs + videos
- `/feedback` Feedback form and testimonials
- `/auth` Sign in / sign up
- `/dashboard` Buyer/Seller dashboard (profile + bookings/submissions)

The dashboard stores a local profile in `localStorage` and attempts to sync
bookings or seller submissions from Firestore when rules permit. If Firestore
access is blocked by security rules, the dashboard falls back to local data.

## Seed Firestore data and rules

The `scripts/setup_firebase.py` helper can seed the `tours` collection and
optionally deploy the Firestore rules in `firestore.rules`.

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r scripts/requirements.txt
python scripts/setup_firebase.py --project-id tourism-a4457 --service-account path\\to\\serviceAccount.json --apply-rules
```

You can also deploy rules with the Firebase CLI if you prefer:

```bash
firebase deploy --only firestore:rules
```

Storage rules are provided in `storage.rules` if you want to allow authenticated
uploads for tour imagery:

```bash
firebase deploy --only storage
```

## Maps

Tour detail pages show a map preview using OpenStreetMap tiles (Leaflet). You can tweak
the default center using:

- `VITE_MAP_DEFAULT_LAT`
- `VITE_MAP_DEFAULT_LNG`
- `VITE_MAP_DEFAULT_ZOOM`

## Email notifications (Cloud Functions)

Cloud Functions can send booking and custom tour confirmation emails via SMTP.

From the project root:

```bash
cd functions
npm install
```

Set SMTP + admin email config:

```bash
firebase functions:config:set smtp.host="smtp.example.com" smtp.port="587" smtp.user="user" smtp.pass="pass" smtp.from="noreply@example.com" notifications.admin_email="admin@example.com"
```

Deploy:

```bash
firebase deploy --only functions
```

## Assets

Place required images under `public/images`. See `public/images/README.md` for the expected filenames and usages.
