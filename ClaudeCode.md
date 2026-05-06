# Baiti App — Project Log
_Last updated: 2026-05-05_

## Project Overview
Baiti is a home-cook food delivery platform connecting home-based sellers with customers.
Supports three roles: Customer, Seller, Admin.

## Tech Stack
- Frontend: React Native (Expo)
- Backend: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- State Management: React Context API (to be migrated to Supabase Realtime)

## Environment Variables
Stored in .env.local (never hardcoded)
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ACCESS_TOKEN
- EXPO_PROJECT_ID

## Database Tables
- regions
- users
- seller_profiles (updated with is_verified, verified_at, verified_by)
- products
- orders
- order_items
- special_requests
- special_request_offers
- wallet_transactions
- withdrawal_requests
- ratings
- platform_settings

## Storage Buckets
- seller-documents (private)
- product-images (public)
- avatars (public)

## Edge Functions
- calculate-order-totals
- process-order-completion
- process-withdrawal

## Realtime Enabled On
- orders
- special_request_offers
- withdrawal_requests

## Completed Tasks
| Date | Task | Status |
|------|------|--------|
| 2026-05-05 | App published permanently to Expo preview channel | ✅ Done |
| 2026-05-05 | Permanent QR code generated for testing | ✅ Done |
| 2026-05-05 | Seller verification badge feature (blue checkmark #1D9BF0) | ✅ Done |
| 2026-05-05 | Database migration for is_verified, verified_at, verified_by | ✅ Done |
| 2026-05-05 | VerifiedBadge component created | ✅ Done |
| 2026-05-05 | Badge displayed in all customer-facing seller name locations | ✅ Done |
| 2026-05-05 | Admin can grant/revoke verification from seller details modal | ✅ Done |
| 2026-05-05 | EAS Update configured for automatic OTA updates | ✅ Done |
| 2026-05-05 | UPDATE_GUIDE.md created for future update instructions | ✅ Done |
| 2026-05-05 | Expo Go preview setup and verified | ✅ Done |
| 2026-05-05 | Special Requests screen for customers (post + view + accept offers) | ✅ Done |
| 2026-05-05 | Special Requests screen for sellers (view + submit offers) | ✅ Done |
| 2026-05-05 | Realtime updates for offers and requests in region | ✅ Done |
| 2026-05-05 | Order created automatically when offer is accepted | ✅ Done |
| 2026-05-05 | Seller average rating displayed dynamically across the app | ✅ Done |
| 2026-05-05 | Detailed reviews section added to SellerProfileScreen | ✅ Done |
| 2026-05-05 | Special Requests tabs added to navigation for both roles | ✅ Done |
| 2026-05-05 | ErrorBoundary component added | ✅ Done |
| 2026-05-05 | LoadingScreen global component added | ✅ Done |
| 2026-05-05 | EmptyState component added to all relevant screens | ✅ Done |
| 2026-05-05 | Cart session bug fixed on logout | ✅ Done |
| 2026-05-05 | Numeric input validation fixed in AddProductScreen | ✅ Done |
| 2026-05-05 | Supabase connection check added | ✅ Done |
| 2026-05-05 | Performance optimization (useMemo, useCallback) | ✅ Done |
| 2026-05-05 | Security audit — seller phone hidden from customers | ✅ Done |
| 2026-05-05 | Final cleanup — mockData removed, console.logs cleaned | ✅ Done |
| 2026-05-04 | Admin Dashboard rebuilt with Supabase integration | ✅ Done |
| 2026-05-04 | Seller registration flow with multi-step form | ✅ Done |
| 2026-05-04 | Full Supabase setup: tables, RLS, storage, realtime, migrations | ✅ Done |

## Pending Tasks
- Build Admin Dashboard as separate web page
- APK build — ready when Expo free tier resets next month
- Push notifications (future enhancement)
- Image upload for products (future enhancement)
- Multi-language support Arabic/English (future enhancement)
- Remove test/seed data from Supabase before public launch

## Business Rules
- Platform commission: 10% default (configurable per seller)
- Delivery fee: configurable per region
- Minimum withdrawal amount: 100 EGP (configurable in platform_settings)
- Seller permissions are locked until admin approves their profile
- Seller phone number is never visible to customers
- All financial calculations run in Edge Functions only, never on client
- Special requests are visible only to approved sellers in the same region

## Notes & Decisions
- **Verification Badge**: Uses Twitter/X blue color #1D9BF0. Only admin can grant or revoke verification. verified_at and verified_by recorded for audit trail.
- **EAS Update**: Channel set to 'preview'. Use this for all code updates. New APK only needed when adding new libraries or changing app config.
- **Expo Go**: Setup for immediate testing during development using dynamic app.config.js.
- **App Readiness**: The app is production-ready for initial launch with all mock data removed.
- **Error Handling**: Error boundaries protect all user flows, and global loading/empty states provide consistent UX.
- **Offer Acceptance**: Accepting an offer automatically closes the request, rejects all other offers, and creates a real order.
- **Supabase Auth**: Implemented international phone number formatting (+20) for SMS OTP.
- **Permanent Preview**: The app is published to the `preview` channel on Expo. Access via `exp://u.expo.dev/85c2594f-b539-42d4-900f-835a7d14ec4b?channel-name=preview`.
