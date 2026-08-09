import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import CurrencyIcon from '../../components/ui/CurrencyIcon';
import { colors, spacing, radius, typography } from '../../theme';
import { useUserJobs } from '../../context/UserJobsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import {
  formatMoney,
  jobTotalPrice,
  resolveJobDetails,
} from '../../data/types/userJobs';
import { ScreenProps } from '../../navigation/types';

type DateMode = 'deadline' | 'duration';
type DurationField = 'from' | 'to';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function statusToneFor(status: string) {
  switch (status) {
    case 'pending':
      return { bg: '#FCE7F3', text: '#BE185D' };
    case 'pending-payment':
      return { bg: '#E0ECFF', text: '#2E6AC5' };
    case 'sent-for-review':
      return { bg: '#FEF9C3', text: '#8A6A16' };
    case 'declined':
      return { bg: '#EF4444', text: '#FFFFFF' };
    default:
      return { bg: '#EEF2F6', text: colors.textSecondary };
  }
}

function formatPriceInput(text: string) {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date) {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDateLabel(mode: DateMode, deadline: Date | null, from: Date | null, to: Date | null) {
  if (mode === 'deadline') {
    return deadline ? formatDate(deadline) : '';
  }
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  return '';
}

function parseSlashDate(value: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function JobInProgressScreen({ route, navigation }: ScreenProps<'JobInProgress'>) {
  const { getJobById, acceptJob, declineJob, requestEdits } = useUserJobs();
  const { user: me } = useMyProfile();
  const userJob = getJobById(route.params.jobId);
  const details = userJob ? resolveJobDetails(userJob) : null;
  const totalPrice = details ? jobTotalPrice(details) : 0;
  const canAct =
    userJob?.type === 'received' && userJob.status === 'pending';
  /** Client pays after provider accepts (or seed pending-payment jobs). */
  const canPay = userJob?.status === 'pending-payment';

  const [declineOpen, setDeclineOpen] = useState(false);
  const [editsOpen, setEditsOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [dateMode, setDateMode] = useState<DateMode>('deadline');
  const [activeDurationField, setActiveDurationField] = useState<DurationField>('from');
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(2025, 5, 1));
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(() => new Date(2025, 4, 14));
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const statusTone = useMemo(
    () => statusToneFor(userJob?.status ?? ''),
    [userJob?.status]
  );

  const calendar = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthLabel = visibleMonth.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
    return {
      monthLabel,
      firstDay,
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    };
  }, [visibleMonth]);

  const openEdits = () => {
    const initialDeadline =
      parseSlashDate(details?.deadline ?? '') ?? new Date(2025, 4, 14);
    setDateMode('deadline');
    setActiveDurationField('from');
    setVisibleMonth(new Date(initialDeadline.getFullYear(), initialDeadline.getMonth(), 1));
    setDeadlineDate(initialDeadline);
    setFromDate(null);
    setToDate(null);
    setEditPrice(formatMoney(totalPrice));
    setEditNotes(details?.notes ?? '');
    setEditsOpen(true);
  };

  const shiftMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const onPickDay = (day: number) => {
    const picked = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    if (dateMode === 'deadline') {
      setDeadlineDate(picked);
      return;
    }

    if (activeDurationField === 'from') {
      setFromDate(picked);
      if (toDate && picked > toDate) setToDate(null);
      setActiveDurationField('to');
      return;
    }

    if (fromDate && picked < fromDate) {
      setFromDate(picked);
      setToDate(null);
      setActiveDurationField('to');
      return;
    }

    setToDate(picked);
  };

  const isDaySelected = (day: number) => {
    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    if (dateMode === 'deadline') return sameDay(candidate, deadlineDate);
    return sameDay(candidate, fromDate) || sameDay(candidate, toDate);
  };

  const isDayInRange = (day: number) => {
    if (dateMode !== 'duration' || !fromDate || !toDate) return false;
    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    const t = candidate.getTime();
    return t > fromDate.getTime() && t < toDate.getTime();
  };

  const canSendEdits =
    editPrice.trim().length > 0 &&
    (dateMode === 'deadline' ? !!deadlineDate : !!fromDate && !!toDate);

  if (!userJob) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Request not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {userJob.title}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}>
          <Text style={[styles.statusPillText, { color: statusTone.text }]}>{userJob.statusLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.personRow}>
          <TouchableOpacity
            style={styles.userInline}
            onPress={() => openUserProfile(navigation, userJob.counterpart.id, me.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={30} color={colors.textSecondary} />
            <Text style={styles.personName}>{userJob.counterpart.name}</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.metaLabel}>Requested on</Text>
            <Text style={styles.metaValueStrong}>{details!.requestedAt}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Service Name</Text>
            <Text style={styles.metaValueStrong}>{details!.serviceName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Package Selected</Text>
            <Text style={styles.metaValueStrong}>{details!.packageName}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.metaLabel}>Adds-on</Text>
          {details!.addons.length === 0 ? (
            <Text style={styles.metaValueStrong}>None</Text>
          ) : (
            details!.addons.map((addon) => (
              <Text key={addon.name} style={styles.metaValueStrong}>
                {addon.name}
              </Text>
            ))
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.metaLabel}>Deadline Date</Text>
          <Text style={styles.metaValueStrong}>{details!.deadline}</Text>
        </View>

        {details!.locationUrl ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.metaLabel}>Location</Text>
            <TouchableOpacity
              style={styles.userInline}
              onPress={() => Linking.openURL(details!.locationUrl!)}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText} numberOfLines={1}>
                {details!.locationUrl}
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionBlock}>
          <Text style={styles.metaLabel}>Notes</Text>
          <Text style={styles.notes}>{details!.notes}</Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.metaLabel}>Attachments</Text>
          <View style={styles.attachment}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <View>
              <Text style={styles.metaValueStrong}>{details!.attachmentName}</Text>
              <Text style={styles.metaLabel}>{details!.attachmentSize}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlockLast}>
          <Text style={styles.metaLabel}>Price Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.metaValueStrong}>Package price</Text>
              <View style={styles.moneyRow}>
                <CurrencyIcon size={14} color={colors.text} />
                <Text style={styles.metaValueStrong}>
                  {formatMoney(details!.packagePrice)}
                </Text>
              </View>
            </View>
            {details!.addons.length > 0 ? (
              <>
                <Text style={[styles.metaValueStrong, { marginTop: 4 }]}>Adds-on :</Text>
                {details!.addons.map((addon) => (
                  <View key={addon.name} style={styles.priceRow}>
                    <Text style={styles.metaValueStrong}>{addon.name}</Text>
                    <View style={styles.moneyRow}>
                      <CurrencyIcon size={14} color={colors.text} />
                      <Text style={styles.metaValueStrong}>
                        {formatMoney(addon.price)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
            <View
              style={[
                styles.priceRow,
                { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
              ]}
            >
              <Text style={styles.totalLabel}>Total (Package + Add-ons)</Text>
              <View style={styles.moneyRow}>
                <CurrencyIcon size={14} color={colors.primary} />
                <Text style={styles.totalValue}>{formatMoney(totalPrice)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {canAct ? (
        <View style={styles.footer}>
          <Button
            title="Accept"
            onPress={() => {
              acceptJob(userJob.id);
              navigation.goBack();
            }}
            fullWidth
          />
          <View style={styles.secondaryActions}>
            <Button
              title="Request Edits"
              variant="secondary"
              onPress={openEdits}
              style={styles.halfBtn}
            />
            <Button
              title="Decline"
              variant="secondary"
              onPress={() => setDeclineOpen(true)}
              style={styles.halfBtn}
            />
          </View>
        </View>
      ) : null}

      {canPay && userJob ? (
        <View style={styles.footer}>
          <Button
            title={`Pay ${totalPrice > 0 ? formatMoney(totalPrice) : 'now'}`}
            onPress={() =>
              navigation.navigate('ConfirmPayment', {
                jobId: userJob.id,
                amount: totalPrice > 0 ? totalPrice : undefined,
              })
            }
            fullWidth
          />
        </View>
      ) : null}

      <Modal visible={declineOpen} transparent animationType="fade" onRequestClose={() => setDeclineOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDeclineOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Decline request</Text>
            <TextInput
              placeholder="Optional reason..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              value={declineReason}
              onChangeText={setDeclineReason}
            />
            <Button
              title="Confirm Decline"
              onPress={() => {
                declineJob(userJob.id, declineReason);
                setDeclineOpen(false);
                navigation.goBack();
              }}
              fullWidth
              style={styles.declineConfirmBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editsOpen} transparent animationType="slide" onRequestClose={() => setEditsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditsOpen(false)}>
          <Pressable style={styles.editsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.editsTitle}>Set a Deadline</Text>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'deadline' && styles.modeBtnActive]}
                onPress={() => setDateMode('deadline')}
                activeOpacity={0.85}
              >
                <Text style={[styles.modeBtnText, dateMode === 'deadline' && styles.modeBtnTextActive]}>
                  Deadline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'duration' && styles.modeBtnActive]}
                onPress={() => {
                  setDateMode('duration');
                  setActiveDurationField(fromDate ? 'to' : 'from');
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.modeBtnText, dateMode === 'duration' && styles.modeBtnTextActive]}>
                  Duration
                </Text>
              </TouchableOpacity>
            </View>

            {dateMode === 'deadline' ? (
              <View style={[styles.dateField, styles.dateFieldActive]}>
                <Text style={styles.dateFieldValue}>
                  {deadlineDate ? formatDate(deadlineDate) : 'Select date'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
            ) : (
              <View style={styles.durationRow}>
                <TouchableOpacity
                  style={[
                    styles.dateField,
                    styles.durationField,
                    activeDurationField === 'from' && styles.dateFieldActive,
                  ]}
                  onPress={() => setActiveDurationField('from')}
                  activeOpacity={0.85}
                >
                  <View style={styles.durationFieldInner}>
                    <Text style={styles.durationLabel}>From</Text>
                    <Text style={styles.dateFieldValue}>
                      {fromDate ? formatDate(fromDate) : 'Select'}
                    </Text>
                  </View>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateField,
                    styles.durationField,
                    activeDurationField === 'to' && styles.dateFieldActive,
                  ]}
                  onPress={() => setActiveDurationField('to')}
                  activeOpacity={0.85}
                >
                  <View style={styles.durationFieldInner}>
                    <Text style={styles.durationLabel}>To</Text>
                    <Text style={styles.dateFieldValue}>
                      {toDate ? formatDate(toDate) : 'Select'}
                    </Text>
                  </View>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarMonth}>{calendar.monthLabel}</Text>
                <View style={styles.calendarNav}>
                  <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(-1)}>
                    <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity hitSlop={8} onPress={() => shiftMonth(1)}>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.weekRow}>
                {WEEKDAYS.map((d) => (
                  <Text key={d} style={styles.weekDay}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: calendar.firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}
                {calendar.days.map((day) => {
                  const selected = isDaySelected(day);
                  const inRange = isDayInRange(day);
                  const isRangeStart =
                    dateMode === 'duration' &&
                    fromDate &&
                    sameDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day), fromDate);
                  const isRangeEnd =
                    dateMode === 'duration' &&
                    toDate &&
                    sameDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day), toDate);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        inRange && styles.dayCellInRange,
                        isRangeStart && toDate && styles.dayCellRangeStart,
                        isRangeEnd && fromDate && styles.dayCellRangeEnd,
                      ]}
                      onPress={() => onPickDay(day)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.dayInner, selected && styles.daySelected]}>
                        <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.priceLabel}>Updated total price</Text>
            <View style={styles.priceInputRow}>
              <CurrencyIcon size={16} color={colors.text} />
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                style={styles.priceInput}
                keyboardType="number-pad"
                value={editPrice}
                onChangeText={(text) => setEditPrice(formatPriceInput(text))}
              />
            </View>

            <Text style={styles.priceLabel}>Notes (optional)</Text>
            <TextInput
              placeholder="Add a note about your changes..."
              placeholderTextColor={colors.textSecondary}
              style={styles.notesInput}
              multiline
              value={editNotes}
              onChangeText={setEditNotes}
            />

            <Button
              title="Send Changes"
              disabled={!canSendEdits}
              onPress={() => {
                const dateLabel = buildDateLabel(dateMode, deadlineDate, fromDate, toDate);
                requestEdits(userJob.id, {
                  date: dateLabel,
                  packagePrice: editPrice,
                  notes: editNotes.trim() || undefined,
                });
                setEditsOpen(false);
                navigation.goBack();
              }}
              fullWidth
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h2, color: colors.text, flex: 1, marginRight: spacing.sm },
  statusPill: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.button },
  statusPillText: { ...typography.caption, fontWeight: '500' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  userInline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  personName: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  col: { flex: 1 },
  sectionBlock: { marginBottom: spacing.md },
  sectionBlockLast: { marginBottom: 0 },
  metaLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  metaValueStrong: { ...typography.bodyMedium, color: colors.text },
  linkText: { ...typography.bodySmall, color: '#2E4D9A', textDecorationLine: 'underline' },
  notes: { ...typography.bodySmall, color: colors.text, lineHeight: 24 },
  attachment: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { ...typography.label, color: colors.text },
  totalValue: { ...typography.h3, color: colors.primary },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  secondaryActions: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  declineConfirmBtn: {
    backgroundColor: colors.error,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    textAlignVertical: 'top',
    ...typography.bodySmall,
    color: colors.text,
  },
  editsSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 2,
  },
  editsTitle: { ...typography.h3, color: colors.text },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.button,
    padding: 2,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.button - 2,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: colors.white,
  },
  dateField: {
    minHeight: 42,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  dateFieldActive: {
    borderColor: colors.primary,
  },
  dateFieldValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationField: {
    flex: 1,
  },
  durationFieldInner: {
    flex: 1,
    gap: 1,
  },
  durationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  calendarCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  calendarMonth: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellInRange: {
    backgroundColor: colors.primary + '18',
  },
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
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: -spacing.xs,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    gap: spacing.xs,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  notesInput: {
    minHeight: 72,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
    ...typography.bodySmall,
    color: colors.text,
  },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  missingText: { ...typography.body, color: colors.text, textAlign: 'center' },
  missingBack: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  missingBackText: { ...typography.button, color: colors.white },
});
