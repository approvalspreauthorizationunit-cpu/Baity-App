import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';

function TransactionRow({ icon, label, amount, time, type }) {
  const isCredit = type === 'credit';
  return (
    <View style={styles.transRow}>
      <View style={[styles.transIcon, { backgroundColor: isCredit ? '#E8F5E9' : '#FFF0E8' }]}>
        <Ionicons
          name={icon || (isCredit ? 'add-circle-outline' : 'remove-circle-outline')}
          size={18}
          color={isCredit ? colors.success : colors.primary}
        />
      </View>
      <View style={styles.transInfo}>
        <Text style={styles.transLabel}>{label}</Text>
        <Text style={styles.transTime}>{new Date(time).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</Text>
      </View>
      <Text style={[styles.transAmount, { color: isCredit ? colors.success : colors.error }]}>
        {isCredit ? '+' : '-'}{amount} ج
      </Text>
    </View>
  );
}

export default function SellerWalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [minWithdrawal, setMinWithdrawal] = useState(100);

  const [requestedAmount, setRequestedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('فودافون كاش');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // 1. Load Profile
      const { data: profileData, error: profileError } = await supabase
        .from('seller_profiles')
        .select('id, wallet_balance, commission_rate')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Load Platform Settings
      const { data: setting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'min_withdrawal_amount')
        .single();

      if (setting) setMinWithdrawal(parseInt(setting.value));

      // 3. Load Transactions
      const { data: transData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('seller_id', profileData.id)
        .order('created_at', { ascending: false });

      setTransactions(transData || []);

      // 4. Load Withdrawals
      const { data: withData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('seller_id', profileData.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withData || []);

    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(requestedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('تنبيه', 'برجاء إدخال مبلغ صحيح');
      return;
    }
    if (amount > profile.wallet_balance) {
      Alert.alert('تنبيه', 'المبلغ المطلوب أكبر من رصيدك الحالي');
      return;
    }
    if (amount < minWithdrawal) {
      Alert.alert('تنبيه', `الحد الأدنى للسحب هو ${minWithdrawal} جنيه`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          seller_id: profile.id,
          amount: amount,
          status: 'pending',
          payment_method: `${paymentMethod} (${paymentPhone})`
        });

      if (error) throw error;

      Alert.alert('تم', 'تم إرسال طلب السحب بنجاح، سيتم مراجعته من الإدارة');
      setRequestedAmount('');
      loadWalletData();
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ في تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المحفظة</Text>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>رصيدك المتاح للسحب</Text>
            <Text style={styles.balanceAmount}>{profile?.wallet_balance || 0}</Text>
            <Text style={styles.balanceCurrency}>جنيه مصري</Text>
            {profile?.wallet_balance < minWithdrawal && (
              <View style={styles.balanceNote}>
                <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceNoteText}>
                  الحد الأدنى للسحب هو {minWithdrawal} جنيه
                </Text>
              </View>
            )}
          </View>

          {/* Commission Info */}
          <View style={styles.commissionCard}>
            <View style={styles.commissionHeader}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
              <Text style={styles.commissionTitle}>نظام العمولة</Text>
            </View>
            <View style={styles.commissionBody}>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionLabel}>نسبة عمولة المنصة</Text>
                <Text style={styles.commissionValue}>{profile?.commission_rate}%</Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionLabel}>صافي أرباحك</Text>
                <Text style={[styles.commissionValue, { color: colors.success }]}>{100 - (profile?.commission_rate || 0)}%</Text>
              </View>
            </View>
          </View>

          {/* Withdrawal Section */}
          <View style={styles.rechargeSection}>
            <Text style={styles.sectionTitle}>طلب سحب أرباح</Text>
            <Text style={styles.rechargeSubtitle}>سيتم تحويل المبلغ خلال 24 ساعة عمل</Text>

            <View style={styles.paymentMethods}>
              {['فودافون كاش', 'انستا باي', 'فوري'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentMethod, paymentMethod === method && styles.paymentMethodActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Ionicons
                    name={method === 'فودافون كاش' ? 'phone-portrait-outline' : 'send-outline'}
                    size={20}
                    color={paymentMethod === method ? colors.white : colors.primary}
                  />
                  <Text style={[styles.paymentName, paymentMethod === method && { color: '#fff' }]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.withdrawForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.amountLabel}>المبلغ المراد سحبه</Text>
                <TextInput
                  style={styles.withdrawInput}
                  value={requestedAmount}
                  onChangeText={setRequestedAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.amountLabel}>رقم التحويل / المعرف</Text>
                <TextInput
                  style={styles.withdrawInput}
                  value={paymentPhone}
                  onChangeText={setPaymentPhone}
                  keyboardType="default"
                  placeholder="رقم الهاتف أو المعرف"
                  textAlign="right"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.rechargeBtn,
                (submitting || (profile?.wallet_balance || 0) < minWithdrawal) && styles.rechargeBtnDisabled
              ]}
              onPress={handleWithdraw}
              disabled={submitting || (profile?.wallet_balance || 0) < minWithdrawal}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-down-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.rechargeBtnText}>تأكيد طلب السحب</Text>
                </>
              )}
            </TouchableOpacity>

            {(profile?.wallet_balance || 0) < minWithdrawal && (
              <Text style={styles.minWarning}>الرصيد غير كافٍ للسحب (الحد الأدنى {minWithdrawal} ج)</Text>
            )}
          </View>

          {/* Pending Withdrawals */}
          {withdrawals.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>طلبات سحب معلقة</Text>
              {withdrawals.filter(w => w.status === 'pending').map(w => (
                <View key={w.id} style={styles.transRow}>
                  <View style={[styles.transIcon, { backgroundColor: '#FFF9C4' }]}>
                    <Ionicons name="time-outline" size={18} color="#FBC02D" />
                  </View>
                  <View style={styles.transInfo}>
                    <Text style={styles.transLabel}>طلب سحب ({w.payment_method.split(' ')[0]})</Text>
                    <Text style={styles.transTime}>{new Date(w.created_at).toLocaleDateString('ar-EG')}</Text>
                  </View>
                  <Text style={[styles.transAmount, { color: '#FBC02D' }]}>{w.amount} ج</Text>
                </View>
              ))}
            </View>
          )}

          {/* Transaction History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>سجل المعاملات</Text>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد معاملات بعد</Text>
            ) : (
              transactions.map(tx => (
                <TransactionRow
                  key={tx.id}
                  label={tx.description || (tx.type === 'credit' ? 'أرباح طلب' : 'سحب رصيد')}
                  amount={tx.amount}
                  time={tx.created_at}
                  type={tx.type}
                />
              ))
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
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
    flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 8,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.border,
  },
  paymentMethodActive: {
    backgroundColor: colors.primary, borderColor: colors.primary
  },
  paymentName: { fontSize: 10, color: colors.text, textAlign: 'center', fontWeight: '500' },
  withdrawForm: { gap: 12, marginBottom: 16 },
  inputGroup: { gap: 4 },
  withdrawInput: {
    backgroundColor: colors.background, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, fontSize: 15
  },
  rechargeBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  minWarning: {
    color: colors.error, fontSize: 11, textAlign: 'center', marginTop: 8
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textLight, paddingVertical: 20 },
  amountLabel: { fontSize: 13, color: colors.text, textAlign: 'right', marginBottom: 4, fontWeight: '600' },
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
