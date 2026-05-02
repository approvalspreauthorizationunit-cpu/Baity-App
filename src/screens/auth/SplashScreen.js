import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar, Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const nativeDriver = Platform.OS !== 'web';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: nativeDriver }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: nativeDriver }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: nativeDriver }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#FF8C5A', colors.primary, '#C94A20']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>وضع تجريبي</Text>
      </View>

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="home" size={56} color={colors.white} />
        </View>
        <Text style={styles.appName}>بيتي</Text>
        <Animated.Text style={[styles.tagline, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          أكل بيتي بكل حب
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="restaurant-outline" size={28} color="rgba(255,255,255,0.95)" />
            <Text style={styles.featureText}>ربات بيوت محترفات</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bicycle-outline" size={28} color="rgba(255,255,255,0.95)" />
            <Text style={styles.featureText}>توصيل سريع</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart-outline" size={28} color="rgba(255,255,255,0.95)" />
            <Text style={styles.featureText}>طعم البيت</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Phone')}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>ابدأ الآن</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          بالمتابعة، توافق على شروط الاستخدام وسياسة الخصوصية
        </Text>
      </Animated.View>

      <View style={styles.circleDecoration1} />
      <View style={styles.circleDecoration2} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  demoBanner: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  demoBannerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 52,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '500',
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.white,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  terms: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  circleDecoration1: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
    top: -60,
    right: -60,
  },
  circleDecoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 75,
    bottom: 120,
    left: -50,
  },
});
