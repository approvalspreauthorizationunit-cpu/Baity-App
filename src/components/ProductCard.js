import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, seller, showActions = true }) {
  const { cart, addToCart, removeFromCart } = useApp();
  const cartItem = cart.items.find(i => i.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <View style={[styles.card, !product.available && styles.unavailable]}>
      <View style={styles.leftSection}>
        <View style={styles.emoji}>
          <Ionicons name="fast-food-outline" size={28} color={colors.primary} />
        </View>
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{product.name}</Text>
          {!product.available && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>غير متاح</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color={colors.textLight} />
            <Text style={styles.metaText}>{product.prepTime} دقيقة</Text>
          </View>
          <Text style={styles.price}>{product.price} جنيه</Text>
        </View>
      </View>
      {showActions && product.available && (
        <View style={styles.actions}>
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(product, seller)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => removeFromCart(product.id)}
              >
                <Ionicons name="remove" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => addToCart(product, seller)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  unavailable: {
    opacity: 0.6,
  },
  leftSection: {
    marginLeft: 10,
  },
  emoji: {
    width: 56,
    height: 56,
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  unavailableBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 3,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textLight,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    marginRight: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#FFF0E8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
});
