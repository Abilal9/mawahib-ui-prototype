import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import {
  CALENDAR_MONTH,
  calendarEvents,
  getUpcomingEvents,
} from '../../data/mock/calendar';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface SidebarCalendarPreviewProps {
  onPress: () => void;
}

export default function SidebarCalendarPreview({ onPress }: SidebarCalendarPreviewProps) {
  const daysInMonth = new Date(
    CALENDAR_MONTH.getFullYear(),
    CALENDAR_MONTH.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    CALENDAR_MONTH.getFullYear(),
    CALENDAR_MONTH.getMonth(),
    1
  ).getDay();
  const monthName = CALENDAR_MONTH.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const eventDays = calendarEvents.map((event) => event.date);
  const today = 12;
  const upcoming = getUpcomingEvents(1)[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>

      <Text style={styles.monthName}>{monthName}</Text>

      <View style={styles.weekDays}>
        {DAYS_OF_WEEK.map((day, index) => (
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
          const hasEvent = eventDays.includes(day);
          const isToday = day === today;
          return (
            <View key={day} style={styles.dayCell}>
              <View style={[styles.dayInner, isToday && styles.dayToday]}>
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>{day}</Text>
              </View>
              {hasEvent && <View style={styles.eventDot} />}
            </View>
          );
        })}
      </View>

      {upcoming && (
        <View style={styles.upcoming}>
          <View style={[styles.eventStripe, { backgroundColor: upcoming.color }]} />
          <View style={styles.upcomingInfo}>
            <Text style={styles.upcomingTitle} numberOfLines={1}>
              {upcoming.title}
            </Text>
            <Text style={styles.upcomingMeta}>
              Jul {upcoming.date} · {upcoming.time}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.label,
    color: colors.text,
  },
  monthName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayInner: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayToday: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 11,
  },
  dayTextToday: {
    color: colors.white,
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  upcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  eventStripe: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  upcomingMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
