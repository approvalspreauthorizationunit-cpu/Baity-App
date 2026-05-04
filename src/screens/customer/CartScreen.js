import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const donationOptions = [
  { id: 'd1', label: '5 جنيه', amount: 5 },
  { id: 'd2', label: '10 جنيه', amount: 10 },
  { id: 'd3', label: '20 جنيه', amount: 20 },
  { id: 'meal', label: 'وجبة مجانية', amount: 0, isMeal: true },
];

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, updateCartItem, removeFromCart, setDonation, getCartTotal } = useApp();

  const subtotal = getCartTotal();
  const deliveryFee = 10;
  const grandTotal = subtotal + deliveryFee + (cart.isMealDonation ? 0 : cart.donation);

  if (cart.items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>السلة</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>سلتك فارغة</Text>
          <Text style={styles.emptySubtitle}>اضف أصناف من إحدى البائعات لتبدأ طلبك</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('الرئيسية')}
          >
            <Text style={styles.browseBtnText}>تصفح البائعات</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>السلة</Text>
        <Text style={styles.sellerLabel}>من: {cart.sellerName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المنتجات</Text>
          {cart.items.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemEmoji}>
                <Ionicons name="fast-food-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price} جنيه × {item.quantity}</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateCartItem(item.id, item.quantity - 1)}
                >
                  <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? colors.error : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateCartItem(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>{item.price * item.quantity} ج</Text>
            </View>
          ))}
        </View>

        {/* Donation Section */}
        <View style={styles.section}>
          <View style={styles.donationHeader}>
            <Ionicons name="heart" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>تبرع لمحتاج</Text>
          </View>
          <Text style={styles.donationSubtitle}>أضف تبرعاً مع طلبك لمساعدة الأسر المحتاجة</Text>
          <View style={styles.donationOptions}>
            {donationOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.donationChip,
                  cart.donation === opt.amount && !opt.isMeal && styles.donationChipActive,
                  cart.isMealDonation && opt.isMeal && styles.donationChipActive,
                ]}
                onPress={() => {
                  if (cart.donation === opt.amount && !opt.isMeal && !cart.isMealDonation) {
                    setDonation(0, false);
                  } else if (cart.isMealDonation && opt.isMeal) {
                    setDonation(0, false);
                  } else {
                    setDonation(opt.amount, opt.isMeal || false);
                  }
                }}
              >
                {opt.isMeal
                  ? <Ionicons name="fast-food-outline" size={16} color={colors.primary} />
                  : null}
                <Text style={[
                  styles.donationText,
                  (cart.donation === opt.amount && !opt.isMeal) || (cart.isMealDonation && opt.isMeal)
                    ? styles.donationTextActive : {}
                ]}>
                  {opt.isMeal ? 'وجبة كاملة' : opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
            <Text style={styles.summaryValue}>{subtotal} جنيه</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>رسوم التوصيل</Text>
            <Text style={styles.summaryValue}>{deliveryFee} جنيه</Text>
          </View>
          {(cart.donation > 0 && !cart.isMealDonation) && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.primary }]}>تبرع</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>+{cart.donation} جنيه</Text>
            </View>
          )}
          {cart.isMealDonation && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.primary }]}>وجبة مجانية</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>مشكوووور</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{grandTotal} جنيه</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>متابعة للدفع</Text>
          <Text style={styles.checkoutBtnTotal}>{grandTotal} جنيه</Text>
        </TouchableOpacity>
      </View>
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
  sellerLabel: { fontSize: 13, color: colors.primary, textAlign: 'right', marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 22 },
  browseBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8,
  },
  browseBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  section: {
    backgroundColor: colors.white, margin: 12, marginBottom: 0, borderRadius: 16, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 12 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  itemEmoji: {
    width: 48, height: 48, borderRadius: 10, backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  itemPrice: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF0E8', borderRadius: 16, paddingHorizontal: 4, paddingVertical: 2,
  },
  qtyBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: 'bold', color: colors.text, minWidth: 18, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: colors.primary, minWidth: 50, textAlign: 'left' },
  donationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  donationSubtitle: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginBottom: 12 },
  donationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  donationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  donationChipActive: { backgroundColor: '#FFF0E8', borderColor: colors.primary },
  donationMealEmoji: { fontSize: 14 },
  donationText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  donationTextActive: { color: colors.primary, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: colors.textLight },
  summaryValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  summaryTotal: {
    borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  checkoutBar: {
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  checkoutBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  checkoutBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  checkoutBtnTotal: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
