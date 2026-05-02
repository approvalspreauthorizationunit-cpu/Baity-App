import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { orderStatusLabels } from '../../data/mockData';

const statusOrder = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];
const statusIcons = {
  pending: { name: 'time-outline', color: '#FF9800' },
  accepted: { name: 'checkmark-circle-outline', color: '#4CAF50' },
  preparing: { name: 'restaurant-outline', color: '#FF5722' },
  ready: { name: 'bag-check-outline', color: '#2196F3' },
  delivered: { name: 'checkmark-done-circle-outline', color: '#4CAF50' },
  cancelled: { name: 'close-circle-outline', color: '#F44336' },
};
const statusColors = {
  pending: colors.badge.pending,
  accepted: colors.badge.accepted,
  preparing: colors.badge.preparing,
  ready: colors.badge.ready,
  delivered: colors.badge.delivered,
  cancelled: colors.badge.cancelled,
};

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderTrackingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { orders, updateOrderStatus } = useApp();
  const [refreshKey, setRefreshKey] = useState(0);

  const orderId = route?.params?.orderId;
  let order;
  if (orderId === 'latest' || !orderId) {
    order = orders[0];
  } else {
    order = orders.find(o => o.id === orderId);
  }

  // Auto-advance demo order
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return;
    const idx = statusOrder.indexOf(order.status);
    if (idx < statusOrder.length - 1) {
      const timer = setTimeout(() => {
        updateOrderStatus(order.id, statusOrder[idx + 1]);
        setRefreshKey(k => k + 1);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, refreshKey]);

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تتبع الطلب</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyText}>لا يوجد طلب للتتبع</Text>
        </View>
      </View>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تتبع الطلب</Text>
        <Text style={styles.orderId}>#{order.id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Hero */}
        <View style={[styles.statusHero, { backgroundColor: isCancelled ? '#FFF0F0' : '#FFF0E8' }]}>
          <Ionicons name={statusIcons[order.status]?.name || 'time-outline'} size={60} color={statusIcons[order.status]?.color || colors.primary} />
          <Text style={[styles.statusTitle, { color: statusColors[order.status] }]}>
            {orderStatusLabels[order.status]}
          </Text>
          {!isCancelled && order.status !== 'delivered' && (
            <Text style={styles.statusHint}>يتم تحديث الحالة تلقائياً</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مسار الطلب</Text>
          {isCancelled ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.error }]}>
                <Ionicons name="close" size={12} color={colors.white} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.error }]}>تم إلغاء الطلب</Text>
                {order.timeline[order.timeline.length - 1] && (
                  <Text style={styles.timelineTime}>{formatTime(order.timeline[order.timeline.length - 1].time)}</Text>
                )}
              </View>
            </View>
          ) : (
            statusOrder.map((status, index) => {
              const done = index <= currentStatusIndex;
              const current = index === currentStatusIndex;
              const timelineEntry = order.timeline?.find(t => t.status === status);
              return (
                <View key={status} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      done ? { backgroundColor: colors.primary } : { backgroundColor: colors.border },
                      current && styles.timelineDotCurrent,
                    ]}>
                      {done
                        ? <Ionicons name="checkmark" size={12} color={colors.white} />
                        : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.offlineGray }} />
                      }
                    </View>
                    {index < statusOrder.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: index < currentStatusIndex ? colors.primary : colors.border }]} />
                    )}
                  </View>
                  <View style={[styles.timelineContent, { marginBottom: index < statusOrder.length - 1 ? 0 : 0 }]}>
                    <Text style={[styles.timelineLabel, !done && styles.timelineLabelInactive]}>
                      {orderStatusLabels[status]}
                    </Text>
                    {timelineEntry && (
                      <Text style={styles.timelineTime}>{formatTime(timelineEntry.time)}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
          <View style={styles.detailRow}>
            <Ionicons name="storefront-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>البائعة</Text>
            <Text style={styles.detailValue}>{order.sellerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>العنوان</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{order.address}</Text>
          </View>
          {order.notes ? (
            <View style={styles.detailRow}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              <Text style={styles.detailLabel}>ملاحظات</Text>
              <Text style={styles.detailValue}>{order.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأصناف</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemQty}>× {item.quantity}</Text>
              <Text style={styles.orderItemPrice}>{item.price * item.quantity} جنيه</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}>
            <Text style={styles.orderItemName}>توصيل</Text>
            <Text style={styles.orderItemPrice}>{order.deliveryFee} جنيه</Text>
          </View>
          {order.donation > 0 && (
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemName, { color: colors.primary }]}>تبرع</Text>
              <Text style={[styles.orderItemPrice, { color: colors.primary }]}>+{order.donation} جنيه</Text>
            </View>
          )}
          <View style={[styles.orderItem, { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{order.grandTotal} جنيه</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order.status === 'delivered' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.rateBtn}>
              <Ionicons name="star" size={18} color={colors.white} />
              <Text style={styles.rateBtnText}>قيّم البائعة</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  orderId: { fontSize: 13, color: colors.textLight },
  statusHero: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 8,
  },
  statusEmoji: { fontSize: 60 },
  statusTitle: { fontSize: 22, fontWeight: 'bold' },
  statusHint: { fontSize: 12, color: colors.textLight },
  section: {
    backgroundColor: colors.white, margin: 12, marginBottom: 0, borderRadius: 16, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 14 },
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 52 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  timelineDotCurrent: {
    borderWidth: 3, borderColor: '#FFD5C0',
  },
  timelineLine: { flex: 1, width: 2, minHeight: 24, marginTop: 2 },
  timelineItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  timelineContent: { flex: 1, paddingBottom: 16, paddingTop: 4 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  timelineLabelInactive: { color: colors.textMuted, fontWeight: '400' },
  timelineTime: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textLight, width: 64 },
  detailValue: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right' },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8,
  },
  orderItemName: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right' },
  orderItemQty: { fontSize: 13, color: colors.textLight },
  orderItemPrice: { fontSize: 13, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'right' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  rateBtn: {
    backgroundColor: colors.secondary, borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  rateBtnText: { color: colors.white, fontSize: 15, fontWeight: 'bold' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: colors.textLight },
});
