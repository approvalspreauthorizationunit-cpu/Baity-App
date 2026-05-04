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
| 2026-05-04 | Develop Edge Functions locally | ✅ Done |
| 2026-05-04 | Fix security: Migrate hardcoded keys to environment variables | ✅ Done |

## Pending Tasks
- Replace all mock data in React Native screens with real Supabase queries
- Build seller registration flow with document upload
- Connect order tracking to Supabase Realtime
- Build admin dashboard with Supabase integration
- Connect wallet and withdrawal system to Edge Functions
- Deploy Edge Functions to remote (currently local implementation only due to sandbox constraints)

## Business Rules
- Platform commission: 10% default (configurable per seller)
- Delivery fee: configurable per region
- Minimum withdrawal amount: 100 EGP (configurable in platform_settings)
- Seller permissions are locked until admin approves their profile
- Seller phone number is never visible to customers
- All financial calculations run in Edge Functions only, never on client
- Special requests are visible only to approved sellers in the same region

## Notes & Decisions
- Keys stored in .env.local and accessed via `process.env` only.
- RLS enforces all data access rules at the database level.
- Service role key used for administrative scripts and Edge Functions.
- .env.local is gitignored and never pushed to GitHub.
- **Deployment Issue**: `npx supabase functions deploy` failed due to a Docker/containerd error in the sandbox environment. Functions are ready in `supabase/functions/` for manual or external deployment.
- **Wallet Logic**: Added SQL functions `increment_wallet_balance` and `decrement_wallet_balance` via migration to ensure atomic updates to seller balances.
- **Setup Script**: Created `scripts/setup-supabase.js` to automate storage bucket creation using the service role key.
