import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';

function StarRow({ rating }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i === Math.ceil(rating) && rating % 1 >= 0.5 ? 'star-half' : 'star-outline'}
          size={14}
          color={colors.star}
        />
      ))}
    </View>
  );
}

export default function SellerProfileScreen({ navigation, route }) {
  const { sellerId } = route.params;
  const { cart, addToCart, removeFromCart } = useApp();
  const insets = useSafeAreaInsets();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('seller_profiles')
        .select(`
          *,
          users (full_name, avatar_url),
          ratings (score)
        `)
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_available', true);

      if (productsError) throw productsError;

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select(`
          score, comment, created_at,
          users (full_name)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalScore = sellerData.ratings?.reduce((sum, r) => sum + r.score, 0) || 0;
      const reviewCount = sellerData.ratings?.length || 0;
      const avgRating = reviewCount > 0 ? (totalScore / reviewCount).toFixed(1) : 'جديد';

      const mappedSeller = {
        ...sellerData,
        name: sellerData.kitchen_name || sellerData.users?.full_name || 'بائعة',
        image: sellerData.users?.avatar_url,
        specialty: sellerData.bio || 'أكل بيتي',
        rating: avgRating,
        reviewCount: reviewCount,
        distance: 0.8, // Placeholder
        priceRange: '15-100', // Placeholder
        isOnline: sellerData.is_available,
        address: sellerData.address || 'القاهرة',
        workingHours: sellerData.working_hours ? { from: sellerData.working_hours.split(' - ')[0], to: sellerData.working_hours.split(' - ')[1] } : { from: '9:00', to: '21:00' },
        totalOrders: 0 // Placeholder
      };

      setSeller(mappedSeller);
      setProducts(productsData || []);
      setRatings(ratingsData || []);
    } catch (err) {
      console.error('Error loading seller data:', err.message);
      Alert.alert('خطأ', 'تعذر تحميل بيانات البائعة');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!seller) return null;

  const categories = ['الكل', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'الكل'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getItemQty = (productId) => {
    const item = cart.items.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.sellerId === seller.id
    ? cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
    : 0;
  const cartCount = cart.sellerId === seller.id
    ? cart.items.reduce((s, i) => s + i.quantity, 0)
    : 0;

  const handleAddToCart = (product) => {
    if (cart.sellerId && cart.sellerId !== seller.id) {
      Alert.alert(
        'تغيير البائعة',
        'سيتم مسح سلتك الحالية وإضافة منتج من بائعة جديدة. هل تريد المتابعة؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تابع', onPress: () => addToCart(product, seller) },
        ]
      );
    } else {
      addToCart(product, seller);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{seller.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Ionicons name="storefront-outline" size={72} color="rgba(255,255,255,0.9)" />
          <View style={[styles.onlineBadge, { backgroundColor: seller.isOnline ? colors.success : colors.offlineGray }]}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{seller.isOnline ? 'متاحة الآن' : 'غير متاحة'}</Text>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.sellerName}>{seller.name}</Text>
              <Text style={styles.specialty}>{seller.specialty}</Text>
              <View style={styles.ratingRow}>
                <StarRow rating={seller.rating} />
                <Text style={styles.ratingNum}>{seller.rating}</Text>
                <Text style={styles.reviewCount}>({seller.reviewCount} تقييم)</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={styles.statText}>{seller.distance} كم</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
              <Text style={styles.statText}>{seller.priceRange} جنيه</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.statText}>{seller.workingHours.from} - {seller.workingHours.to}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.statText}>{seller.totalOrders} طلب</Text>
            </View>
          </View>

          <Text style={styles.bio}>{seller.bio}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={14} color={colors.textLight} />
            <Text style={styles.address}>{seller.address}</Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ratings Section */}
        {ratings.length > 0 && (
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>التقييمات ({seller.reviewCount})</Text>
            {ratings.map((review, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.users?.full_name}</Text>
                  <StarRow rating={review.score} />
                </View>
                {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('ar-EG')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>القائمة ({filteredProducts.length} صنف)</Text>
          {filteredProducts.map(product => {
            const qty = getItemQty(product.id);
            return (
              <View key={product.id} style={[styles.productCard, !product.is_available && styles.productUnavailable]}>
                <View style={styles.productEmoji}>
                  <Ionicons name="fast-food-outline" size={32} color={colors.primary} />
                </View>
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {!product.is_available && (
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableText}>غير متاح</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                  <View style={styles.productFooter}>
                    <View style={styles.productMeta}>
                      <Text style={styles.price}>{product.price} جنيه</Text>
                      <View style={styles.prepTime}>
                        <Ionicons name="time-outline" size={12} color={colors.textLight} />
                        <Text style={styles.prepTimeText}>{product.prep_time || 20} د</Text>
                      </View>
                    </View>
                    {product.is_available && (
                      qty === 0 ? (
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(product)}>
                          <Ionicons name="add" size={20} color={colors.white} />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(product.id)}>
                            <Ionicons name="remove" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyNum}>{qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAddToCart(product)}>
                            <Ionicons name="add" size={16} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: cartCount > 0 ? 90 : 20 }} />
      </ScrollView>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('السلة')}>
            <View style={styles.cartBtnLeft}>
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartBtnText}>عرض السلة</Text>
            </View>
            <Text style={styles.cartBtnTotal}>{cartTotal} جنيه</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  heroBanner: {
    height: 160, backgroundColor: '#FFE8DC', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  onlineText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  infoCard: {
    backgroundColor: colors.white, margin: 12, borderRadius: 16, padding: 16,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  infoHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFE8DC',
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 4 },
  sellerName: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  specialty: { fontSize: 13, color: colors.textLight, textAlign: 'right' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 13, fontWeight: 'bold', color: colors.text },
  reviewCount: { fontSize: 12, color: colors.textLight },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: colors.textLight },
  bio: { fontSize: 13, color: colors.text, lineHeight: 20, textAlign: 'right', marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 12, color: colors.textLight, flex: 1, textAlign: 'right' },
  categoryScroll: { marginVertical: 12 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.white, marginLeft: 8, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, color: colors.text },
  catTextActive: { color: colors.white, fontWeight: '600' },
  productsSection: { paddingHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 10 },
  productCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 12, marginBottom: 10,
    flexDirection: 'row', gap: 12,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  productUnavailable: { opacity: 0.5 },
  productEmoji: {
    width: 70, height: 70, borderRadius: 12, backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  productName: { fontSize: 15, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'right' },
  unavailableBadge: { backgroundColor: colors.offlineGray, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  unavailableText: { fontSize: 10, color: colors.white },
  productDesc: { fontSize: 12, color: colors.textLight, lineHeight: 18, textAlign: 'right', marginBottom: 8 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingsSection: { paddingHorizontal: 12, marginBottom: 20 },
  reviewCard: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontSize: 13, fontWeight: 'bold' },
  reviewComment: { fontSize: 12, color: colors.text, textAlign: 'right', marginBottom: 4 },
  reviewDate: { fontSize: 10, color: colors.textLight, textAlign: 'right' },
  productMeta: { gap: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  prepTime: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prepTimeText: { fontSize: 11, color: colors.textLight },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0E8', borderRadius: 20, paddingHorizontal: 4,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 15, fontWeight: 'bold', color: colors.primary, minWidth: 20, textAlign: 'center' },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  cartBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cartBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 26, height: 26,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  cartCountText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  cartBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  cartBtnTotal: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
