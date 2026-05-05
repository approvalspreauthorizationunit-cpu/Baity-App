import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const categoryIcon = (cats = []) => {
  const first = cats[0] || '';
  if (['حلويات','كيك','معجنات','بسكويت'].some(c => first.includes(c))) return { icon: 'cafe-outline', bg: '#FFF3E0' };
  if (['مشاوي','كباب','فراخ'].some(c => first.includes(c)))            return { icon: 'flame-outline',      bg: '#FBE9E7' };
  if (['خبز','عيش','سميط','فطير'].some(c => first.includes(c)))        return { icon: 'nutrition-outline',   bg: '#F3E5F5' };
  if (['عصائر','مشروبات','شاي'].some(c => first.includes(c)))          return { icon: 'wine-outline',         bg: '#E8F5E9' };
  if (['سلطات','خضار','صحي'].some(c => first.includes(c)))             return { icon: 'leaf-outline',         bg: '#E8F5E9' };
  return { icon: 'restaurant-outline', bg: '#FFF0E8' };
};

export default function SellerCard({ seller, onPress }) {
  const { icon, bg } = categoryIcon(seller.categories);
  const renderStars = (rating) => {
    const stars = [];
    const num = parseFloat(rating);

    if (isNaN(num)) {
       return <Text style={{ fontSize: 10, color: colors.primary, fontWeight: 'bold' }}>جديد</Text>;
    }

    const fullStars = Math.floor(num);
    const hasHalf = num % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color={colors.star} />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color={colors.star} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color={colors.star} />);
      }
    }
    return stars;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <View style={[styles.imagePlaceholder, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={46} color={colors.primary} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: seller.isOnline ? colors.success : colors.offlineGray }]}>
          <Text style={styles.statusText}>{seller.isOnline ? 'متاحة' : 'غير متاحة'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{seller.name}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.stars}>{renderStars(seller.rating)}</View>
            <Text style={styles.ratingText}>{seller.rating}</Text>
            <Text style={styles.reviewCount}>({seller.reviewCount})</Text>
          </View>
        </View>
        <Text style={styles.specialty} numberOfLines={1}>{seller.specialty}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={styles.detailText}>{seller.distance} كم</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={13} color={colors.textLight} />
            <Text style={styles.detailText}>{seller.priceRange} جنيه</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="delivery-dining" size={13} color={colors.textLight} />
            <Text style={styles.detailText}>توصيل</Text>
          </View>
        </View>
        <View style={styles.categoriesRow}>
          {seller.categories.slice(0, 3).map((cat, idx) => (
            <View key={idx} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  imagePlaceholder: {
    width: 110,
    height: 120,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 42,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 10,
    color: colors.textLight,
  },
  specialty: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    color: colors.textLight,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  categoryChip: {
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
});
