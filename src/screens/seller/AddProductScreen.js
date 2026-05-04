import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const foodCategories = ['كشري', 'فول وطعمية', 'مشاوي', 'دجاج', 'لحوم', 'سمك', 'حلويات', 'مخبوزات', 'سلطات', 'مشروبات', 'مقبلات', 'أطباق شامية', 'أخرى'];

export default function AddProductScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [loading, setLoading] = useState(false);

  const existingProduct = route?.params?.product;
  const isEdit = !!existingProduct;

  const [name, setName] = useState(existingProduct?.name || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [price, setPrice] = useState(existingProduct?.price?.toString() || '');
  const [prepTime, setPrepTime] = useState(existingProduct?.prep_time?.toString() || '');
  const [quantity, setQuantity] = useState(existingProduct?.quantity?.toString() || '');
  const [category, setCategory] = useState(existingProduct?.category || '');
  const [available, setAvailable] = useState(existingProduct?.is_available !== false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('تنبيه', 'برجاء إدخال اسم المنتج'); return; }
    if (!price.trim() || isNaN(price)) { Alert.alert('تنبيه', 'برجاء إدخال سعر صحيح'); return; }
    if (!category) { Alert.alert('تنبيه', 'برجاء اختيار فئة المنتج'); return; }

    setLoading(true);
    try {
      // 1. Get seller profile id
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Seller profile not found');

      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        prep_time: parseInt(prepTime) || 20,
        quantity: parseInt(quantity) || 10,
        category,
        is_available: available,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', existingProduct.id);

        if (error) throw error;
        Alert.alert('تم', 'تم تحديث المنتج بنجاح', [{ text: 'حسناً', onPress: () => {
          route.params?.onSave?.();
          navigation.goBack();
        } }]);
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...productData, seller_id: profile.id });

        if (error) throw error;
        Alert.alert('تم', 'تم إضافة المنتج بنجاح', [{ text: 'حسناً', onPress: () => {
          route.params?.onSave?.();
          navigation.goBack();
        } }]);
      }
    } catch (err) {
      console.error('Error saving product:', err.message);
      Alert.alert('خطأ', 'تعذر حفظ بيانات المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.saveBtnText}>حفظ</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Photo Placeholder */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={36} color={colors.textLight} />
            <Text style={styles.photoText}>إضافة صورة للمنتج</Text>
            <Text style={styles.photoSubText}>اضغطي لاختيار صورة</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

          <View style={styles.field}>
            <Text style={styles.label}>اسم المنتج *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="مثال: كشري كبير"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>الوصف</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="اكتبي وصفاً شهياً للأكل..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              textAlign="right"
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>السعر (جنيه) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
                editable={!loading}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>وقت التحضير (د)</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="20"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>الكمية المتاحة</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="10"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              editable={!loading}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الفئة *</Text>
          <View style={styles.categoriesGrid}>
            {foodCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <View style={styles.availabilityRow}>
            <View>
              <Text style={styles.availLabel}>متاح للبيع</Text>
              <Text style={styles.availSubLabel}>{available ? 'يظهر للعملاء' : 'مخفي من القائمة'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, available && styles.toggleActive]}
              onPress={() => setAvailable(!available)}
              disabled={loading}
            >
              <View style={[styles.toggleThumb, available && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
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
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  photoSection: { alignItems: 'center', padding: 20 },
  photoPlaceholder: {
    width: 140, height: 140, borderRadius: 16, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  photoText: { fontSize: 13, fontWeight: '600', color: colors.textLight },
  photoSubText: { fontSize: 11, color: colors.textMuted },
  section: {
    backgroundColor: colors.white, margin: 12, marginBottom: 0, borderRadius: 16, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 14 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', gap: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, color: colors.text },
  catTextActive: { color: colors.white, fontWeight: '600' },
  availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  availSubLabel: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  toggle: {
    width: 52, height: 28, borderRadius: 14, backgroundColor: colors.border,
    padding: 2, justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.success },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
});
