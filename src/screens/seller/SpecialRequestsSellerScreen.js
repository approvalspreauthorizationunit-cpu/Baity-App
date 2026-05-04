import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

export default function SpecialRequestsSellerScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);

  // Offer Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSellerAndRequests();
  }, []);

  const loadSellerAndRequests = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSellerProfile(profile);

      if (profile) {
        await loadRequests(profile.region_id, profile.id);
        subscribeToRequests(profile.region_id, profile.id);
      }
    } catch (err) {
      console.error('Error loading seller profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (regionId, sellerId) => {
    try {
      const { data, error } = await supabase
        .from('special_requests')
        .select(`
          *,
          users (full_name),
          special_request_offers (id, seller_id)
        `)
        .eq('region_id', regionId)
        .eq('status', 'open')
        .order('delivery_date', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  };

  const subscribeToRequests = (regionId, sellerId) => {
    const channel = supabase
      .channel('region-requests-' + regionId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'special_requests',
        filter: `region_id=eq.${regionId}`
      }, () => {
        loadRequests(regionId, sellerId);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSubmitOffer = async () => {
    const price = parseFloat(offerPrice);
    if (!price || price <= 0) {
      Alert.alert('تنبيه', 'برجاء إدخال سعر صحيح');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('special_request_offers')
        .insert({
          request_id: selectedRequest.id,
          seller_id: sellerProfile.id,
          price: price,
          notes: offerNotes,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('تم', 'تم إرسال عرضك بنجاح');
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferNotes('');
      loadRequests(sellerProfile.region_id, sellerProfile.id);
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ في إرسال العرض');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequest = ({ item: req }) => {
    const hasOffered = req.special_request_offers?.some(o => o.seller_id === sellerProfile?.id);

    return (
      <View style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{req.users?.full_name || 'عميل'}</Text>
          <Text style={styles.requestDate}>الاستلام: {req.delivery_date}</Text>
        </View>
        <Text style={styles.requestDesc}>{req.description}</Text>

        <View style={styles.itemsBox}>
          {req.requested_items?.map((item, i) => (
            <Text key={i} style={styles.itemText}>• {item.name} ({item.quantity})</Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.offersInfo}>{req.special_request_offers?.length || 0} عروض حالية</Text>
          {hasOffered ? (
            <View style={styles.submittedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.submittedText}>تم إرسال عرضك</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.offerBtn}
              onPress={() => { setSelectedRequest(req); setShowOfferModal(true); }}
            >
              <Text style={styles.offerBtnText}>إرسال عرض سعر</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلبات خاصة في منطقتك</Text>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderRequest}
          onRefresh={() => loadRequests(sellerProfile?.region_id, sellerProfile?.id)}
          refreshing={loading}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <EmptyState
              icon="megaphone-outline"
              title="لا توجد طلبات خاصة"
              message="لا توجد طلبات خاصة في منطقتك حالياً"
            />
          }
        />
      )}

      {/* Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إرسال عرض سعر</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
                {selectedRequest && (
                    <View style={styles.requestSummary}>
                        <Text style={styles.summaryTitle}>تفاصيل الطلب:</Text>
                        <Text style={styles.summaryDesc}>{selectedRequest.description}</Text>
                    </View>
                )}

                <Text style={styles.label}>السعر الإجمالي المقترح (ج)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                    textAlign="center"
                />

                <Text style={styles.label}>ملاحظات إضافية (اختياري)</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="مثال: السعر يشمل التوصيل..."
                    multiline
                    numberOfLines={3}
                    value={offerNotes}
                    onChangeText={setOfferNotes}
                    textAlign="right"
                />
            </ScrollView>

            <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitOffer}
                disabled={submitting}
            >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>إرسال العرض</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  requestCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  customerName: { fontSize: 16, fontWeight: 'bold' },
  requestDate: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  requestDesc: { fontSize: 14, color: colors.text, textAlign: 'right', marginBottom: 12, lineHeight: 20 },
  itemsBox: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10, marginBottom: 12 },
  itemText: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  offersInfo: { fontSize: 12, color: colors.textLight },
  offerBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  offerBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  submittedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  submittedText: { color: colors.success, fontSize: 13, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 150, gap: 16 },
  emptyText: { color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  requestSummary: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 16 },
  summaryTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'right', color: colors.textLight },
  summaryDesc: { fontSize: 13, textAlign: 'right', marginTop: 4 },
  label: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, fontSize: 18, fontWeight: 'bold' },
  textArea: { backgroundColor: colors.background, borderRadius: 10, padding: 12, minHeight: 80, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
