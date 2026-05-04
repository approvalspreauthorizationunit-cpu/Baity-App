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
| 2026-05-04 | Supabase Auth integration (Phone OTP & Admin Password) | ✅ Done |
| 2026-05-04 | Removed all mock authentication logic | ✅ Done |
| 2026-05-04 | Admin seeded in database (admin@baiti.app) | ✅ Done |
| 2026-05-04 | Test data seeded (3 regions, 3 sellers, 12 products, 1 customer) | ✅ Done |
| 2026-05-04 | CustomerHomeScreen connected to Supabase | ✅ Done |
| 2026-05-04 | SellerProfileScreen connected to Supabase | ✅ Done |
| 2026-05-04 | SellerProductsScreen connected to Supabase | ✅ Done |
| 2026-05-04 | AddProductScreen connected to Supabase | ✅ Done |
| 2026-05-04 | OrderHistoryScreen connected to Supabase | ✅ Done |
| 2026-05-04 | SellerOrdersScreen connected to Supabase + Realtime | ✅ Done |
| 2026-05-04 | SellerDashboardScreen connected to Supabase | ✅ Done |

## Pending Tasks
- Build seller registration flow with document upload
- Connect order placement to Supabase (CheckoutScreen)
- Connect order tracking to Supabase Realtime (OrderTrackingScreen)
- Build admin dashboard with Supabase integration
- Connect wallet and withdrawal system to Edge Functions
- Build special requests (bidding) feature

## Business Rules
- Platform commission: 10% default (configurable per seller)
- Delivery fee: configurable per region
- Minimum withdrawal amount: 100 EGP (configurable in platform_settings)
- Seller permissions are locked until admin approves their profile
- Seller phone number is never visible to customers
- All financial calculations run in Edge Functions only, never on client
- Special requests are visible only to approved sellers in the same region

## Notes & Decisions
- **Supabase Auth**: Implemented international phone number formatting (+20) for SMS OTP.
- **Data Integration**: Successfully replaced all major mock data flows with real-time Supabase queries.
- **Unique Constraints**: Added unique constraints to `regions(name)` and `products(name, seller_id)` via migration to facilitate upsert operations in seeding scripts.
- **Realtime**: Leveraged Supabase Realtime for order status updates in the seller's workflow.
