import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const filters = ['الكل', 'في الانتظار', 'جارية', 'مكتملة'];
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

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    let sellerProfileId = null;
    const fetchAndSubscribe = async () => {
      // 1. Get seller profile
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      sellerProfileId = profile.id;

      await loadOrders(sellerProfileId);

      // 2. Subscribe to realtime
      const channel = supabase
        .channel('seller-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${sellerProfileId}`
        }, () => {
          loadOrders(sellerProfileId);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = fetchAndSubscribe();
    return () => {
       cleanup.then(unsub => unsub?.());
    };
  }, []);

  const loadOrders = async (sellerProfileId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, products (name)),
          users (full_name)
        `)
        .eq('seller_id', sellerProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      if (status === 'delivered') {
        const { error: funcError } = await supabase.functions.invoke(
          'process-order-completion',
          { body: { order_id: orderId } }
        );
        if (funcError) console.error('Error processing order completion:', funcError);
      }

      // Realtime listener will handle the local state update
    } catch (err) {
      Alert.alert('خطأ', 'تعذر تحديث حالة الطلب');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'الكل') return true;
    if (filter === 'في الانتظار') return o.status === 'pending';
    if (filter === 'جارية') return ['accepted', 'preparing', 'ready'].includes(o.status);
    if (filter === 'مكتملة') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  const nextStatus = {
    pending: null, // use accept/reject
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  };

  const nextLabel = {
    accepted: 'بدء التحضير',
    preparing: 'جاهز للتوصيل',
    ready: 'تم التسليم',
  };

  const renderOrder = ({ item: order }) => (
    <View style={styles.orderCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>طلب #{order.id.slice(-4)}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
              {statusLabels[order.status]}
            </Text>
          </View>
          <Text style={styles.orderTime}>{formatTime(order.created_at)}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.order_items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemPrice}>{item.unit_price * item.quantity} ج</Text>
            <Text style={styles.itemName}>{item.products?.name} × {item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      {order.notes ? (
        <View style={styles.notesRow}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>الإجمالي</Text>
        <Text style={styles.totalValue}>{order.total_amount} جنيه</Text>
      </View>

      {/* Actions */}
      {order.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => updateOrderStatus(order.id, 'cancelled')}
          >
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={styles.rejectBtnText}>رفض</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => updateOrderStatus(order.id, 'accepted')}
          >
            <Ionicons name="checkmark" size={16} color={colors.white} />
            <Text style={styles.acceptBtnText}>قبول الطلب</Text>
          </TouchableOpacity>
        </View>
      )}
      {nextStatus[order.status] && (
        <TouchableOpacity
          style={[styles.progressBtn, order.status === 'ready' && { backgroundColor: colors.success }]}
          onPress={() => updateOrderStatus(order.id, nextStatus[order.status])}
        >
          <Text style={styles.progressBtnText}>{nextLabel[order.status]}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

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

      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={60} color={colors.textLight} />
          <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
             supabase.from('seller_profiles').select('id').eq('user_id', user.id).single().then(({data}) => {
                if(data) loadOrders(data.id);
             });
          }}
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
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  countBadge: {
    backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { padding: 12, gap: 10 },
  orderCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 10,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderTime: { fontSize: 11, color: colors.textLight },
  itemsList: { gap: 4, backgroundColor: colors.background, borderRadius: 10, padding: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, color: colors.text, textAlign: 'right', flex: 1 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.primary, marginLeft: 8 },
  notesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF0E8', borderRadius: 8, padding: 8,
  },
  notesText: { fontSize: 12, color: colors.text, flex: 1, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 14, color: colors.textLight },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.error, backgroundColor: '#FFF0F0',
  },
  rejectBtnText: { color: colors.error, fontWeight: 'bold', fontSize: 13 },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10, backgroundColor: colors.success,
  },
  acceptBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  progressBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center',
  },
  progressBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, color: colors.textLight },
});
