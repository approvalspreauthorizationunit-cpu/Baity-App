# Baiti App — Project Log
_Last updated: 2026-05-04_

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

## Database Tables
- regions
- users
- seller_profiles
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
| 2026-05-02 | Project Review and Overview | ✅ Done |
| 2026-05-04 | Full Supabase setup: tables, RLS, storage, realtime, migrations | ✅ Done |
| 2026-05-04 | Develop and Deploy Edge Functions | ✅ Done |

## Pending Tasks
- Replace all mock data in React Native screens with real Supabase queries
- Build seller registration flow with document upload
- Connect order tracking to Supabase Realtime
- Build admin dashboard with Supabase integration
- Connect wallet and withdrawal system to Edge Functions

## Business Rules
- Platform commission: 10% default (configurable per seller)
- Delivery fee: configurable per region
- Minimum withdrawal amount: 100 EGP (configurable in platform_settings)
- Seller permissions are locked until admin approves their profile
- Seller phone number is never visible to customers
- All financial calculations run in Edge Functions only, never on client
- Special requests are visible only to approved sellers in the same region

## Notes & Decisions
- **Secure Credentials**: All keys are strictly managed via environment variables and `.env.local`.
- **Deployment Strategy**: Replaced Docker-based deployment with a custom Node.js script using the Supabase Management API to bypass sandbox limitations.
- **Automation**: Created `scripts/deploy-supabase-functions.js` for programmatic deployment and `scripts/deploy-functions.sh` as a shell-based fallback.
- **Database Logic**: RPC functions for wallet management were successfully applied via CLI migrations.
