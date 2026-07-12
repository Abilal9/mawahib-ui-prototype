import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { getJobById } from '../../data/mock/jobs';
import { getUserJobById } from '../../data/mock/userJobs';
import { ScreenProps } from '../../navigation/types';

const TIMELINE = [
  { id: '1', title: 'Application Submitted', date: 'Jul 8, 2026', status: 'completed' as const },
  { id: '2', title: 'Under Review', date: 'Jul 9, 2026', status: 'completed' as const },
  { id: '3', title: 'Interview Scheduled', date: 'Jul 14, 2026', status: 'current' as const },
  { id: '4', title: 'Final Decision', date: 'Pending', status: 'pending' as const },
];

export default function JobInProgressScreen({ route, navigation }: ScreenProps<'JobInProgress'>) {
  const userJob = getUserJobById(route.params.jobId);
  const job = getJobById(route.params.jobId);

  if (userJob) {
    return (
      <ScreenContainer padded={false}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.jobCard}>
            <Text style={styles.jobTitle}>{userJob.title}</Text>
            <View style={styles.jobMeta}>
              <Text style={styles.jobMetaText}>{userJob.statusLabel}</Text>
              {userJob.jobType && (
                <>
                  <Text style={styles.jobMetaDot}>·</Text>
                  <Text style={styles.jobMetaText}>{userJob.jobType}</Text>
                </>
              )}
            </View>
            <View style={[styles.matchBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.matchText}>
                {userJob.type === 'received' ? 'Received' : 'Sent'} · {userJob.date}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {userJob.type === 'received' ? 'From' : 'To'}
          </Text>
          <View style={styles.jobCard}>
            <Text style={styles.jobCompany}>{userJob.counterpart.name}</Text>
            {userJob.dueDate && (
              <View style={styles.jobMeta}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.jobMetaText}>Due {userJob.dueDate}</Text>
              </View>
            )}
          </View>

          <Button
            title="Message"
            variant="outline"
            onPress={() => navigation.navigate('MainTabs', { screen: 'MessagesTab' })}
            fullWidth
            style={styles.messageButton}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (!job) {
    return (
      <ScreenContainer>
        <Text>Job not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Status</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
          <View style={styles.jobMeta}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.jobMetaText}>{job.location}</Text>
            <Text style={styles.jobMetaDot}>·</Text>
            <Text style={styles.jobMetaText}>{job.type}</Text>
          </View>
          {job.matchScore && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{job.matchScore}% match</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        {TIMELINE.map((item, index) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineDot,
                item.status === 'completed' && styles.dotCompleted,
                item.status === 'current' && styles.dotCurrent,
              ]}>
                {item.status === 'completed' && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              {index < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitle, item.status === 'current' && styles.timelineTitleCurrent]}>
                {item.title}
              </Text>
              <Text style={styles.timelineDate}>{item.date}</Text>
            </View>
          </View>
        ))}

        <Button title="Message Recruiter" variant="outline" onPress={() => navigation.navigate('MainTabs', { screen: 'MessagesTab' })} fullWidth style={styles.messageButton} />
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
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  jobCard: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  jobTitle: { ...typography.h2, color: colors.text },
  jobCompany: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  jobMetaText: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  jobMetaDot: { color: colors.textSecondary },
  matchBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, marginTop: spacing.md,
  },
  matchText: { ...typography.caption, color: colors.primary, fontFamily: typography.label.fontFamily },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xl },
  timelineItem: { flexDirection: 'row', marginBottom: spacing.sm },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  dotCompleted: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primary + '30' },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.xl },
  timelineTitle: { ...typography.label, color: colors.textSecondary },
  timelineTitleCurrent: { color: colors.text },
  timelineDate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  messageButton: { marginTop: spacing.xl },
});
