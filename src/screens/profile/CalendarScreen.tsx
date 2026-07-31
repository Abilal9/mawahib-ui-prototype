import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import {
  CALENDAR_MONTH,
  getEventsForDay,
} from '../../data/mock/calendar';
import { ScreenProps } from '../../navigation/types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(year: number, month: number, day: number) {
  return Math.min(day, daysInMonth(year, month));
}

export default function CalendarScreen({ navigation }: ScreenProps<'Calendar'>) {
  const [currentMonth, setCurrentMonth] = useState(CALENDAR_MONTH);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const [selectedDay, setSelectedDay] = useState(14);

  const monthLabel = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const dayEvents = getEventsForDay(year, month, selectedDay);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    const nextYear = next.getFullYear();
    const nextMonth = next.getMonth();
    const today = new Date();
    const isCurrentMonth =
      nextYear === today.getFullYear() && nextMonth === today.getMonth();

    setCurrentMonth(next);
    setSelectedDay(
      isCurrentMonth ? today.getDate() : clampDay(nextYear, nextMonth, selectedDay)
    );
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {DAYS_OF_WEEK.map((day) => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const dayDots = getEventsForDay(year, month, day);
            const isSelected = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={styles.dayCell}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.8}
              >
                <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </View>
                {dayDots.length > 0 ? (
                  <View style={styles.eventDotsRow}>
                    {dayDots.slice(0, 3).map((event) => (
                      <View
                        key={event.id}
                        style={[
                          styles.eventDot,
                          { backgroundColor: isSelected ? colors.white : event.color },
                        ]}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.eventDotSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            Events on {monthName} {selectedDay}
          </Text>
          {dayEvents.length === 0 ? (
            <Text style={styles.noEvents}>No events scheduled</Text>
          ) : (
            dayEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventIndicator, { backgroundColor: event.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.text },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  monthName: { ...typography.h2, color: colors.text },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screen,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: { ...typography.body, color: colors.text },
  dayTextSelected: {
    color: colors.white,
    fontFamily: typography.label.fontFamily,
  },
  eventDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
    minHeight: 5,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  eventDotSpacer: {
    width: 5,
    height: 5,
    marginTop: 4,
  },
  eventsSection: { padding: spacing.screen, paddingTop: spacing.xl },
  eventsTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  noEvents: { ...typography.body, color: colors.textSecondary },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  eventIndicator: { width: 4, borderRadius: 2 },
  eventInfo: { flex: 1 },
  eventTitle: { ...typography.label, color: colors.text },
  eventTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
