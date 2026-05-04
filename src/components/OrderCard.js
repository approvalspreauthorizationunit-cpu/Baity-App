import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const orderStatusLabels = {
  pending: 'في الانتظار',
  accepted: 'تم القبول',
  preparing: 'جاري التحضير',
  ready: 'جاهز للتوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const statusColors = {
  pending: { bg: '#FFF3E0', text: '#FF9800' },
  accepted: { bg: '#E3F2FD', text: '#2196F3' },
  preparing: { bg: '#F3E5F5', text: '#9C27B0' },
  ready: { bg: '#E0F7FA', text: '#00BCD4' },
  delivered: { bg: '#E8F5E9', text: '#4CAF50' },
  cancelled: { bg: '#FFEBEE', text: '#F44336' },
};

const statusIcons = {
  pending: 'time-outline',
  accepted: 'checkmark-circle-outline',
  preparing: 'restaurant-outline',
  ready: 'bicycle-outline',
  delivered: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function OrderCard({ order, onPress, onReorder, showReorder = false }) {
  const statusStyle = statusColors[order.status] || statusColors.pending;
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusIcons[order.status]} size={14} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {orderStatusLabels[order.status]}
          </Text>
        </View>
        <Text style={styles.orderId}>#{order.id}</Text>
      </View>

      <View style={styles.sellerRow}>
        <Text style={styles.sellerName}>{order.sellerName}</Text>
        <Ionicons name="storefront-outline" size={16} color={colors.primary} />
      </View>

      <View style={styles.itemsList}>
        {order.items.slice(0, 2).map((item, idx) => (
          <Text key={idx} style={styles.itemText}>
            {item.name} x{item.quantity}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>+{order.items.length - 2} أصناف أخرى</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {showReorder && order.status === 'delivered' && (
            <TouchableOpacity style={styles.reorderBtn} onPress={onReorder}>
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={styles.reorderText}>إعادة الطلب</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.total}>{order.grandTotal} جنيه</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 7,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: 'System',
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 3,
  },
  itemText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'right',
  },
  moreItems: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLeft: {},
  footerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  total: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reorderText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
