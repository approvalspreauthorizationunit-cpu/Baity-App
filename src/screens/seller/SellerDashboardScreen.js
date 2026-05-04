import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const statusColors = {
  pending: colors.badge.pending,
  accepted: colors.badge.accepted,
  preparing: colors.badge.preparing,
  ready: colors.badge.ready,
  delivered: colors.badge.delivered,
  cancelled: colors.badge.cancelled,
};

const statusLabels = {
  pending: 'في الانتظار',
  accepted: 'تم القبول',
  preparing: 'جاري التحضير',
  ready: 'جاهز للتوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export default function SellerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, switchMode } = useApp();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ active: 0, today: 0, earnings: 0 });
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get seller profile
      const { data: sellerProfile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !sellerProfile) throw profileError || new Error('Profile not found');
      setProfile(sellerProfile);

      // 2. Today's stats
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: todayOrders, error: statsError } = await supabase
        .from('orders')
        .select('total_amount, seller_earnings, status')
        .eq('seller_id', sellerProfile.id)
        .gte('created_at', startOfDay.toISOString());

      if (statsError) throw statsError;

      const earnings = todayOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.seller_earnings || 0), 0);

      // 3. Active orders
      const { data: actives, count: activeCount, error: activeError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, products (name))
        `, { count: 'exact' })
        .eq('seller_id', sellerProfile.id)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      setStats({
        active: activeCount || 0,
        today: todayOrders.length,
        earnings: earnings
      });
      setActiveOrders(actives || []);

    } catch (err) {
      console.error('Dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async () => {
    if (!profile) return;
    const newStatus = !profile.is_available; // Using is_available as online toggle for now
    try {
       const { error } = await supabase
         .from('seller_profiles')
         .update({ is_available: newStatus }) // This should probably be is_online if we add it
         .eq('id', profile.id);

       if (error) throw error;
       setProfile({ ...profile, is_available: newStatus });
    } catch (err) {
       console.error('Toggle online error:', err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      loadDashboardData(); // Refresh
    } catch (err) {
      console.error('Update status error:', err.message);
    }
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const commission = Math.floor(stats.earnings * 0.1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.switchBtn} onPress={() => switchMode('customer')}>
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={styles.switchBtnText}>وضع العميل</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.welcomeText}>أهلاً يا {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subText}>مطبخك في انتظارك</Text>
        </View>
        <View style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {stats.active > 0 && <View style={styles.notifDot} />}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} onRefresh={loadDashboardData} refreshing={loading}>
        {/* Online/Offline Toggle */}
        <View style={[styles.onlineCard, { backgroundColor: profile?.is_available ? '#E8F5E9' : '#FFF3E0' }]}>
          <View style={styles.onlineCardLeft}>
            <View style={[styles.onlineStatusDot, { backgroundColor: profile?.is_available ? colors.success : colors.warning }]} />
            <View>
              <Text style={styles.onlineCardTitle}>
                {profile?.is_available ? 'أنتِ متاحة الآن' : 'أنتِ غير متاحة'}
              </Text>
              <Text style={styles.onlineCardSubtitle}>
                {profile?.is_available ? 'العملاء يستطيعون رؤيتك' : 'لا تظهرين للعملاء'}
              </Text>
            </View>
          </View>
          <Switch
            value={profile?.is_available || false}
            onValueChange={toggleOnline}
            trackColor={{ false: '#DDD', true: colors.success }}
            thumbColor={colors.white}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>طلبات نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>طلبات اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={colors.success} />
            <Text style={styles.statValue}>{stats.earnings}</Text>
            <Text style={styles.statLabel}>أرباح اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: (profile?.wallet_balance || 0) > 0 ? colors.success : colors.error }]}>
              {profile?.wallet_balance || 0}
            </Text>
            <Text style={styles.statLabel}>رصيد المحفظة</Text>
          </View>
        </View>

        {/* Rating Summary */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingBig}>4.5 <Ionicons name="star" size={20} color={colors.star} /></Text>
            <Text style={styles.ratingCount}>0 تقييم</Text>
          </View>
          <View style={styles.ratingRight}>
            <Text style={styles.ratingLabel}>إجمالي الأرباح</Text>
            <Text style={styles.ratingValue}>{stats.earnings}</Text>
          </View>
          <View style={styles.ratingRight}>
            <Text style={styles.ratingLabel}>عمولة المنصة</Text>
            <Text style={[styles.ratingValue, { color: colors.error }]}>- {commission}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('الطلبات')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="list" size={22} color="#1976D2" />
              </View>
              <Text style={styles.actionLabel}>الطلبات</Text>
              {stats.active > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{stats.active}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('منتجاتي')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="fast-food" size={22} color="#388E3C" />
              </View>
              <Text style={styles.actionLabel}>منتجاتي</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('المحفظة')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="wallet" size={22} color="#F57C00" />
              </View>
              <Text style={styles.actionLabel}>المحفظة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddProduct', { onSave: loadDashboardData })}>
              <View style={[styles.actionIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="add-circle" size={22} color="#C2185B" />
              </View>
              <Text style={styles.actionLabel}>منتج جديد</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <View style={styles.activeOrdersSection}>
            <View style={styles.activeOrdersHeader}>
              <TouchableOpacity onPress={() => navigation.navigate('الطلبات')}>
                <Text style={styles.seeAllText}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>الطلبات النشطة</Text>
            </View>
            {activeOrders.slice(0, 3).map(order => (
              <View key={order.id} style={styles.activeOrderCard}>
                <View style={styles.orderCardTop}>
                  <View style={[styles.orderStatusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
                    <Text style={[styles.orderStatusText, { color: statusColors[order.status] }]}>
                      {statusLabels[order.status]}
                    </Text>
                  </View>
                  <Text style={styles.orderCardTotal}>{order.total_amount} جنيه</Text>
                </View>
                <Text style={styles.orderCardItems}>
                  {order.order_items.map(i => `${i.products?.name} ×${i.quantity}`).join('، ')}
                </Text>
                {order.status === 'pending' && (
                  <View style={styles.orderCardActions}>
                    <TouchableOpacity
                      style={[styles.orderActionBtn, { backgroundColor: '#FFE8E8', borderColor: colors.error }]}
                      onPress={() => updateOrderStatus(order.id, 'cancelled')}
                    >
                      <Text style={[styles.orderActionText, { color: colors.error }]}>رفض</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.orderActionBtn, { backgroundColor: '#E8FFE8', borderColor: colors.success }]}
                      onPress={() => updateOrderStatus(order.id, 'accepted')}
                    >
                      <Text style={[styles.orderActionText, { color: colors.success }]}>قبول ✓</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {order.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.prepareBtn}
                    onPress={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    <Text style={styles.prepareBtnText}>ابدئي التحضير</Text>
                  </TouchableOpacity>
                )}
                {order.status === 'preparing' && (
                  <TouchableOpacity
                    style={[styles.prepareBtn, { backgroundColor: colors.success }]}
                    onPress={() => updateOrderStatus(order.id, 'ready')}
                  >
                    <Text style={styles.prepareBtnText}>جاهز للتوصيل ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  switchBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  welcomeText: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subText: { fontSize: 12, color: colors.textLight, textAlign: 'center' },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    borderRadius: 4, backgroundColor: colors.error,
  },
  onlineCard: {
    margin: 12, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  onlineCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlineStatusDot: { width: 12, height: 12, borderRadius: 6 },
  onlineCardTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  onlineCardSubtitle: { fontSize: 12, color: colors.textLight, textAlign: 'right' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8, paddingBottom: 4,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textLight, textAlign: 'center' },
  ratingCard: {
    backgroundColor: colors.white, margin: 12, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  ratingLeft: { alignItems: 'center' },
  ratingBig: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  ratingCount: { fontSize: 12, color: colors.textLight },
  ratingRight: { alignItems: 'center', gap: 4 },
  ratingLabel: { fontSize: 12, color: colors.textLight },
  ratingValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  quickActions: { margin: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 6, position: 'relative',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, color: colors.text, fontWeight: '500', textAlign: 'center' },
  actionBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.error, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  activeOrdersSection: { margin: 12 },
  activeOrdersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  activeOrderCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 8, gap: 8,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  orderStatusText: { fontSize: 12, fontWeight: '600' },
  orderCardTotal: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  orderCardItems: { fontSize: 13, color: colors.textLight, textAlign: 'right', lineHeight: 20 },
  orderCardActions: { flexDirection: 'row', gap: 8 },
  orderActionBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1.5,
  },
  orderActionText: { fontSize: 14, fontWeight: 'bold' },
  prepareBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  prepareBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
});
