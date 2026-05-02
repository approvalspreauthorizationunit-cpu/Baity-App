import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function StatCard({ icon, iconColor, bgColor, label, value, suffix }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor || '#FFF0E8' }]}>
        <Ionicons name={icon} size={22} color={iconColor || colors.primary} />
      </View>
      <Text style={styles.value}>
        {value}
        {suffix && <Text style={styles.suffix}> {suffix}</Text>}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  suffix: {
    fontSize: 12,
    fontWeight: 'normal',
    color: colors.textLight,
  },
  label: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});
