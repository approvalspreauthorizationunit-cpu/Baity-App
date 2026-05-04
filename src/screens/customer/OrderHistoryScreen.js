import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, ActivityIndicator
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

const filters = ['الكل', 'جارية', 'مكتملة', 'ملغية'];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrderHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, addToCart } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, products (name)),
          seller_profiles (id, kitchen_name, bio)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err.message);
      Alert.alert('خطأ', 'تعذر تحميل سجل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'الكل') return true;
    if (filter === 'جارية') return ['pending', 'accepted', 'preparing', 'ready'].includes(o.status);
    if (filter === 'مكتملة') return o.status === 'delivered';
    if (filter === 'ملغية') return o.status === 'cancelled';
    return true;
  });

  const handleReorder = (order) => {
    const seller = order.seller_profiles;
    if (!seller) {
      Alert.alert('تنبيه', 'البائعة غير متاحة حالياً');
      return;
    }

    // Simplistic reorder: just add current items to cart
    order.order_items.forEach(item => {
      const product = {
        id: item.product_id,
        name: item.products?.name || 'منتج',
        price: item.unit_price,
      };
      addToCart(product, {
        id: seller.id,
        name: seller.kitchen_name,
      });
    });
    navigation.navigate('الرئيسية', { screen: 'Checkout' });
  };

  const renderOrder = ({ item: order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
      activeOpacity={0.85}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderLeft}>
          <View style={styles.sellerAvatar}>
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.sellerName}>{order.seller_profiles?.kitchen_name || 'بائعة'}</Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
            {statusLabels[order.status] || order.status}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {order.order_items?.slice(0, 2).map((item, i) => (
          <Text key={i} style={styles.itemText}>• {item.products?.name} × {item.quantity}</Text>
        ))}
        {order.order_items?.length > 2 && (
          <Text style={styles.moreItems}>+{order.order_items.length - 2} أصناف أخرى</Text>
        )}
      </View>

      <View style={styles.orderBottom}>
        <Text style={styles.orderTotal}>{order.total_amount} جنيه</Text>
        {['pending', 'accepted', 'preparing', 'ready'].includes(order.status) ? (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
          >
            <Ionicons name="locate-outline" size={14} color={colors.primary} />
            <Text style={styles.trackBtnText}>تتبع الطلب</Text>
          </TouchableOpacity>
        ) : order.status === 'delivered' ? (
          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={() => handleReorder(order)}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.white} />
            <Text style={styles.reorderBtnText}>إعادة الطلب</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <Text style={styles.orderCount}>{orders.length} طلب</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
          <Text style={styles.emptySubtitle}>لم تقم بأي طلبات بعد</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={loadOrders}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  orderCount: { fontSize: 13, color: colors.textLight },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { padding: 12, gap: 10 },
  orderCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE8DC',
    alignItems: 'center', justifyContent: 'center',
  },
  sellerName: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  orderDate: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  itemsList: { gap: 3, paddingHorizontal: 4 },
  itemText: { fontSize: 13, color: colors.textLight, textAlign: 'right' },
  moreItems: { fontSize: 12, color: colors.primary, textAlign: 'right', fontWeight: '500' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  trackBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: colors.primary,
  },
  reorderBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});
