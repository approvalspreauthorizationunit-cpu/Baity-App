import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

function MenuItem({ icon, label, value, onPress, danger, arrow = true }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      {arrow && <Ionicons name="chevron-back" size={18} color={colors.textLight} />}
    </TouchableOpacity>
  );
}

export default function CustomerProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, switchMode } = useApp();

  const handleSwitchToSeller = () => {
    if (user?.sellerProfile?.isSetup) {
      switchMode('seller');
    } else {
      Alert.alert(
        'التحول لوضع البائعة',
        'ستحتاج إلى إعداد ملف البائعة الخاص بك أولاً',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'إعداد الملف',
            onPress: () => {
              switchMode('seller');
              navigation.navigate('SellerSetup');
            },
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person-outline" size={12} color={colors.primary} />
              <Text style={styles.roleText}>عميل</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Switch to Seller Mode */}
        <View style={styles.switchCard}>
          <View style={styles.switchCardContent}>
            <Text style={styles.switchTitle}>هل تريدين البيع؟</Text>
            <Text style={styles.switchSubtitle}>تحولي لوضع البائعة وابدئي في كسب دخل من المنزل</Text>
          </View>
          <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchToSeller}>
            <Text style={styles.switchBtnText}>
              {user?.sellerProfile?.isSetup ? 'وضع البائعة' : 'سجّلي الآن'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>الحساب</Text>
          <MenuItem icon="person-outline" label="معلوماتي الشخصية" value={user?.name} />
          <MenuItem icon="location-outline" label="عناوين التوصيل" value={`${user?.addresses?.length || 0} عناوين`} />
          <MenuItem icon="call-outline" label="رقم الهاتف" value={user?.phone} />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>الطلبات والمدفوعات</Text>
          <MenuItem icon="receipt-outline" label="سجل الطلبات" onPress={() => navigation.navigate('طلباتي')} />
          <MenuItem icon="heart-outline" label="المفضلة" />
          <MenuItem icon="star-outline" label="تقييماتي" />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>الإعدادات والدعم</Text>
          <MenuItem
            icon="notifications-outline"
            label="الإشعارات"
            onPress={() => Alert.alert('الإشعارات', 'إشعارات الطلبات والعروض مفعّلة.\nستصلك تنبيهات عند تحديث حالة طلبك.', [{ text: 'حسناً' }])}
          />
          <MenuItem
            icon="help-circle-outline"
            label="مركز المساعدة"
            onPress={() => Alert.alert('مركز المساعدة', 'الأسئلة الشائعة:\n\n• كيف أطلب؟ تصفح البائعات واضف للسلة\n• كيف أتتبع طلبي؟ من قسم "طلباتي"\n• سياسة الاسترجاع؟ تواصل معنا خلال ساعة', [{ text: 'حسناً' }])}
          />
          <MenuItem
            icon="chatbubble-outline"
            label="تواصل معنا"
            onPress={() => Alert.alert('تواصل معنا', 'نحن هنا لمساعدتك!\n\nواتساب: 01000000000\nالبريد: support@baiti.app\n\nأوقات العمل: 9 ص - 11 م يومياً', [{ text: 'حسناً' }])}
          />
          <MenuItem icon="information-circle-outline" label="عن التطبيق" value="v1.0.0" onPress={() => Alert.alert('بيتي v1.0.0', 'تطبيق بيتي — أكل بيتي بكل حب\nربط ربات البيوت بالعملاء\n\n© 2026 بيتي', [{ text: 'حسناً' }])} />
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="log-out-outline" label="تسجيل الخروج" onPress={handleLogout} danger arrow={false} />
        </View>

        {/* Hidden Admin Link */}
        <TouchableOpacity
          style={styles.adminHiddenBtn}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminHiddenText}>لوحة المشرف</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  adminHiddenBtn: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 10,
    opacity: 0.35,
  },
  adminHiddenText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  profileCard: {
    backgroundColor: colors.white, margin: 12, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFE8DC',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  userPhone: { fontSize: 13, color: colors.textLight, textAlign: 'right' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
    backgroundColor: '#FFF0E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  roleText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  switchCard: {
    backgroundColor: colors.primary, margin: 12, marginTop: 0, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  switchCardContent: { gap: 4 },
  switchTitle: { fontSize: 16, fontWeight: 'bold', color: colors.white, textAlign: 'right' },
  switchSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'right', lineHeight: 20 },
  switchBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'flex-end',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  switchBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  menuSection: {
    backgroundColor: colors.white, margin: 12, marginBottom: 0, borderRadius: 16, overflow: 'hidden',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 12, fontWeight: '600', color: colors.textLight, textAlign: 'right',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 12,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FFE8E8' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '500', color: colors.text, textAlign: 'right' },
  menuLabelDanger: { color: colors.error },
  menuValue: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2 },
});
