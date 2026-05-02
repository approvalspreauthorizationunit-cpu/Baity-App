import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const rechargeAmounts = [50, 100, 200, 500];
const commissionRate = 0.10;

function TransactionRow({ icon, label, amount, time, type }) {
  return (
    <View style={styles.transRow}>
      <View style={[styles.transIcon, { backgroundColor: type === 'credit' ? '#E8F5E9' : '#FFF0E8' }]}>
        <Ionicons name={icon} size={18} color={type === 'credit' ? colors.success : colors.primary} />
      </View>
      <View style={styles.transInfo}>
        <Text style={styles.transLabel}>{label}</Text>
        <Text style={styles.transTime}>{time}</Text>
      </View>
      <Text style={[styles.transAmount, { color: type === 'credit' ? colors.success : colors.error }]}>
        {type === 'credit' ? '+' : '-'}{amount} ج
      </Text>
    </View>
  );
}

export default function SellerWalletScreen() {
  const insets = useSafeAreaInsets();
  const { user, sellers, orders } = useApp();
  const myProfile = sellers.find(s => s.id === user?.sellerProfile?.sellerId) || sellers[0];
  const myOrders = orders.filter(o => o.sellerId === myProfile?.id && o.status === 'delivered');
  const [selectedAmount, setSelectedAmount] = useState(null);

  const totalEarnings = myOrders.reduce((s, o) => s + o.total, 0);
  const totalCommission = Math.floor(totalEarnings * commissionRate);

  const handleRecharge = () => {
    if (!selectedAmount) { Alert.alert('تنبيه', 'اختاري مبلغ الشحن'); return; }
    Alert.alert(
      'شحن الرصيد',
      `سيتم شحن ${selectedAmount} جنيه عبر فودافون كاش\nرقم فودافون: 01010101010`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: () => Alert.alert('تم', `تم إرسال طلب شحن ${selectedAmount} جنيه. سيتم التفعيل خلال دقائق.`),
        },
      ]
    );
  };

  // Build mock transactions from orders
  const transactions = [
    ...myOrders.slice(0, 5).map(o => ({
      id: o.id + '_commission',
      icon: 'remove-circle-outline',
      label: `عمولة طلب #${o.id.slice(-4)}`,
      amount: Math.floor(o.total * commissionRate),
      time: new Date(o.updatedAt).toLocaleDateString('ar-EG'),
      type: 'debit',
    })),
    { id: 'r1', icon: 'add-circle-outline', label: 'شحن رصيد', amount: 500, time: '5 أبريل 2026', type: 'credit' },
    { id: 'r2', icon: 'add-circle-outline', label: 'شحن رصيد', amount: 200, time: '1 أبريل 2026', type: 'credit' },
  ].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المحفظة</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.balanceAmount}>{myProfile?.walletBalance || 0}</Text>
          <Text style={styles.balanceCurrency}>جنيه مصري</Text>
          <View style={styles.balanceNote}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.balanceNoteText}>
              يجب أن يكون الرصيد أكبر من 0 لتظهري للعملاء
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color={colors.success} style={styles.statEmoji} />
            <Text style={styles.statValue}>{totalEarnings}</Text>
            <Text style={styles.statLabel}>إجمالي المبيعات</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pie-chart-outline" size={20} color={colors.error} style={styles.statEmoji} />
            <Text style={[styles.statValue, { color: colors.error }]}>{totalCommission}</Text>
            <Text style={styles.statLabel}>إجمالي العمولات</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bag-check-outline" size={20} color={colors.primary} style={styles.statEmoji} />
            <Text style={styles.statValue}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>طلب مكتمل</Text>
          </View>
        </View>

        {/* Commission Info */}
        <View style={styles.commissionCard}>
          <View style={styles.commissionHeader}>
            <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
            <Text style={styles.commissionTitle}>نسبة العمولة</Text>
          </View>
          <View style={styles.commissionBody}>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>نسبة المنصة</Text>
              <Text style={styles.commissionValue}>10%</Text>
            </View>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>نصيبك من كل طلب</Text>
              <Text style={[styles.commissionValue, { color: colors.success }]}>90%</Text>
            </View>
            <View style={[styles.commissionItem, { backgroundColor: '#FFF0E8', borderRadius: 8, padding: 8, marginTop: 4 }]}>
              <Text style={styles.commissionLabel}>مثال: طلب بـ 100 جنيه</Text>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={{ fontSize: 12, color: colors.success }}>تكسبي 90 ج</Text>
                <Text style={{ fontSize: 12, color: colors.error }}>عمولة 10 ج</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recharge */}
        <View style={styles.rechargeSection}>
          <Text style={styles.sectionTitle}>شحن الرصيد</Text>
          <Text style={styles.rechargeSubtitle}>اختاري طريقة الدفع المناسبة</Text>

          <View style={styles.paymentMethods}>
            <View style={styles.paymentMethod}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              <Text style={styles.paymentName}>فودافون كاش</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
              <Text style={styles.paymentName}>بطاقة بنكية</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons name="storefront-outline" size={24} color={colors.primary} />
              <Text style={styles.paymentName}>منافذ الدفع</Text>
            </View>
          </View>

          <Text style={styles.amountLabel}>اختاري المبلغ</Text>
          <View style={styles.amountsRow}>
            {rechargeAmounts.map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.amountChip, selectedAmount === amount && styles.amountChipActive]}
                onPress={() => setSelectedAmount(amount)}
              >
                <Text style={[styles.amountText, selectedAmount === amount && styles.amountTextActive]}>
                  {amount} ج
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.rechargeBtn} onPress={handleRecharge}>
            <Ionicons name="add-circle-outline" size={20} color={colors.white} />
            <Text style={styles.rechargeBtnText}>
              {selectedAmount ? `شحن ${selectedAmount} جنيه` : 'شحن الرصيد'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>سجل المعاملات</Text>
          {transactions.map(tx => (
            <TransactionRow key={tx.id} {...tx} />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  balanceCard: {
    margin: 12, borderRadius: 20, padding: 24, alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  balanceAmount: { color: colors.white, fontSize: 52, fontWeight: 'bold' },
  balanceCurrency: { color: 'rgba(255,255,255,0.85)', fontSize: 16 },
  balanceNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  balanceNoteText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', flex: 1, lineHeight: 18 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 3,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textLight, textAlign: 'center' },
  commissionCard: {
    backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 14,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  commissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  commissionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  commissionBody: { gap: 8 },
  commissionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commissionLabel: { fontSize: 13, color: colors.textLight },
  commissionValue: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  rechargeSection: {
    backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 4 },
  rechargeSubtitle: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginBottom: 14 },
  paymentMethods: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentMethod: {
    flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 10,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.border,
  },
  paymentName: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '500' },
  amountLabel: { fontSize: 13, color: colors.text, textAlign: 'right', marginBottom: 8, fontWeight: '600' },
  amountsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  amountChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  amountChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  amountText: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  amountTextActive: { color: colors.white },
  rechargeBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  rechargeBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  historySection: {
    backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 14,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  transRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  transIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transInfo: { flex: 1 },
  transLabel: { fontSize: 13, fontWeight: '500', color: colors.text, textAlign: 'right' },
  transTime: { fontSize: 11, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  transAmount: { fontSize: 15, fontWeight: 'bold' },
});
