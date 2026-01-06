# Tourism (React + Firebase)

This project is built from the provided tourism design and wired to Firebase
for tours data and request submissions.

## Launching the project

From the project folder:

```bash
cd tourism_design
npm install
```

Create a `.env` file (copy from `.env.example`) and fill in the missing values
from Firebase Console > Project settings > General > Your apps (Web app config).
The `projectId` and `messagingSenderId` are already provided in `.env.example`.

```bash
copy .env.example .env
```

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

## Admin panel

- Login route: `/admin/login`
- Dashboard: `/admin/dashboard`
- Default credentials (for this assignment): `admin` / `admin123`
- Optional overrides via `.env`:
  - `VITE_ADMIN_USERNAME`
  - `VITE_ADMIN_PASSWORD`
  - `VITE_ADMIN_EMAIL` (create this email in Firebase Auth to access Firestore admin data)

## Firebase Auth

This project uses Firebase Email/Password authentication for buyers and sellers. Enable
Email/Password in Firebase Console and create the admin user matching `VITE_ADMIN_EMAIL`
and `VITE_ADMIN_PASSWORD` so the admin dashboard can read/write Firestore.

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
