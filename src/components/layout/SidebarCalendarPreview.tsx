import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Figma sidebar: June with day 21 selected + colored event dots */
const EVENT_DOTS: Record<number, string[]> = {
  20: ['#F0B429'],
  21: ['#2CB67D'],
  22: ['#3B82F6'],
  23: ['#F0B429', '#2CB67D'],
  24: ['#3B82F6'],
  25: ['#2CB67D'],
  30: ['#F0B429', '#3B82F6'],
};

interface SidebarCalendarPreviewProps {
  onPress: () => void;
}

export default function SidebarCalendarPreview({ onPress }: SidebarCalendarPreviewProps) {
  const [month, setMonth] = useState(() => new Date(2025, 5, 1)); // June 2025
  const selectedDay = 21;

  const { firstDay, monthLabel, days } = useMemo(() => {
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const monthLabel = month.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { firstDay, monthLabel, days };
  }, [month]);

  const shiftMonth = (delta: number) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </TouchableOpacity>
        <View style={styles.nav}>
          <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(-1)}>
            <Ionicons name="chevron-back" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(1)}>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        <View style={styles.weekDays}>
          {WEEKDAYS.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const isSelected =
              day === selectedDay && month.getMonth() === 5 && month.getFullYear() === 2025;
            const dots = EVENT_DOTS[day] ?? [];
            return (
              <View key={day} style={styles.dayCell}>
                <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </View>
                {dots.length > 0 ? (
                  <View style={styles.dotsRow}>
                    {dots.map((color, i) => (
                      <View
                        key={`${day}-dot-${i}`}
                        style={[styles.dot, { backgroundColor: color }]}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.dotsSpacer} />
                )}
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%' as `${number}%`,
    alignItems: 'center',
    paddingVertical: 0,
    minHeight: 24,
  },
  dayInner: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 10,
    lineHeight: 12,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 1,
    minHeight: 3,
  },
  dotsSpacer: {
    height: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
