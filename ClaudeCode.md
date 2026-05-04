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
| 2026-05-04 | Seller registration flow with multi-step form | ✅ Done |
| 2026-05-04 | Document upload to Supabase Storage (seller-documents bucket) | ✅ Done |
| 2026-05-04 | SellerPendingScreen for pending/needs_info sellers | ✅ Done |
| 2026-05-04 | Health certificate expiry alert in SellerDashboard | ✅ Done |
| 2026-05-04 | Navigation updated for seller status routing | ✅ Done |
| 2026-05-04 | Admin Dashboard rebuilt with Supabase integration | ✅ Done |
| 2026-05-04 | Seller application review (approve/reject/needs_info) | ✅ Done |
| 2026-05-04 | Commission management per seller | ✅ Done |
| 2026-05-04 | Platform settings management (commission, delivery, min withdrawal) | ✅ Done |
| 2026-05-04 | Regions management (add/edit/toggle active) | ✅ Done |
| 2026-05-04 | Withdrawal requests management with Edge Function | ✅ Done |
| 2026-05-04 | Order monitoring tab in Admin Dashboard | ✅ Done |
| 2026-05-04 | Admin routing via role-based navigation guards | ✅ Done |
| 2026-05-04 | Fixed RLS errors using correct Service Role | ✅ Done |
| 2026-05-04 | Fixed platform crash (div replaced with View) | ✅ Done |

| 2026-05-04 | CheckoutScreen connected to Supabase with Edge Function for totals | ✅ Done |
| 2026-05-04 | Real order creation with order_items in Supabase | ✅ Done |
| 2026-05-04 | OrderTrackingScreen — removed mock timer, connected to Realtime | ✅ Done |
| 2026-05-04 | Post-delivery rating system implemented | ✅ Done |
| 2026-05-04 | SellerOrdersScreen — order status updates trigger Edge Function | ✅ Done |
| 2026-05-04 | SellerWalletScreen — real wallet data, transactions, withdrawal flow | ✅ Done |

## Pending Tasks
- Special Requests (bidding feature) — full flow
- Push notifications for new orders (future)
- Ratings display on seller profile
- Performance optimization and error boundary setup

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
- **Seller Registration**: Implemented a 3-step registration flow including document upload to Supabase Storage.
- **Routing**: Added logic in `AppNavigator` and `AppContext` to route sellers to `SellerPendingScreen` if their application is not yet approved.
- **Notifications**: Added a health certificate expiry banner in the Seller Dashboard to alert users 30 days before expiration.
