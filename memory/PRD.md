# PETZZY - Product Requirements Document

## Original Problem Statement
Full-stack Petzzy web app: puppies imagery, brand color #90EE90, PETZZY tagline, working About Us & Login (with sign-up for new users), Excel-downloadable registered-users sheet, GPS location tracker, management portal, live full-bin monitoring with dispensable pellets, AI camera feed of animals eating, "more tech" section.

## User Choices (Feb 2026)
- Auth: BOTH JWT email/password + Emergent Google Auth
- AI camera: looped demo videos with detection overlays
- Bins: 10 seeded across Chennai, live-updating on Leaflet+OSM
- Excel export: admin-only from Management Portal
- Map provider: Leaflet + OpenStreetMap (no key)

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT (7d) via httpOnly cookie + Bearer fallback; bcrypt; role-gated admin. Startup seeds admin, 10 bins, 4 camera feeds.
- Frontend: React 19 + Tailwind, shadcn colors, Cabinet Grotesk + Satoshi fonts, dark forest palette with #90EE90 accents, react-leaflet 5 map, sonner toasts.

## What's Implemented (v1 — Feb 2026)
- Landing (hero + tech + about + contact + live stats)
- About Us page
- Login (JWT + Google button) + Register with phone/city
- User Dashboard: Leaflet Chennai map with 10 bins, bin cards (fill %, pellets, battery, solar, temp, fed count), 4 AI camera feeds with bounding boxes
- Management Portal (admin only): bins table with refill action, users table with **Download Excel** (`petzzy_users.xlsx`)
- Auth persistence + logout
- Google Auth callback flow (`#session_id` handled in AppRouter)

## Test Credentials
- Admin: admin@petzzy.com / petzzyadmin123
- User: test@petzzy.com / test1234

## Backlog (P1/P2)
- P1: Real IoT MQTT ingestion endpoint for physical bins
- P1: Email notifications when a bin hits 90% fill
- P2: Public map (unauth) with fewer details
- P2: Multi-city onboarding + CSR sponsor pages
- P2: Animal-recognition ML actually wired (currently mocked overlays)
