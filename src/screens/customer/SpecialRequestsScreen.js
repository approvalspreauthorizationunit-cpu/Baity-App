import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const TABS = ['طلباتي', 'طلب جديد'];

export default function SpecialRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  // New Request Form
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: '' }]);
  const [deliveryDate, setDeliveryDate] = useState('');

  useEffect(() => {
    if (activeTab === 0) {
      loadRequests();
    }
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_requests')
        .select(`
          *,
          special_request_offers (
            *,
            seller_profiles (
              kitchen_name,
              commission_rate,
              users (full_name)
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load ratings for all sellers in offers
      const sellerIds = [...new Set(data.flatMap(r => r.special_request_offers.map(o => o.seller_id)))];
      let ratingsMap = {};
      if (sellerIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('seller_id, score');

        ratingsData?.forEach(r => {
          if (!ratingsMap[r.seller_id]) ratingsMap[r.seller_id] = { sum: 0, count: 0 };
          ratingsMap[r.seller_id].sum += r.score;
          ratingsMap[r.seller_id].count += 1;
        });
      }

      const enhancedData = data.map(r => ({
        ...r,
        special_request_offers: r.special_request_offers.map(o => ({
          ...o,
          avgRating: ratingsMap[o.seller_id]
            ? (ratingsMap[o.seller_id].sum / ratingsMap[o.seller_id].count).toFixed(1)
            : 'جديد'
        }))
      }));

      setRequests(enhancedData);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: '' }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmitRequest = async () => {
    if (!description.trim() || items.some(i => !i.name.trim() || !i.quantity)) {
      Alert.alert('تنبيه', 'برجاء إكمال بيانات الطلب');
      return;
    }

    // Simple date validation
    if (!deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        Alert.alert('تنبيه', 'برجاء إدخال التاريخ بصيغة YYYY-MM-DD');
        return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_requests')
        .insert({
          customer_id: user.id,
          region_id: user.region_id,
          description: description,
          requested_items: items,
          delivery_date: deliveryDate,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('تم', 'تم إرسال طلبك! سيصلك عروض الأسعار من الطهاة القريبين منك');
      setDescription('');
      setItems([{ name: '', quantity: '' }]);
      setDeliveryDate('');
      setActiveTab(0);
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (request, offer) => {
    Alert.alert(
      'تأكيد قبول العرض',
      `هل أنت متأكد من قبول عرض ${offer.seller_profiles.kitchen_name} بسعر ${offer.price} ج؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', onPress: () => processAccept(request, offer) }
      ]
    );
  };

  const processAccept = async (request, offer) => {
    setLoading(true);
    try {
      // 1. Accept offer
      await supabase.from('special_request_offers').update({ status: 'accepted' }).eq('id', offer.id);

      // 2. Reject others
      await supabase.from('special_request_offers')
        .update({ status: 'rejected' })
        .eq('request_id', request.id)
        .neq('id', offer.id);

      // 3. Close request
      await supabase.from('special_requests').update({ status: 'closed' }).eq('id', request.id);

      // 4. Create Order
      const commissionRate = offer.seller_profiles.commission_rate || 10;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          seller_id: offer.seller_id,
          status: 'pending',
          total_amount: offer.price,
          delivery_fee: 0,
          commission_amount: (offer.price * commissionRate) / 100,
          seller_earnings: offer.price * (1 - commissionRate / 100),
          scheduled_time: request.delivery_date,
          notes: `طلب خاص: ${request.description}`,
          delivery_address: user.addresses?.[0]?.address || 'العنوان المسجل'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      navigation.navigate('OrderTracking', { orderId: newOrder.id });
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ في معالجة العرض');
    } finally {
      setLoading(false);
    }
  };

  const renderRequest = ({ item: req }) => {
    const [expanded, setExpanded] = useState(false);
    const offers = req.special_request_offers || [];

    return (
      <View style={styles.requestCard}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestDesc} numberOfLines={expanded ? 0 : 2}>{req.description}</Text>
            <View style={styles.requestMeta}>
              <Text style={styles.requestDate}>تاريخ الاستلام: {req.delivery_date}</Text>
              <View style={[styles.statusBadge, { backgroundColor: req.status === 'open' ? '#E8F5E9' : '#F5F5F5' }]}>
                <Text style={[styles.statusText, { color: req.status === 'open' ? colors.success : colors.textLight }]}>
                  {req.status === 'open' ? 'مفتوح' : req.status === 'closed' ? 'مغلق' : 'ملغي'}
                </Text>
              </View>
            </View>
            <Text style={styles.offersCount}>{offers.length} عروض مقدمة</Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textLight} />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.subTitle}>الأصناف المطلوبة:</Text>
            {req.requested_items.map((item, i) => (
              <Text key={i} style={styles.itemText}>• {item.name} ({item.quantity})</Text>
            ))}

            <Text style={[styles.subTitle, { marginTop: 12 }]}>العروض:</Text>
            {offers.length === 0 ? (
                <Text style={styles.noOffers}>في انتظار عروض الطهاة...</Text>
            ) : (
                offers.map(offer => (
                    <View key={offer.id} style={styles.offerCard}>
                        <View style={styles.offerHeader}>
                            <View>
                                <Text style={styles.kitchenName}>{offer.seller_profiles.kitchen_name}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color={colors.star} />
                                    <Text style={styles.ratingText}>{offer.avgRating}</Text>
                                </View>
                            </View>
                            <Text style={styles.offerPrice}>{offer.price} ج</Text>
                        </View>
                        {offer.notes ? <Text style={styles.offerNotes}>{offer.notes}</Text> : null}

                        {req.status === 'open' && (
                            <View style={styles.offerActions}>
                                <TouchableOpacity
                                    style={[styles.offerBtn, styles.acceptBtn]}
                                    onPress={() => handleAcceptOffer(req, offer)}
                                >
                                    <Text style={styles.offerBtnText}>قبول العرض</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.offerBtn, styles.rejectBtn]}
                                    onPress={async () => {
                                        await supabase.from('special_request_offers').update({ status: 'rejected' }).eq('id', offer.id);
                                        loadRequests();
                                    }}
                                >
                                    <Text style={[styles.offerBtnText, { color: colors.error }]}>رفض</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {offer.status !== 'pending' && (
                            <View style={[styles.offerStatusBadge, { backgroundColor: offer.status === 'accepted' ? '#E8F5E9' : '#FFEBEE' }]}>
                                <Text style={{ color: offer.status === 'accepted' ? colors.success : colors.error, fontSize: 11 }}>
                                    {offer.status === 'accepted' ? 'تم القبول' : 'تم الرفض'}
                                </Text>
                            </View>
                        )}
                    </View>
                ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلب خاص</Text>
      </View>

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

      {activeTab === 0 ? (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderRequest}
          onRefresh={loadRequests}
          refreshing={loading}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="clipboard-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>لم تقم بإضافة أي طلبات خاصة بعد</Text>
              </View>
            )
          }
        />
      ) : (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>وصف الطلب</Text>
          <TextInput
            style={styles.textArea}
            placeholder="مثال: عزومة 20 شخص، نريد كشري ومحشي وسلطة"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlign="right"
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>عناصر الطلب</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.addBtnText}>+ إضافة صنف</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { width: 60 }]}
                placeholder="الكمية"
                value={item.quantity}
                onChangeText={(v) => handleUpdateItem(index, 'quantity', v)}
                keyboardType="numeric"
                textAlign="center"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="اسم الصنف"
                value={item.name}
                onChangeText={(v) => handleUpdateItem(index, 'name', v)}
                textAlign="right"
              />
            </View>
          ))}

          <Text style={styles.label}>تاريخ الاستلام (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-05-10"
            value={deliveryDate}
            onChangeText={setDeliveryDate}
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>إرسال الطلب</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textLight },
  tabTextActive: { color: colors.primary, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  requestCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestInfo: { flex: 1 },
  requestDesc: { fontSize: 15, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  requestDate: { fontSize: 12, color: colors.textLight },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  offersCount: { fontSize: 12, color: colors.primary, fontWeight: '600', textAlign: 'right' },
  expandedContent: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  subTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  itemText: { fontSize: 13, color: colors.text, textAlign: 'right', marginBottom: 4 },
  noOffers: { textAlign: 'center', color: colors.textLight, fontStyle: 'italic', marginVertical: 10 },
  offerCard: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#EEE' },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kitchenName: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  ratingText: { fontSize: 11, color: colors.textLight },
  offerPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  offerNotes: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 6 },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  offerBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.error },
  offerBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  offerStatusBadge: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  formContainer: { padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 8, marginTop: 16 },
  textArea: { backgroundColor: colors.white, borderRadius: 10, padding: 12, minHeight: 100, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.white, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  addBtnText: { color: colors.primary, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { color: colors.textLight, textAlign: 'center' }
});
