# Beiti (بيتي) Application Overview

Beiti ("My Home") is a specialized food delivery platform designed to connect talented home-based cooks (sellers) with customers seeking authentic, high-quality home-cooked meals. The platform empowers home cooks to monetize their skills while providing customers with a healthier and more personal alternative to commercial restaurants.

## Core App Features

- **Multi-Role Experience**: Supports Customers, Sellers, and Administrators within a single application.
- **Dynamic Marketplace**: Customers can browse sellers by specialty, distance, and rating.
- **Full Order Lifecycle**: From cart management and checkout to real-time (demo) order tracking.
- **Seller Management**: Tools for sellers to manage their products, track orders, and view earnings.
- **Social Impact**: Integrated donation feature allowing customers to contribute to charity with their orders.
- **Admin Control**: Comprehensive dashboard for platform oversight, seller approval, and order monitoring.

---

## Technical Stack

- **Framework**: React Native (via Expo)
- **Language**: JavaScript
- **Navigation**: React Navigation (Stack and Bottom Tabs)
- **State Management**: React Context API with `useReducer`
- **Data Persistence**: `@react-native-async-storage/async-storage`
- **UI/UX**: Custom themed components using `react-native-safe-area-context` and `expo-linear-gradient`.
- **Icons**: `@expo/vector-icons` (Ionicons & MaterialIcons)

---

## Application Workflows

### 1. Authentication & Onboarding
- **Splash Screen**: Brand introduction with high-quality animations.
- **Phone Login**: Simple phone-based entry (Demo mode uses any 10-digit number).
- **OTP Verification**: Security step (Demo code: `1234`).
- **Role Selection**: User chooses to enter as a "Customer" or "Seller".
- **Admin Entry**: Hidden access point from the login/profile screens for platform management.

### 2. Customer Workflow
- **Home Screen**: Features a search bar, category filters (Koshary, Sweets, Grills, etc.), and a list of nearby available sellers.
- **Seller Profile**: Detailed view of a cook's bio, ratings, and categorized menu.
- **Cart System**: Multi-item cart restricted to a single seller at a time to simplify logistics.
- **Donation Logic**: Option to add a monetary donation or a "Full Meal" for charity during checkout.
- **Checkout**: Address selection, delivery time scheduling, and order confirmation.
- **Order Tracking**: Visual timeline showing the status of the order (Pending → Accepted → Preparing → Ready → Delivered).
- **Order History**: Review past orders and quickly reorder from favorite cooks.

### 3. Seller Workflow
- **Dashboard**: High-level stats on active orders, today's sales, and wallet balance.
- **Order Management**: Real-time interface to Accept/Reject new orders and advance their status.
- **Product Management**: Interface to add, edit, or delete menu items, including setting availability.
- **Wallet & Earnings**: Detailed breakdown of earnings, platform commission (10%), and balance recharge via popular local methods (e.g., Vodafone Cash).
- **Setup Wizard**: Onboarding flow for new cooks to set up their kitchen name, bio, and working hours.

### 4. Admin Workflow
- **Overview Tab**: Platform-wide metrics including total revenue, pending orders, and active users.
- **Seller Management**: Ability to approve new sellers or suspend existing ones.
- **Order Monitoring**: Full visibility into every transaction on the platform for support and oversight.

---

## Key Logic & State Management

### Global State (`AppContext.js`)
The app uses a centralized `AppProvider` to manage:
- **Authentication State**: `isLoggedIn`, `user` profile, and session loading.
- **Marketplace Data**: `sellers` and their associated `products`.
- **Transaction State**: `cart` (items, seller info, donations) and `orders`.

### Business Rules
- **Platform Commission**: The app logic calculates a 10% commission on all completed sales.
- **RTL Support**: The UI is designed primarily for the Arabic language, following Right-to-Left (RTL) layout principles.
- **Demo Mode Tracking**: For demonstration purposes, orders in the `OrderTrackingScreen` automatically advance through statuses every few seconds to showcase the flow.
- **Single-Seller Cart**: Adding an item from a different seller prompts the user to clear their current cart.

---

## File Structure

```text
src/
├── components/     # Shared UI components (Cards, Stats, etc.)
├── context/        # AppContext and Reducer logic
├── data/           # Mock data and constants
├── screens/        # Screen components organized by role
│   ├── admin/      # Admin dashboard and login
│   ├── auth/       # Login, OTP, and Role Selection
│   ├── customer/   # Customer-facing marketplace and ordering
│   └── seller/     # Seller-facing kitchen management
└── theme/          # Global color palette and styles
```
