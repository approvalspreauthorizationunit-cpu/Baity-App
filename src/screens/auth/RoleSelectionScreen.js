import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function RoleSelectionScreen({ navigation, route }) {
  const { userId, phone } = route.params;
  const { login } = useApp();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role) => {
    if (loading) return;
    setSelected(role);
    setLoading(true);

    try {
      // 1. Create user profile in Supabase
      const { data: newProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone: phone,
          role: role,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        Alert.alert('خطأ', 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
        setLoading(false);
        return;
      }

      // 2. If role is seller, create seller_profiles record
      if (role === 'seller') {
        const { error: sellerError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: userId,
            status: 'pending'
          });

        if (sellerError) {
          console.error('Error creating seller profile:', sellerError.message);
        }
      }

      // 3. Update App Context
      await login({ ...newProfile, sellerStatus: role === 'seller' ? 'pending' : null });

      // 4. Navigation
      if (role === 'seller') {
        navigation.replace('SellerRegistration');
      } else {
        navigation.navigate('CustomerRoot');
      }

    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Ionicons name="hand-left-outline" size={48} color={colors.primary} style={{ marginBottom: 12 }} />
        <Text style={styles.title}>أهلاً بك في بيتي!</Text>
        <Text style={styles.subtitle}>اختر دورك في التطبيق</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Customer Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selected === 'customer' && styles.cardSelected,
          ]}
          onPress={() => handleSelect('customer')}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={selected === 'customer' ? ['#FF8C5A', colors.primary] : ['#FFF8F5', '#FFF0E8']}
            style={styles.cardGradient}
          >
            <Ionicons name="bag-handle-outline" size={48} color={selected === 'customer' ? '#fff' : colors.primary} />
            <Text style={[styles.cardTitle, selected === 'customer' && styles.cardTitleSelected]}>
              أنا عميل
            </Text>
            <Text style={[styles.cardDesc, selected === 'customer' && styles.cardDescSelected]}>
              أتصفح الأكل وأطلب من ربات البيوت
            </Text>
            <View style={[styles.cardFeatures, selected === 'customer' && styles.cardFeaturesSelected]}>
              {['تصفح البائعين', 'طلب الأكل', 'تتبع الطلب'].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, selected === 'customer' && styles.featureCheckSelected]}>✓</Text>
                  <Text style={[styles.featureText, selected === 'customer' && styles.featureTextSelected]}>{f}</Text>
                </View>
              ))}
            </View>
            {selected === 'customer' && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>تم الاختيار ✓</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Seller Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selected === 'seller' && styles.cardSelected,
          ]}
          onPress={() => handleSelect('seller')}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={selected === 'seller' ? ['#FF8C5A', colors.primary] : ['#FFF8F5', '#FFF0E8']}
            style={styles.cardGradient}
          >
            <Ionicons name="restaurant-outline" size={48} color={selected === 'seller' ? '#fff' : colors.primary} />
            <Text style={[styles.cardTitle, selected === 'seller' && styles.cardTitleSelected]}>
              أنا ربة منزل
            </Text>
            <Text style={[styles.cardDesc, selected === 'seller' && styles.cardDescSelected]}>
              أبيع أكلي البيتي وأكسب من المنزل
            </Text>
            <View style={[styles.cardFeatures, selected === 'seller' && styles.cardFeaturesSelected]}>
              {['إدارة المنتجات', 'استقبال الطلبات', 'محفظة وأرباح'].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, selected === 'seller' && styles.featureCheckSelected]}>✓</Text>
                  <Text style={[styles.featureText, selected === 'seller' && styles.featureTextSelected]}>{f}</Text>
                </View>
              ))}
            </View>
            {selected === 'seller' && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>تم الاختيار ✓</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>يمكنك تغيير الدور لاحقاً من الإعدادات</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardTitleSelected: {
    color: '#fff',
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardDescSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  cardFeatures: {
    width: '100%',
    gap: 6,
  },
  cardFeaturesSelected: {},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  featureCheckSelected: {
    color: '#fff',
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
  },
  featureTextSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  selectedBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  note: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
});
