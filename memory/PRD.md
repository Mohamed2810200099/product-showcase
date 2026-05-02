# The Girl House — PRD

## Original Problem Statement
Build a premium, modern, animated e-commerce website for an Egypt-based beauty and cosmetics brand called "The Girl House". Sells authentic Germany-sourced (German DM) beauty & cosmetics products. Audience: women in Egypt 18–45. Arabic-first (RTL), elegant, feminine, trustworthy, mobile-first. Currency EGP.

## Architecture
- **Backend:** FastAPI + MongoDB (motor), JWT auth (bcrypt, httpOnly cookies), Emergent Object Storage for images, all routes under /api.
- **Frontend:** React 19 + Tailwind + shadcn/ui + framer-motion + sonner toasts. Arabic RTL. El Messiri + Cormorant Garamond + Tajawal fonts. Blush/nude/champagne/gold palette.

## Admin Credentials
- Email: `admin@thegirlhouse.eg`
- Password: `Admin@123`

## Brand Info (live in DB settings)
- WhatsApp: **201554087371**
- Instagram: https://www.instagram.com/thegirlhouse_eg
- TikTok: https://www.tiktok.com/@thegirlhouse_eg
- Facebook: https://www.facebook.com/share/18hzaYDPkr/
- Announcement: "منتجات DM الألمانية وصلت مصر أخيرًا 🇩🇪✨ الكمية محدودة — اطلبي قبل النفاد"

## Phase 1 — MVP (2026-05-02)
- Full storefront (Home, Shop with filters, Product Details, Cart, Checkout, Order Success).
- Admin login + dashboard + products CRUD + orders + coupons + settings.
- 12 seeded products, 16 categories, WELCOME10 coupon.
- Stripe placeholder (501).
- 43/43 backend tests pass.

## Phase 2 — Same day (2026-05-02)
- **Real image upload** via Emergent Object Storage (JPG/PNG/WebP, 6MB max). Drag-and-drop `ImageUploader` with reorder + delete.
- **Reviews system**: public submission → admin approval → auto-calculated product rating & reviews_count. `AdminReviews` page.
- **Testimonials CRUD**: `AdminTestimonials` admin page, 5 seeded. Home consumes `/api/testimonials`.
- **Admin password change** from Settings with current-password verification + 8-char min.
- **WhatsApp admin notification** on order success — auto-opens wa.me with full order details to brand WhatsApp.
- **Paymob / Fawry** placeholder endpoints (501); toggles exist in settings.
- **Home enhancements**: "اطلبي عبر واتساب" hero CTA, 5-badge trust strip, **Limited Stock urgency section**, **Routine section** (3 routines, no medical claims), dynamic testimonials.
- **Brand settings** loaded from user's real accounts.
- **Deleting approved review** recalculates product aggregates.
- Phase 1 43/43 + Phase 2 27/27 = 70/70 backend tests pass.

## Prioritized Backlog
- **P1** — Paymob live integration (needs Paymob API key, Integration IDs, iframe ID, HMAC secret).
- **P1** — Fawry live integration (needs Merchant Code, Security Key).
- **P1** — Stripe live integration (needs business Stripe account in supported country).
- **P2** — Twilio server-side WhatsApp notifications (replaces client-side wa.me).
- **P2** — SendGrid email notifications for orders.
- **P2** — Excel/CSV product bulk import.
- **P3** — Rate-limit public review submissions (spam protection).
- **P3** — Wishlist / favorites.
- **P3** — Multi-admin roles.
