import React from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function VerifiedBadge({ size = 16 }) {
  return (
    <Ionicons
      name="checkmark-circle"
      size={size}
      color="#1D9BF0"
      style={{ marginLeft: 4 }}
    />
  )
}
