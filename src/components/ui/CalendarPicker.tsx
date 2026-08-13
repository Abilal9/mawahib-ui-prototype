import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  /** Any day inside the month to render. */
  month: Date;
  onMonthChange: (month: Date) => void;
  onPickDay: (day: Date) => void;
  /** `single` highlights one day; `range` shades everything between the ends. */
  mode?: 'single' | 'range';
  selected?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Month grid used by every deadline picker, so selection behaves the same. */
export default function CalendarPicker({
  month,
  onMonthChange,
  onPickDay,
  mode = 'single',
  selected,
  rangeStart,
  rangeEnd,
}: Props) {
  const grid = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    return {
      label: month.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      leadingBlanks: new Date(year, monthIndex, 1).getDay(),
      days: Array.from(
        { length: new Date(year, monthIndex + 1, 0).getDate() },
        (_, i) => i + 1,
      ),
    };
  }, [month]);

  const dayAt = (day: number) =>
    new Date(month.getFullYear(), month.getMonth(), day);

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{grid.label}</Text>
        <View style={styles.nav}>
          <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(-1)}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(1)}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {Array.from({ length: grid.leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCell} />
        ))}
        {grid.days.map((day) => {
          const date = dayAt(day);
          const isStart = mode === 'range' && sameDay(date, rangeStart);
          const isEnd = mode === 'range' && sameDay(date, rangeEnd);
          const isSelected =
            mode === 'range' ? isStart || isEnd : sameDay(date, selected);
          const inRange =
            mode === 'range' &&
            !!rangeStart &&
            !!rangeEnd &&
            date.getTime() > rangeStart.getTime() &&
            date.getTime() < rangeEnd.getTime();
          const bothEnds = !!rangeStart && !!rangeEnd;

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                inRange && styles.dayCellInRange,
                isStart && bothEnds && styles.dayCellRangeStart,
                isEnd && bothEnds && styles.dayCellRangeEnd,
              ]}
              onPress={() => onPickDay(date)}
              activeOpacity={0.8}
            >
              <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                <Text
                  style={[styles.dayText, isSelected && styles.dayTextSelected]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellInRange: { backgroundColor: colors.primary + '18' },
  dayCellRangeStart: {
    backgroundColor: colors.primary + '18',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  dayCellRangeEnd: {
    backgroundColor: colors.primary + '18',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  dayInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.primary },
  dayText: { ...typography.caption, color: colors.text },
  dayTextSelected: { color: colors.white, fontWeight: '600' },
});
