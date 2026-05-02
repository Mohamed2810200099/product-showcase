# The Girl House — PRD

## Original Problem Statement
Build a premium, modern, animated e-commerce website for an Egypt-based beauty and cosmetics brand called "The Girl House". Sells authentic Germany-sourced (German DM) beauty & cosmetics products (haircare, skincare, masks, oils, serums, creams, shampoos, conditioners, bundles). Audience: women in Egypt 18–45. Website must be Arabic-first (RTL), elegant, feminine, trustworthy, premium, fast, conversion-focused, mobile-first. Currency EGP. Full shop with Home, Shop, Product details, Cart, Checkout, Order success, Admin login, Admin dashboard (products/orders/coupons/settings).

## Architecture
- **Backend:** FastAPI + MongoDB (motor), JWT auth (bcrypt, httpOnly cookies), all routes under /api.
- **Frontend:** React 19 + Tailwind + shadcn/ui + framer-motion + sonner toasts. Arabic RTL.
- **Design:** El Messiri (Arabic display) + Cormorant Garamond (Latin display) + Tajawal (body). Blush/nude/champagne/gold palette on light background. Glassmorphism header. No generic AI-slop gradients.
- **Data:** Seeded on startup — 16 categories (7 shop + 9 concerns), 12 sample products (Balea, Langhaarmädchen, Plex Care, Alverde, DM Selection, The Girl House bundles), default settings, WELCOME10 coupon.

## Admin Credentials
- Email: `admin@thegirlhouse.eg`
- Password: `Admin@123`

## What's Implemented (2026-05-02)
- Full storefront: Home (hero + trust badges + categories + best sellers + new arrivals + offers + "why German DM" + testimonials + Instagram CTA + newsletter capture), Shop with filters (category, concern, offer/best/new, search, sort), Product Details (gallery, benefits, how-to-use, ingredients, delivery, FAQ, related), Cart page + Cart drawer, Multi-field Checkout (Egyptian governorates, COD/WhatsApp/Vodafone Cash/InstaPay/Stripe placeholder, coupon), Order Success.
- Floating WhatsApp button, mobile bottom bar, announcement marquee, sticky header with search.
- Admin: login, dashboard (sales chart 7d, stat cards, low-stock, recent orders), Products CRUD (image URLs, concerns, badges), Orders list with status flow (new→confirmed→preparing→shipped→delivered/cancelled), Coupons, Settings (branding, socials, delivery fees per governorate, payment methods toggle).
- Stripe endpoint returns 501 placeholder — structure in place for future enablement.
- Public endpoint `/api/orders/public/{order_number}` for order success page.

## Prioritized Backlog
- **P1** — Stripe live integration (requires business Stripe account in supported country).
- **P1** — Testimonials and hero banners management from admin (currently hardcoded testimonials).
- **P2** — Real product reviews (users can review after purchase).
- **P2** — Email/SMS order notifications (Twilio/SendGrid).
- **P2** — Paymob / Fawry Egyptian gateway integration.
- **P2** — Image upload via object storage (currently uses URLs).
- **P3** — Wishlist / favorites persistence.
- **P3** — Multi-admin roles.
