/**
 * components/Badge.tsx
 * Colour-coded pill badge used for MessageType labels and counts.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MessageType } from '@schoolbridge/types';
import { Colors, Radius, FontSize, FontWeight } from '../src/theme';

const LABELS: Record<MessageType, string> = {
  NOTE: 'Note',
  HOMEWORK: 'Homework',
  BEHAVIOUR: 'Behaviour',
  ATTENDANCE: 'Attendance',
  RESULT: 'Result',
  ANNOUNCEMENT: 'Announcement',
  FEE_REMINDER: 'Fee Reminder',
  EVENT: 'Event',
};

interface BadgeProps {
  type: MessageType;
}

export function MessageTypeBadge({ type }: BadgeProps) {
  const colours = Colors.badge[type] ?? { bg: Colors.brandLight, text: Colors.brand };
  return (
    <View style={[styles.badge, { backgroundColor: colours.bg }]}>
      <Text style={[styles.label, { color: colours.text }]}>
        {LABELS[type]}
      </Text>
    </View>
  );
}

interface CountBadgeProps {
  count: number;
  /** If true, renders a blue filled pill */
  filled?: boolean;
}

export function CountBadge({ count, filled = false }: CountBadgeProps) {
  if (count === 0) return null;
  return (
    <View
      style={[
        styles.countBadge,
        filled ? styles.filledBadge : styles.outlineBadge,
      ]}
    >
      <Text
        style={[
          styles.countLabel,
          { color: filled ? Colors.surface : Colors.brand },
        ]}
      >
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  countBadge: {
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filledBadge: {
    backgroundColor: Colors.brand,
  },
  outlineBadge: {
    backgroundColor: Colors.brandLight,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
});
