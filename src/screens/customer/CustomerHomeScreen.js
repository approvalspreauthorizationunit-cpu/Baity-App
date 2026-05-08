import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, StatusBar, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import SellerCard from '../../components/SellerCard';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const categories = ['الكل', 'كشري', 'فتة', 'حلويات', 'مشاوي', 'سلطات', 'خبز', 'ملوخية', 'عصائر'];

export default function CustomerHomeScreen({ navigation }) {
  const { user } = useApp();
  const [locationLabel, setLocationLabel] = useState('تحديد موقعك...');
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [sortBy, setSortBy] = useState('distance');

  useEffect(() => {
    requestLocation();
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select(`
          *,
          is_verified,
          users (full_name, avatar_url, region_id),
          products (id, name, price, category, is_available),
          ratings (score)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      if (data) {
        // Map Supabase data to what the UI expects
        const mappedSellers = data.map(s => {
          const sellerProducts = s.products || [];
          const prices = sellerProducts.map(p => p.price);
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;

          const totalScore = s.ratings?.reduce((sum, r) => sum + r.score, 0) || 0;
          const reviewCount = s.ratings?.length || 0;
          const avgRating = reviewCount > 0 ? (totalScore / reviewCount).toFixed(1) : 'جديد';

          return {
            id: s.id,
            name: s.kitchen_name || s.users?.full_name || 'بائعة',
            specialty: s.bio || 'أكل بيتي',
            categories: [...new Set(sellerProducts.map(p => p.category))].filter(Boolean),
            rating: avgRating,
            reviewCount: reviewCount,
            distance: 0.8, // Placeholder
            priceRange: prices.length ? `${minPrice}-${maxPrice}` : '0',
            isOnline: s.is_available,
            is_verified: s.is_verified,
            image: s.users?.avatar_url
          };
        });
        setSellers(mappedSellers);
      }
    } catch (err) {
      console.error('Error loading sellers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const [address] = await Location.reverseGeocodeAsync(loc.coords).catch(() => []);
        if (address) {
          const parts = [address.district || address.subregion, address.city].filter(Boolean);
          setLocationLabel(parts.join('، ') || 'موقعك الحالي');
        } else {
          setLocationLabel('موقعك الحالي');
        }
      } else {
        setLocationLabel('القاهرة');
      }
    } catch {
      setLocationLabel('القاهرة');
    }
  };

  const filteredSellers = useMemo(() => {
    let result = [...sellers];
    if (search.trim()) {
      result = result.filter(s =>
        s.name.includes(search) ||
        s.specialty.includes(search) ||
        s.categories.some(c => c.includes(search))
      );
    }
    if (selectedCategory !== 'الكل') {
      result = result.filter(s =>
        s.categories.some(c => c.includes(selectedCategory))
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'online') return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
      return 0;
    });
    return result;
  }, [sellers, search, selectedCategory, sortBy]);

  const onlineSellers = useMemo(() => sellers.filter(s => s.isOnline).length, [sellers]);

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('GuestSettings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineCount}>{onlineSellers} متاحة الآن</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.greeting}>أهلاً، {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'بك'}</Text>
          <TouchableOpacity style={styles.locationRow} onPress={requestLocation}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="ابحث عن طعام أو بائعة..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.resultsCount}>{filteredSellers.length} بائعة</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'distance' && styles.sortBtnActive]}
            onPress={() => setSortBy('distance')}
          >
            <Ionicons name="location-outline" size={13} color={sortBy === 'distance' ? colors.white : colors.textLight} />
            <Text style={[styles.sortText, sortBy === 'distance' && styles.sortTextActive]}>الأقرب</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'rating' && styles.sortBtnActive]}
            onPress={() => setSortBy('rating')}
          >
            <Ionicons name="star-outline" size={13} color={sortBy === 'rating' ? colors.white : colors.textLight} />
            <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>الأعلى تقييماً</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'online' && styles.sortBtnActive]}
            onPress={() => setSortBy('online')}
          >
            <Ionicons name="radio-button-on-outline" size={13} color={sortBy === 'online' ? colors.white : colors.textLight} />
            <Text style={[styles.sortText, sortBy === 'online' && styles.sortTextActive]}>متاحة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sellers List */}
      {loading && sellers.length === 0 ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={filteredSellers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SellerCard
              seller={item}
              onPress={() => navigation.navigate('SellerProfile', { sellerId: item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="لا يوجد طهاة متاحون"
              message="لا يوجد طهاة متاحون في منطقتك حالياً"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    maxWidth: 150,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineCount: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  categoriesScroll: {
    marginBottom: 8,
    minHeight: 46,
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.textLight,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    fontSize: 11,
    color: colors.textLight,
  },
  sortTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textLight,
  },
});
