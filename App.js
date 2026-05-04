import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, I18nManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme/colors';

// Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import PhoneScreen from './src/screens/auth/PhoneScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import RoleSelectionScreen from './src/screens/auth/RoleSelectionScreen';
import SellerRegistrationScreen from './src/screens/auth/SellerRegistrationScreen';

// Admin Screens
import AdminLoginScreen from './src/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

// Customer Screens
import CustomerHomeScreen from './src/screens/customer/CustomerHomeScreen';
import SellerProfileScreen from './src/screens/customer/SellerProfileScreen';
import CartScreen from './src/screens/customer/CartScreen';
import CheckoutScreen from './src/screens/customer/CheckoutScreen';
import OrderTrackingScreen from './src/screens/customer/OrderTrackingScreen';
import OrderHistoryScreen from './src/screens/customer/OrderHistoryScreen';
import CustomerProfileScreen from './src/screens/customer/CustomerProfileScreen';

// Seller Screens
import SellerDashboardScreen from './src/screens/seller/SellerDashboardScreen';
import SellerOrdersScreen from './src/screens/seller/SellerOrdersScreen';
import SellerProductsScreen from './src/screens/seller/SellerProductsScreen';
import AddProductScreen from './src/screens/seller/AddProductScreen';
import SellerWalletScreen from './src/screens/seller/SellerWalletScreen';
import SellerSetupScreen from './src/screens/seller/SellerSetupScreen';
import SellerPendingScreen from './src/screens/seller/SellerPendingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Shared tab bar style
const tabBarStyle = {
  backgroundColor: colors.white,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  paddingBottom: 8,
  paddingTop: 6,
  height: 62,
  ...(Platform.OS === 'web' ? { flexDirection: 'row-reverse' } : {}),
};

// ─── Customer Tab Navigator ───────────────────────────────────────────────────
function CustomerTabs() {
  const { getCartCount } = useApp();
  const cartCount = getCartCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            'الرئيسية': focused ? 'home' : 'home-outline',
            'طلباتي':   focused ? 'receipt' : 'receipt-outline',
            'السلة':    focused ? 'cart' : 'cart-outline',
            'حسابي':    focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="الرئيسية" component={CustomerHomeStack} />
      <Tab.Screen name="طلباتي"   component={OrderHistoryScreen} />
      <Tab.Screen
        name="السلة"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
        }}
      />
      <Tab.Screen name="حسابي" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
}

function CustomerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome"  component={CustomerHomeScreen} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
    </Stack.Navigator>
  );
}

// CustomerRoot: tabs + modal screens reachable from ANY tab
function CustomerRoot() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs"  component={CustomerTabs} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="SellerSetup"   component={SellerSetupScreen} />
    </Stack.Navigator>
  );
}

// ─── Seller Tab Navigator ─────────────────────────────────────────────────────
function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            'لوحتي':    focused ? 'grid' : 'grid-outline',
            'الطلبات':  focused ? 'list' : 'list-outline',
            'منتجاتي':  focused ? 'fast-food' : 'fast-food-outline',
            'المحفظة':  focused ? 'wallet' : 'wallet-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="لوحتي"   component={SellerDashboardScreen} />
      <Tab.Screen name="الطلبات" component={SellerOrdersScreen} />
      <Tab.Screen name="منتجاتي" component={SellerProductsStack} />
      <Tab.Screen name="المحفظة" component={SellerWalletScreen} />
    </Tab.Navigator>
  );
}

function SellerProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="AddProduct"     component={AddProductScreen} />
    </Stack.Navigator>
  );
}

function SellerRoot() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerTabs"    component={SellerTabs} />
      <Stack.Screen name="SellerSetup"   component={SellerSetupScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  );
}

// ─── Main App Navigator ───────────────────────────────────────────────────────
function AppNavigator() {
  const { isLoggedIn, isLoading, user } = useApp();

  if (isLoading) return null;

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash"             component={SplashScreen} />
        <Stack.Screen name="Phone"              component={PhoneScreen} />
        <Stack.Screen name="OTP"                component={OTPScreen} />
        <Stack.Screen name="RoleSelection"      component={RoleSelectionScreen} />
        <Stack.Screen name="SellerRegistration" component={SellerRegistrationScreen} />
        <Stack.Screen name="AdminLogin"         component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard"     component={AdminDashboardScreen} />
      </Stack.Navigator>
    );
  }

  if (user?.role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      </Stack.Navigator>
    );
  }

  if (user?.role === 'seller') {
    if (user.sellerStatus === 'approved') {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SellerRoot" component={SellerRoot} />
          <Stack.Screen name="SellerRegistration" component={SellerRegistrationScreen} />
        </Stack.Navigator>
      );
    } else {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SellerPending"      component={SellerPendingScreen} />
          <Stack.Screen name="SellerRegistration" component={SellerRegistrationScreen} />
        </Stack.Navigator>
      );
    }
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerRoot"   component={CustomerRoot} />
    </Stack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
