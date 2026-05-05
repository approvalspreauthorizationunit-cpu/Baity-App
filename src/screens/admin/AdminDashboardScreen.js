import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, FlatList, Switch, Alert, ActivityIndicator, Image, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const TABS = ['نظرة عامة', 'البائعون', 'الإعدادات', 'السحوبات', 'الطلبات'];
const SELLER_FILTERS = [
  { label: 'طلبات جديدة', status: 'pending' },
  { label: 'نشطون', status: 'approved' },
  { label: 'يحتاج بيانات', status: 'needs_info' },
  { label: 'موقوفون', status: 'suspended' },
];

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, activeSellers: 0, pendingSellers: 0, todayOrders: 0, pendingWithdrawals: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [sellerFilter, setSellerFilter] = useState('pending');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showNeedsInfoModal, setShowNeedsInfoModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [platformSettings, setPlatformSettings] = useState([]);
  const [regions, setRegions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending');
  const [allOrders, setAllOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('الكل');

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 1) loadSellers();
  }, [sellerFilter]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) await loadOverview();
      else if (activeTab === 1) await loadSellers();
      else if (activeTab === 2) await loadSettings();
      else if (activeTab === 3) await loadWithdrawals();
      else if (activeTab === 4) await loadAllOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [revRes, activeRes, pendingRes, todayRes, withRes, recentRes] = await Promise.all([
      supabase.from('orders').select('commission_amount').eq('status', 'delivered'),
      supabase.from('seller_profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('seller_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('withdrawal_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*, users(full_name), seller_profiles(kitchen_name)').order('created_at', { ascending: false }).limit(5)
    ]);

    setStats({
      revenue: revRes.data?.reduce((sum, o) => sum + (o.commission_amount || 0), 0) || 0,
      activeSellers: activeRes.count || 0,
      pendingSellers: pendingRes.count || 0,
      todayOrders: todayRes.count || 0,
      pendingWithdrawals: withRes.count || 0
    });
    setRecentOrders(recentRes.data || []);
  };

  const loadSellers = async () => {
    const { data } = await supabase
      .from('seller_profiles')
      .select('*, users(full_name, phone, avatar_url), regions(name)')
      .eq('status', sellerFilter)
      .order('created_at', { ascending: false });
    setSellers(data || []);
  };

  const loadSettings = async () => {
    const [settRes, regRes] = await Promise.all([
      supabase.from('platform_settings').select('*'),
      supabase.from('regions').select('*').order('name')
    ]);
    setPlatformSettings(settRes.data || []);
    setRegions(regRes.data || []);
  };

  const loadWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*, seller_profiles(kitchen_name, wallet_balance, users(full_name, phone))')
      .eq('status', withdrawalFilter)
      .order('created_at', { ascending: false });
    setWithdrawals(data || []);
  };

  const loadAllOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, users(full_name, phone), seller_profiles(kitchen_name), order_items(quantity, unit_price, products(name))')
      .order('created_at', { ascending: false });
    setAllOrders(data || []);
  };

  const updateSellerStatus = async (sellerId, status, reason = null) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ status, rejection_reason: reason })
        .eq('id', sellerId);
      if (error) throw error;
      setShowSellerModal(false);
      setShowNeedsInfoModal(false);
      loadSellers();
    } catch (err) {
      Alert.alert('خطأ', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformSetting = async (key, value) => {
    try {
      const { error } = await supabase.from('platform_settings').update({ value }).eq('key', key);
      if (error) throw error;
      Alert.alert('تم', 'تم تحديث الإعداد بنجاح');
    } catch (err) {
      Alert.alert('خطأ', err.message);
    }
  };

  const handleProcessWithdrawal = async (requestId) => {
    Alert.prompt('تأكيد التحويل', 'ادخل رقم مرجع المعاملة:', async (ref) => {
      if (!ref) return;
      setLoading(true);
      try {
        const { error } = await supabase.functions.invoke('process-withdrawal', {
          body: { withdrawal_request_id: requestId, transaction_reference: ref }
        });
        if (error) throw error;
        Alert.alert('تم', 'تم تأكيد السحب بنجاح');
        loadWithdrawals();
      } catch (err) {
        Alert.alert('خطأ', err.message);
      } finally {
        setLoading(false);
      }
    });
  };

  const statusColors = {
    pending: '#FF9800',
    accepted: '#2196F3',
    preparing: '#9C27B0',
    ready: '#00BCD4',
    delivered: '#4CAF50',
    cancelled: '#F44336',
    approved: '#4CAF50',
    needs_info: '#F5A623',
    suspended: '#D32F2F'
  };

  const statsDisplay = useMemo(() => stats, [stats]);

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <StatCard icon="cash-outline" label="إجمالي الإيرادات" value={`${statsDisplay.revenue} ج`} color="#F5A623" wide />
        <StatCard icon="people-outline" label="بائعون نشطون" value={statsDisplay.activeSellers} color={colors.primary} />
        <StatCard icon="document-text-outline" label="طلبات تسجيل" value={statsDisplay.pendingSellers} color="#FF9800" />
        <StatCard icon="cart-outline" label="طلبات اليوم" value={statsDisplay.todayOrders} color="#2196F3" />
        <StatCard icon="wallet-outline" label="سحوبات معلقة" value={statsDisplay.pendingWithdrawals} color="#4CAF50" />
      </View>

      <Text style={styles.sectionTitle}>آخر الطلبات</Text>
      {recentOrders.map(order => (
        <View key={order.id} style={styles.orderRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] || '#888' }]} />
          <View style={styles.orderInfo}>
            <Text style={styles.orderCustomer}>{order.users?.full_name || 'عميل'}</Text>
            <Text style={styles.orderSeller}>إلى: {order.seller_profiles?.kitchen_name}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>{order.total_amount} ج</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[order.status] }]}>{order.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSellers = () => (
    <View style={styles.tabContent}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {SELLER_FILTERS.map(f => (
          <TouchableOpacity key={f.status} style={[styles.filterTab, sellerFilter === f.status && styles.filterTabActive]} onPress={() => setSellerFilter(f.status)}>
            <Text style={[styles.filterTabText, sellerFilter === f.status && styles.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {sellers.map(seller => (
        <TouchableOpacity key={seller.id} style={styles.sellerCard} onPress={() => { setSelectedSeller(seller); setShowSellerModal(true); }}>
          <View style={styles.sellerHeader}>
            <Text style={styles.kitchenName}>{seller.kitchen_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[seller.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[seller.status] }]}>{seller.status}</Text>
            </View>
          </View>
          <Text style={styles.sellerSub}>{seller.users?.full_name} · {seller.regions?.name}</Text>
          <Text style={styles.sellerDate}>تاريخ التسجيل: {new Date(seller.created_at).toLocaleDateString('ar-EG')}</Text>

          <View style={styles.actionRow}>
            {seller.status === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => updateSellerStatus(seller.id, 'approved')}>
                  <Text style={styles.actionBtnText}>موافقة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F5A623' }]} onPress={() => { setSelectedSeller(seller); setShowNeedsInfoModal(true); }}>
                  <Text style={styles.actionBtnText}>طلب بيانات</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => updateSellerStatus(seller.id, 'suspended', 'تم رفض الطلب')}>
                  <Text style={styles.actionBtnText}>رفض</Text>
                </TouchableOpacity>
              </>
            )}
            {seller.status === 'approved' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F5A623' }]} onPress={() => updateSellerStatus(seller.id, 'suspended')}>
                <Text style={styles.actionBtnText}>تعليق</Text>
              </TouchableOpacity>
            )}
            {seller.status === 'suspended' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => updateSellerStatus(seller.id, 'approved')}>
                <Text style={styles.actionBtnText}>إعادة تفعيل</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>إعدادات المنصة</Text>
      {platformSettings.map(s => (
        <View key={s.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{s.description || s.key}</Text>
          <View style={styles.settingInputRow}>
            <TextInput style={styles.settingInput} defaultValue={s.value} onChangeText={(val) => {
              const updated = [...platformSettings];
              const idx = updated.findIndex(i => i.key === s.key);
              updated[idx].value = val;
              setPlatformSettings(updated);
            }} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveSettingBtn} onPress={() => updatePlatformSetting(s.key, s.value)}>
              <Ionicons name="checkmark" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>إدارة المناطق</Text>
      {regions.map(r => (
        <View key={r.id} style={styles.regionRow}>
          <View style={styles.regionInfo}>
            <Text style={styles.regionName}>{r.name}</Text>
            <Text style={styles.regionFee}>{r.delivery_fee} ج توصيل</Text>
          </View>
          <Switch value={r.is_active} onValueChange={async (val) => {
            await supabase.from('regions').update({ is_active: val }).eq('id', r.id);
            loadSettings();
          }} />
        </View>
      ))}
    </View>
  );

  const renderWithdrawals = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterTabs}>
        {['pending', 'completed', 'rejected'].map(s => (
          <TouchableOpacity key={s} style={[styles.filterTab, withdrawalFilter === s && styles.filterTabActive]} onPress={() => setWithdrawalFilter(s)}>
            <Text style={[styles.filterTabText, withdrawalFilter === s && styles.filterTabTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {withdrawals.map(w => (
        <View key={w.id} style={styles.withdrawalCard}>
          <Text style={styles.kitchenName}>{w.seller_profiles?.kitchen_name}</Text>
          <Text style={styles.sellerSub}>{w.seller_profiles?.users?.full_name} · {w.seller_profiles?.users?.phone}</Text>
          <View style={styles.withdrawalAmountRow}>
            <Text style={styles.withdrawalAmount}>{w.amount} ج</Text>
            <Text style={styles.walletBalance}>رصيد المحفظة: {w.seller_profiles?.wallet_balance} ج</Text>
          </View>
          {w.status === 'pending' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => handleProcessWithdrawal(w.id)}>
                <Text style={styles.actionBtnText}>تأكيد التحويل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={async () => {
                await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', w.id);
                loadWithdrawals();
              }}>
                <Text style={styles.actionBtnText}>رفض</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderAllOrders = () => (
    <View style={styles.tabContent}>
       {allOrders.map(order => (
         <View key={order.id} style={styles.orderCard}>
           <View style={styles.orderCardHeader}>
             <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
             <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
               <Text style={[styles.statusText, { color: statusColors[order.status] }]}>{order.status}</Text>
             </View>
           </View>
           <Text style={styles.orderCardText}>العميل: {order.users?.full_name}</Text>
           <Text style={styles.orderCardText}>المطبخ: {order.seller_profiles?.kitchen_name}</Text>
           <Text style={styles.orderCardText}>الإجمالي: {order.total_amount} ج</Text>
           <Text style={styles.orderCardDate}>{new Date(order.created_at).toLocaleString('ar-EG')}</Text>
         </View>
       ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('خروج', 'هل تريد تسجيل الخروج؟', [{ text: 'إلغاء' }, { text: 'خروج', onPress: logout }])}>
          <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لوحة المشرف</Text>
          <Text style={styles.headerSub}>بيتي — Admin Dashboard</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark-outline" size={22} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab, i) => (
            <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {loading ? <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} /> : (
          <>
            {activeTab === 0 && renderOverview()}
            {activeTab === 1 && renderSellers()}
            {activeTab === 2 && renderSettings()}
            {activeTab === 3 && renderWithdrawals()}
            {activeTab === 4 && renderAllOrders()}
          </>
        )}
      </ScrollView>

      {/* Seller Details Modal */}
      <Modal visible={showSellerModal} animationType="slide" onRequestClose={() => setShowSellerModal(false)}>
        {selectedSeller && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تفاصيل البائعة</Text>
              <TouchableOpacity onPress={() => setShowSellerModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
               <Text style={styles.detailLabel}>اسم المطبخ: <Text style={styles.detailValue}>{selectedSeller.kitchen_name}</Text></Text>
               <Text style={styles.detailLabel}>الاسم الكامل: <Text style={styles.detailValue}>{selectedSeller.users?.full_name}</Text></Text>
               <Text style={styles.detailLabel}>رقم الهاتف: <Text style={styles.detailValue}>{selectedSeller.users?.phone}</Text></Text>
               <Text style={styles.detailLabel}>المنطقة: <Text style={styles.detailValue}>{selectedSeller.regions?.name}</Text></Text>
               <Text style={styles.detailLabel}>ساعات العمل: <Text style={styles.detailValue}>{selectedSeller.working_hours}</Text></Text>
               <Text style={styles.detailLabel}>النبذة:</Text>
               <Text style={styles.bioText}>{selectedSeller.bio}</Text>

               <Text style={styles.sectionTitle}>المستندات</Text>
               <DocumentImage label="وجه البطاقة" path={selectedSeller.national_id_front_url} userId={selectedSeller.user_id} />
               <DocumentImage label="ظهر البطاقة" path={selectedSeller.national_id_back_url} userId={selectedSeller.user_id} />
               <DocumentImage label="الشهادة الصحية" path={selectedSeller.health_certificate_url} userId={selectedSeller.user_id} />
               <Text style={styles.detailLabel}>انتهاء الشهادة الصحية: <Text style={styles.detailValue}>{selectedSeller.health_certificate_expiry}</Text></Text>

               <View style={styles.commissionEditRow}>
                 <Text style={styles.detailLabel}>نسبة العمولة (%):</Text>
                 <TextInput
                   style={styles.commissionInput}
                   defaultValue={selectedSeller.commission_rate?.toString()}
                   keyboardType="numeric"
                   onEndEditing={async (e) => {
                     await supabase.from('seller_profiles').update({ commission_rate: parseFloat(e.nativeEvent.text) }).eq('id', selectedSeller.id);
                   }}
                 />
               </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Needs Info Modal */}
      <Modal visible={showNeedsInfoModal} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>طلب بيانات إضافية</Text>
            <TextInput
              style={styles.rejectionInput}
              placeholder="اكتب الملاحظات للبائعة..."
              multiline
              onChangeText={setAdminNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowNeedsInfoModal(false)}>
                <Text style={styles.modalBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={() => updateSellerStatus(selectedSeller.id, 'needs_info', adminNote)}>
                <Text style={[styles.modalBtnText, { color: colors.white }]}>إرسال</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, label, value, color, wide }) {
  return (
    <View style={[styles.statCard, wide && styles.statCardWide]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DocumentImage({ label, path, userId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (path) {
      getSignedUrl();
    }
  }, [path]);

  const getSignedUrl = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('seller-documents')
      .createSignedUrl(path, 3600);

    if (data) setUrl(data.signedUrl);
    setLoading(false);
  };

  return (
    <View style={styles.docContainer}>
      <Text style={styles.docLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : url ? (
        <Image source={{ uri: url }} style={styles.docImage} resizeMode="contain" />
      ) : (
        <Text>لا توجد صورة</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  adminBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: '#888', fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D2D2D', textAlign: 'right', marginBottom: 12, marginTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statCardWide: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2D2D2D' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  orderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  orderInfo: { flex: 1, alignItems: 'flex-end' },
  orderCustomer: { fontSize: 14, fontWeight: '600', color: '#2D2D2D', textAlign: 'right' },
  orderSeller: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  filterTabs: { flexDirection: 'row', marginBottom: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginLeft: 8 },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 12, color: '#666' },
  filterTabTextActive: { color: '#fff', fontWeight: 'bold' },
  sellerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  sellerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kitchenName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  sellerSub: { fontSize: 13, color: '#666', textAlign: 'right' },
  sellerDate: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  settingRow: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: '#666', textAlign: 'right', marginBottom: 8 },
  settingInputRow: { flexDirection: 'row', gap: 8 },
  settingInput: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#eee' },
  saveSettingBtn: { backgroundColor: colors.primary, width: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  regionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  regionName: { fontSize: 15, fontWeight: 'bold' },
  regionFee: { fontSize: 12, color: '#666' },
  withdrawalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12 },
  withdrawalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  withdrawalAmount: { fontSize: 20, fontWeight: 'bold', color: colors.success },
  walletBalance: { fontSize: 12, color: '#666' },
  orderCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 12, color: '#999' },
  orderCardText: { fontSize: 14, color: '#333', textAlign: 'right', marginBottom: 4 },
  orderCardDate: { fontSize: 11, color: '#999', textAlign: 'right' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  detailLabel: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 4 },
  detailValue: { color: '#333', fontWeight: 'bold' },
  bioText: { fontSize: 14, color: '#444', textAlign: 'right', marginBottom: 16, lineHeight: 20 },
  docContainer: { marginBottom: 16 },
  docLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' },
  docImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#eee' },
  commissionEditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  commissionInput: { width: 80, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8, textAlign: 'center', borderWidth: 1, borderColor: '#eee' },
  centeredModal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 16 },
  rejectionInput: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#eee' },
  modalBtnText: { fontSize: 14, fontWeight: 'bold', color: '#666' }
});
