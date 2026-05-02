import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, FlatList, Switch, Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const TABS = ['نظرة عامة', 'البائعين', 'الطلبات'];

export default function AdminDashboardScreen({ navigation }) {
  const { sellers, orders } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [sellerStatuses, setSellerStatuses] = useState(
    sellers.reduce((acc, s) => ({ ...acc, [s.id]: s.isApproved !== false }), {})
  );

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeOrders = orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)).length;
  const approvedSellers = Object.values(sellerStatuses).filter(Boolean).length;

  const toggleSeller = (sellerId) => {
    const current = sellerStatuses[sellerId];
    Alert.alert(
      current ? 'تعليق البائع' : 'تفعيل البائع',
      current ? 'هل تريد تعليق هذا البائع؟' : 'هل تريد تفعيل هذا البائع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: () => setSellerStatuses(prev => ({ ...prev, [sellerId]: !current })),
        },
      ]
    );
  };

  const statusColors = {
    pending: '#FF9800',
    accepted: '#2196F3',
    preparing: '#9C27B0',
    ready: '#00BCD4',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };
  const statusLabels = {
    pending: 'معلق',
    accepted: 'مقبول',
    preparing: 'يتحضر',
    ready: 'جاهز',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => Alert.alert('تسجيل الخروج', 'هل تريد الخروج من لوحة المشرف؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'خروج', onPress: () => navigation.replace('AdminLogin'), style: 'destructive' },
          ])}
        >
          <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لوحة المشرف</Text>
          <Text style={styles.headerSub}>بيتي — Admin</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark-outline" size={22} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* ── Overview Tab ── */}
        {activeTab === 0 && (
          <View style={styles.section}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard icon="cart-outline" label="الطلبات الكلية" value={orders.length} color="#2196F3" />
              <StatCard icon="time-outline" label="معلقة" value={pendingOrders} color="#FF9800" />
              <StatCard icon="flash-outline" label="نشطة" value={activeOrders} color="#9C27B0" />
              <StatCard icon="checkmark-circle-outline" label="مكتملة" value={orders.filter(o => o.status === 'delivered').length} color="#4CAF50" />
              <StatCard icon="people-outline" label="البائعين" value={sellers.length} color={colors.primary} />
              <StatCard icon="checkmark-done-outline" label="معتمدون" value={approvedSellers} color="#00BCD4" />
              <StatCard icon="cash-outline" label="الإيرادات" value={`${totalRevenue} ج`} color="#F5A623" wide />
            </View>

            {/* Recent Orders */}
            <Text style={styles.sectionTitle}>آخر الطلبات</Text>
            {orders.slice(0, 5).map(order => (
              <View key={order.id} style={styles.orderRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] || '#888' }]} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderCustomer}>{order.customerName || 'عميل'}</Text>
                  <Text style={styles.orderSeller}>من: {order.sellerName}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>{order.total} ج</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                      {statusLabels[order.status] || order.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Sellers Tab ── */}
        {activeTab === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إدارة البائعين ({sellers.length})</Text>
            {sellers.map(seller => (
              <View key={seller.id} style={styles.sellerRow}>
                <View style={styles.sellerEmoji}>
                  <Ionicons name="storefront-outline" size={28} color={colors.primary} />
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  <Text style={styles.sellerMeta}>
                    {seller.specialty} · {seller.rating} ★ · {seller.totalOrders} طلب
                  </Text>
                  <View style={styles.sellerTags}>
                    <View style={[styles.tag, { backgroundColor: seller.isOnline ? '#4CAF5020' : '#88888820' }]}>
                      <View style={[styles.tagDot, { backgroundColor: seller.isOnline ? '#4CAF50' : '#888' }]} />
                      <Text style={[styles.tagText, { color: seller.isOnline ? '#4CAF50' : '#888' }]}>
                        {seller.isOnline ? 'متصل' : 'غير متصل'}
                      </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: sellerStatuses[seller.id] ? '#4CAF5020' : '#F4433620' }]}>
                      <Text style={[styles.tagText, { color: sellerStatuses[seller.id] ? '#4CAF50' : '#F44336' }]}>
                        {sellerStatuses[seller.id] ? 'معتمد' : 'موقوف'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Switch
                  value={sellerStatuses[seller.id]}
                  onValueChange={() => toggleSeller(seller.id)}
                  trackColor={{ false: '#ddd', true: colors.primary + '60' }}
                  thumbColor={sellerStatuses[seller.id] ? colors.primary : '#aaa'}
                />
              </View>
            ))}
          </View>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>جميع الطلبات ({orders.length})</Text>
            {orders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderCardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                      {statusLabels[order.status] || order.status}
                    </Text>
                  </View>
                  <Text style={styles.orderId}>#{order.id?.slice(-6)}</Text>
                </View>
                <View style={styles.orderCardBody}>
                  <View style={styles.orderCardRow}>
                    <Text style={styles.orderCardValue}>{order.customerName || 'عميل'}</Text>
                    <Text style={styles.orderCardLabel}>العميل:</Text>
                  </View>
                  <View style={styles.orderCardRow}>
                    <Text style={styles.orderCardValue}>{order.sellerName}</Text>
                    <Text style={styles.orderCardLabel}>البائع:</Text>
                  </View>
                  <View style={styles.orderCardRow}>
                    <Text style={[styles.orderCardValue, { color: colors.primary, fontWeight: 'bold' }]}>
                      {order.total} ج
                    </Text>
                    <Text style={styles.orderCardLabel}>المجموع:</Text>
                  </View>
                  <View style={styles.orderCardRow}>
                    <Text style={styles.orderCardValue}>
                      {order.items?.length || 0} صنف
                    </Text>
                    <Text style={styles.orderCardLabel}>العناصر:</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  adminBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardWide: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  orderInfo: { flex: 1, alignItems: 'flex-end' },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'right',
  },
  orderSeller: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerEmoji: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF8F5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sellerInfo: { flex: 1, alignItems: 'flex-end' },
  sellerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'right',
  },
  sellerMeta: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  sellerTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: { fontSize: 10, fontWeight: '600' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'monospace',
  },
  orderCardBody: { gap: 6 },
  orderCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardLabel: {
    fontSize: 12,
    color: '#888',
  },
  orderCardValue: {
    fontSize: 13,
    color: '#2D2D2D',
    fontWeight: '500',
  },
});
