import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function SellerProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // 1. Get seller profile id
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // 2. Load products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err.message);
      Alert.alert('خطأ', 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (productId, currentValue) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentValue })
        .eq('id', productId);

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: !currentValue } : p));
    } catch (err) {
      Alert.alert('خطأ', 'تعذر تحديث الحالة');
    }
  };

  const handleDelete = (productId, name) => {
    Alert.alert(
      'حذف المنتج',
      `هل أنت متأكد من حذف "${name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;
              setProducts(prev => prev.filter(p => p.id !== productId));
            } catch (err) {
              Alert.alert('خطأ', 'تعذر حذف المنتج');
            }
          },
        },
      ]
    );
  };

  const categories = ['الكل', ...new Set(products.map(p => p.category))];
  const filteredProducts = filter === 'الكل' ? products : products.filter(p => p.category === filter);
  const availableCount = products.filter(p => p.is_available).length;

  const renderProduct = ({ item: product }) => (
    <View style={[styles.productCard, !product.is_available && styles.productCardInactive]}>
      <View style={styles.productEmoji}>
        <Ionicons name="fast-food-outline" size={28} color={colors.primary} />
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productTop}>
          <Text style={styles.productName}>{product.name}</Text>
          <Switch
            value={product.is_available}
            onValueChange={() => toggleAvailability(product.id, product.is_available)}
            trackColor={{ false: colors.border, true: colors.success + '60' }}
            thumbColor={product.is_available ? colors.success : colors.textMuted}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={styles.productDesc} numberOfLines={1}>{product.description}</Text>
        <View style={styles.productMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textLight} />
            <Text style={styles.metaText}>{product.prep_time || 20} دقيقة</Text>
          </View>
          <Text style={styles.price}>{product.price} جنيه</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddProduct', { product, onSave: loadProducts })}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(product.id, product.name)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct', { onSave: loadProducts })}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>إضافة</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>منتجاتي</Text>
          <Text style={styles.headerSub}>{availableCount}/{products.length} متاح</Text>
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.filterScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filter === cat && styles.filterChipActive]}
              onPress={() => setFilter(cat)}
            >
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>لا توجد منتجات</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => navigation.navigate('AddProduct', { onSave: loadProducts })}
          >
            <Text style={styles.emptyAddBtnText}>أضيفي منتجك الأول</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={loadProducts}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  headerSub: { fontSize: 12, color: colors.textLight, textAlign: 'right' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  filterScroll: {
    paddingVertical: 10, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { padding: 12, gap: 10 },
  productCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 12,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  productCardInactive: { opacity: 0.65 },
  productEmoji: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'right' },
  productCategory: {
    fontSize: 11, color: colors.primary, fontWeight: '600', textAlign: 'right',
    backgroundColor: '#FFF0E8', alignSelf: 'flex-end', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    marginTop: 2,
  },
  productDesc: { fontSize: 12, color: colors.textLight, textAlign: 'right', marginTop: 3 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, justifyContent: 'flex-end' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: colors.textLight },
  price: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  actions: { gap: 6 },
  editBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  emptyAddBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
});
