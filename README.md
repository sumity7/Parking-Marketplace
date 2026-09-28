# ParkSpot — Peer-to-Peer Parking Marketplace

A full-stack Next.js 14 (App Router) application where people with an empty
parking spot can list it, and people who need parking can search, book, and
pay for it by the hour. Built with MongoDB, NextAuth, and Tailwind CSS.

## Features

- **Auth** — email/password signup & login (NextAuth, JWT sessions)
- **Spot listings** — owners list a parking spot with address, price/hour,
  vehicle types, photo, and weekly availability
- **Admin moderation** — every new/edited listing is `pending` until an
  admin approves it
- **Search** — filter by city, vehicle type, max price
- **Booking flow** — renter picks a time range, price is calculated
  automatically, double-booking is prevented
- **Booking lifecycle** — pending → confirmed (by owner) → paid (by renter,
  simulated) → completed (by owner)
- **Ratings & reviews** — after a completed booking, renter rates the spot
  and owner rates the renter — builds trust on both sides
- **Verification** — users can request ID verification; admin grants a
  "Verified" badge shown on listings
- **Admin panel** — stats overview (users, spots, bookings, GMV, platform
  revenue), spot moderation queue, user management (verify/ban), full
  bookings list

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI, NEXTAUTH_SECRET, etc.
npm run dev
```

Open http://localhost:3000

### Creating your admin account

The **first person to ever register** is automatically made an admin. If you
want a specific email to be admin regardless of order, set `ADMIN_EMAIL` in
`.env.local` before registering with that email, or run:

```bash
npm run seed:admin
```

which creates/promotes the account defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD`
in `.env.local`.

## Project structure

```
app/
  page.js                 Home page (search + spot grid) — Server Component
  login/, register/       Auth pages
  spots/new/               Create a listing
  spots/[id]/               Spot detail + booking form + reviews
  dashboard/               My listings / my bookings / bookings on my spots
  admin/                   Admin overview, spot moderation, users, bookings
  api/                     All backend routes (see below)
models/                    Mongoose schemas: User, Spot, Booking, Review
lib/                       db.js (Mongo connection), auth.js (NextAuth config)
middleware.js              Protects /dashboard, /admin, /spots/new
```

### API routes

| Route | Purpose |
|---|---|
| `POST /api/register` | create account |
| `GET/POST /api/spots` | search public spots / create a listing |
| `GET/PUT/DELETE /api/spots/:id` | spot detail / edit / delete |
| `GET /api/my-spots` | logged-in user's own listings (any status) |
| `GET/POST /api/bookings` | my bookings / create a booking |
| `PATCH /api/bookings/:id` | confirm, cancel, mark_paid, complete, review |
| `POST /api/verify-request` | request ID verification |
| `GET /api/admin/stats` | dashboard numbers |
| `GET /api/admin/spots`, `PATCH/DELETE /api/admin/spots/:id` | moderation |
| `GET /api/admin/users`, `PATCH /api/admin/users/:id` | ban/verify users |
| `GET /api/admin/bookings` | all bookings, admin view |

## What's simulated / left for you to wire up for production

- **Payments** — `mark_paid` just flips a flag. Replace with a real
  Razorpay order + webhook that verifies the payment signature before
  setting `paymentStatus: "paid"`.
- **ID verification** — currently just a request/approve flag. A real
  version would let the user upload a photo of their ID for the admin to
  review.
- **Photos** — a single photo URL field. Swap in a real upload flow
  (e.g. Cloudinary, S3, or UploadThing) instead of pasting a URL.
- **Location search** — city is matched as text. For real "spots near me"
  search, add lat/lng fields + Google Maps/Mapbox and a geo query.
- **Notifications** — no emails/SMS are sent on booking events yet.

## Suggested next steps for your pitch/interview

1. Run this locally, seed an admin, create 2-3 test accounts, and record a
   short demo: list a spot → admin approves → another user books it → owner
   confirms → renter pays → owner completes → both leave reviews.
2. If going for a real launch: validate demand in one city first (see the
   manual-validation approach) before spending on ads/scaling.
