# matribhumi-api
Node/Express + MongoDB API for Matribhumi Hajj Kafela.

## Setup
1. Install deps:
   - `npm i`
2. Create `.env` from `.env.example` and set values.
3. (Optional) Seed a sample published package:
   - `npm run seed`
4. Run:
   - `npm run dev`

## Endpoints
Public
- `GET /health`
- `GET /packages` (published only)
- `GET /packages/:id` (published only)
- `POST /bookings` (creates a pending booking + returns WhatsApp deep-link)
- `GET /whatsapp-link?bookingId=...`
- `POST /events` (analytics events)
- `GET /settings/public` (public CMS content)

Admin
- `POST /auth/login` (returns JWT)
- `GET /admin/me`
- `GET /admin/users` (admin-only)
- `POST /admin/users` (admin-only)
- `GET /admin/packages`
- `POST /admin/packages`
- `PATCH /admin/packages/:id`
- `DELETE /admin/packages/:id` (archives)
- `GET /admin/bookings`
- `PATCH /admin/bookings/:id`
- `GET /admin/settings`
- `PATCH /settings` (update settings)
- `GET /admin/media/cloudinary-signature`
- `GET /events/admin/summary`

## Notes
- Set `WHATSAPP_NUMBER` as digits only (no `+`).
- `CORS_ORIGINS` is a comma-separated allowlist.
- Set `JWT_SECRET` to a long random value in production.

## Admin setup
1. Fill `.env` (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
2. Seed the first admin:
   - `npm run seed:admin`
3. Login from admin dashboard and keep the JWT token.

## Deployment (recommended)
- API: Render
  - Build command: `npm install`
  - Start command: `npm start`
  - Env vars: from `.env.example` (do not commit real secrets)
- Set CORS origins to your deployed domains:
  - `https://<your-user-site>.vercel.app,https://<your-admin-site>.vercel.app`

## Credits
Created by Rahikul Makhtum Abir (rahikulmakhtum147@gmail.com)
