import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENTS = [
  { id: 'e1', title: 'Client Meeting - Brand Review', date: 14, time: '10:00 AM', color: colors.primary },
  { id: 'e2', title: 'Photo Shoot - Emirates', date: 16, time: '2:00 PM', color: '#2CB67D' },
  { id: 'e3', title: 'Design Workshop', date: 22, time: '11:00 AM', color: '#FF6B35' },
];

export default function CalendarScreen({ navigation }: ScreenProps<'Calendar'>) {
  const [currentMonth] = useState(new Date(2026, 6, 1));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const [selectedDay, setSelectedDay] = useState(14);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const eventDays = EVENTS.map((e) => e.date);

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthHeader}>
          <TouchableOpacity><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity><Ionicons name="chevron-forward" size={24} color={colors.text} /></TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {DAYS_OF_WEEK.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const hasEvent = eventDays.includes(day);
            const isSelected = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCell, isSelected && styles.daySelected]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                {hasEvent && <View style={styles.eventDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>Events on July {selectedDay}</Text>
          {EVENTS.filter((e) => e.date === selectedDay).length === 0 ? (
            <Text style={styles.noEvents}>No events scheduled</Text>
          ) : (
            EVENTS.filter((e) => e.date === selectedDay).map((event) => (
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingVertical: spacing.lg,
  },
  monthName: { ...typography.h2, color: colors.text },
  weekDays: { flexDirection: 'row', paddingHorizontal: spacing.screen, marginBottom: spacing.sm },
  weekDay: { flex: 1, textAlign: 'center', ...typography.caption, color: colors.textSecondary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screen },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  daySelected: { backgroundColor: colors.primary, borderRadius: radius.full },
  dayText: { ...typography.body, color: colors.text },
  dayTextSelected: { color: colors.white, fontFamily: typography.label.fontFamily },
  eventDot: {
    position: 'absolute', bottom: 6,
    width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary,
  },
  eventsSection: { padding: spacing.screen, paddingTop: spacing.xl },
  eventsTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  noEvents: { ...typography.body, color: colors.textSecondary },
  eventCard: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.borderLight, gap: spacing.md,
  },
  eventIndicator: { width: 4, borderRadius: 2 },
  eventInfo: { flex: 1 },
  eventTitle: { ...typography.label, color: colors.text },
  eventTime: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
