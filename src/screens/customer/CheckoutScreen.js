import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const timeSlots = [
  'في أقرب وقت ممكن', 'بعد 30 دقيقة', 'بعد ساعة', 'بعد ساعتين',
  'الظهر (12:00)', 'بعد الظهر (2:00)', 'العصر (4:00)', 'المغرب (6:00)',
];

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, user, placeOrder, getCartTotal, sellers } = useApp();
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.[0] || null);
  const [notes, setNotes] = useState('');
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = 10;
  const donationAmount = cart.isMealDonation ? 0 : cart.donation;
  const grandTotal = subtotal + deliveryFee + donationAmount;
  const seller = sellers.find(s => s.id === cart.sellerId);

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert('تنبيه', 'برجاء اختيار عنوان التوصيل');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const order = {
        customerId: user.id || 'u1',
        sellerId: cart.sellerId,
        sellerName: cart.sellerName,
        items: cart.items.map(i => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: subtotal,
        deliveryFee,
        donation: cart.donation,
        isMealDonation: cart.isMealDonation,
        grandTotal,
        address: selectedAddress.address,
        notes,
        deliveryTime: selectedTime,
      };
      placeOrder(order);
      setLoading(false);
      navigation.replace('OrderTracking', { orderId: 'latest' });
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تأكيد الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
          </View>
          {user?.addresses?.map(addr => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressOption, selectedAddress?.id === addr.id && styles.addressOptionActive]}
              onPress={() => setSelectedAddress(addr)}
            >
              <View style={[styles.radioCircle, selectedAddress?.id === addr.id && styles.radioCircleActive]}>
                {selectedAddress?.id === addr.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.addressText}>{addr.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addAddressBtn}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addAddressText}>إضافة عنوان جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>وقت التسليم</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {timeSlots.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>ملاحظات للبائعة</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="مثال: بدون بصل، حار جداً، إلخ..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            textAlign="right"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          </View>
          <View style={styles.paymentOption}>
            <View style={styles.paymentIcon}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.paymentTitle}>كاش عند الاستلام</Text>
              <Text style={styles.paymentSubtitle}>ادفع للسائق عند استلام طلبك</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={{ marginRight: 'auto' }} />
          </View>
        </View>

        {/* Order Items Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>ملخص الطلب من {cart.sellerName}</Text>
          </View>
          {cart.items.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.orderItemPrice}>{item.price * item.quantity} جنيه</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}>
            <Text style={styles.orderItemLabel}>رسوم التوصيل</Text>
            <Text style={styles.orderItemPrice}>{deliveryFee} جنيه</Text>
          </View>
          {donationAmount > 0 && (
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemLabel, { color: colors.primary }]}>تبرع</Text>
              <Text style={[styles.orderItemPrice, { color: colors.primary }]}>+{donationAmount} جنيه</Text>
            </View>
          )}
          {cart.isMealDonation && (
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemLabel, { color: colors.primary }]}>وجبة مجانية</Text>
              <Text style={[styles.orderItemPrice, { color: colors.primary }]}>مشكور</Text>
            </View>
          )}
          <View style={[styles.orderItem, styles.totalRow]}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{grandTotal} جنيه</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.orderBtn, loading && styles.orderBtnLoading]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.orderBtnText}>جاري تأكيد الطلب...</Text>
          ) : (
            <>
              <Text style={styles.orderBtnText}>تأكيد الطلب</Text>
              <Text style={styles.orderBtnTotal}>{grandTotal} جنيه</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    backgroundColor: colors.white, margin: 12, marginBottom: 0,
    borderRadius: 16, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  addressOption: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8,
  },
  addressOptionActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  radioCircleActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  addressText: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2, lineHeight: 18 },
  addAddressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', marginTop: 4,
  },
  addAddressText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  timeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  timeChipActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  timeText: { fontSize: 13, color: colors.text },
  timeTextActive: { color: colors.primary, fontWeight: '600' },
  notesInput: {
    backgroundColor: colors.background, borderRadius: 12, padding: 12,
    minHeight: 80, fontSize: 14, color: colors.text, lineHeight: 22,
    borderWidth: 1, borderColor: colors.border,
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: '#FFF8F5', borderRadius: 12,
  },
  paymentIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  paymentTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  paymentSubtitle: { fontSize: 12, color: colors.textLight, textAlign: 'right' },
  orderItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5,
  },
  orderItemName: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right' },
  orderItemLabel: { fontSize: 13, color: colors.textLight },
  orderItemPrice: { fontSize: 13, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  footer: {
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  orderBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  orderBtnLoading: { backgroundColor: colors.textLight },
  orderBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  orderBtnTotal: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
