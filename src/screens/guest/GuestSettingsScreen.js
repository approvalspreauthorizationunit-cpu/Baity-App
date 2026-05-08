import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export default function GuestSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Logo and Version */}
        <View style={styles.appInfo}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={40} color={colors.white} />
          </View>
          <Text style={styles.appName}>بيتي</Text>
          <Text style={styles.version}>الإصدار 1.0.0</Text>
        </View>

        {/* Seller Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>هل أنت بائع؟</Text>
          <TouchableOpacity
            style={styles.sellerBtn}
            onPress={() => navigation.navigate('Phone', { preSelectedRole: 'seller' })}
          >
            <Ionicons name="restaurant-outline" size={24} color={colors.white} />
            <Text style={styles.sellerBtnText}>دخول البائعين</Text>
          </TouchableOpacity>
          <Text style={styles.sectionDesc}>
            ابدأ ببيع أكل بيتك المفضل واكسب دخلاً إضافياً من منزلك
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Admin Section - Subtle */}
        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminLinkText}>دخول المشرف</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  version: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  section: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sellerBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
  },
  sellerBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
  adminLink: {
    padding: 10,
  },
  adminLinkText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
