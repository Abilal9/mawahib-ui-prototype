import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import CalendarPicker from '../../components/ui/CalendarPicker';
import { colors, spacing, radius, typography } from '../../theme';
import { ApiError } from '../../lib/apiClient';
import { useUserJobs } from '../../context/UserJobsContext';
import { useVisitorUser } from '../../hooks/useVisitorUser';
import { ScreenProps } from '../../navigation/types';
import {
  DEFAULT_CURRENCY,
  DURATION_UNITS,
  DurationUnit,
  WorkRequestDeadlineInput,
  toIsoDate,
} from '../../services/workRequestApi';

type DeadlineMode = 'exact_date' | 'duration' | 'flexible';

const DEADLINE_MODES: { id: DeadlineMode; label: string }[] = [
  { id: 'exact_date', label: 'Exact date' },
  { id: 'duration', label: 'Duration' },
  { id: 'flexible', label: 'Flexible' },
];

/** Groups thousands while the user types, keeping at most two decimals. */
function formatAmountInput(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const grouped = whole
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!cleaned.includes('.')) return grouped;
  return `${grouped || '0'}.${rest.join('').slice(0, 2)}`;
}

/** A positive amount, or null when the field is blank or not a real price. */
function parseAmountInput(text: string): number | null {
  const amount = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function formatPickedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Cold "hire me" request — no listing, no service offering. Budget and deadline
 * are structured so the recipient negotiates against real values.
 */
export default function DirectRequestScreen({
  route,
  navigation,
}: ScreenProps<'DirectRequest'>) {
  const { createDirectRequest } = useUserJobs();
  const recipient = useVisitorUser(route.params.userId);

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('');
  const [amountText, setAmountText] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('flexible');
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [exactDate, setExactDate] = useState<Date | null>(null);
  const [durationValue, setDurationValue] = useState('2');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('weeks');

  const amount = parseAmountInput(amountText);
  const amountInvalid = amountText.trim().length > 0 && amount === null;

  const buildDeadline = (): WorkRequestDeadlineInput | null => {
    if (deadlineMode === 'exact_date') {
      return exactDate
        ? { type: 'exact_date', startDate: toIsoDate(exactDate) }
        : null;
    }
    if (deadlineMode === 'duration') {
      const value = Number(durationValue);
      if (!Number.isInteger(value) || value < 1) return null;
      return { type: 'duration', durationValue: value, durationUnit };
    }
    return { type: 'flexible' };
  };

  const deadline = buildDeadline();
  const canSubmit =
    !submitting && !!title.trim() && !amountInvalid && deadline !== null;

  const submit = () => {
    if (!deadline) return;
    void (async () => {
      setSubmitting(true);
      try {
        const requestId = await createDirectRequest({
          recipientUserId: route.params.userId,
          title: title.trim(),
          scope: scope.trim() || undefined,
          money:
            amount !== null
              ? { amount, currency: DEFAULT_CURRENCY }
              : undefined,
          deadline,
          message: message.trim() || undefined,
        });
        navigation.replace('WorkRequestDetail', { requestId });
      } catch (e) {
        Alert.alert(
          'Could not send request',
          e instanceof ApiError || e instanceof Error
            ? e.message
            : 'Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Work</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            {recipient.user
              ? `Send ${recipient.user.name} a work request. They can accept, propose changes, or reject it.`
              : 'Send a work request. They can accept, propose changes, or reject it.'}
          </Text>

          <TextInput
            label="Title"
            placeholder="e.g. Brand identity for a new café"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            label="Scope"
            placeholder="What needs to be delivered?"
            value={scope}
            onChangeText={setScope}
            multiline
            numberOfLines={5}
            style={styles.multiline}
          />
          <TextInput
            label="Budget"
            placeholder="0"
            value={amountText}
            onChangeText={(text) => setAmountText(formatAmountInput(text))}
            keyboardType="decimal-pad"
            leftIcon={<Text style={styles.currencyText}>{DEFAULT_CURRENCY}</Text>}
            error={amountInvalid ? 'Enter an amount greater than zero.' : undefined}
          />

          <Text style={styles.fieldLabel}>Deadline</Text>
          <View style={styles.modeToggle}>
            {DEADLINE_MODES.map((mode) => {
              const active = deadlineMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => setDeadlineMode(mode.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      active && styles.modeBtnTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {deadlineMode === 'exact_date' ? (
            <View style={styles.deadlineBlock}>
              <View style={[styles.dateField, styles.dateFieldActive]}>
                <Text style={styles.dateFieldValue}>
                  {exactDate ? formatPickedDate(exactDate) : 'Select date'}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <CalendarPicker
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                onPickDay={setExactDate}
                selected={exactDate}
              />
            </View>
          ) : null}

          {deadlineMode === 'duration' ? (
            <View style={styles.durationRow}>
              <TextInput
                containerStyle={styles.durationValueField}
                placeholder="2"
                value={durationValue}
                onChangeText={(text) =>
                  setDurationValue(text.replace(/[^\d]/g, '').slice(0, 4))
                }
                keyboardType="number-pad"
                style={styles.durationValueInput}
              />
              <View style={styles.unitToggle}>
                {DURATION_UNITS.map((unit) => {
                  const active = durationUnit === unit;
                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.modeBtn, active && styles.modeBtnActive]}
                      onPress={() => setDurationUnit(unit)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          active && styles.modeBtnTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {deadlineMode === 'flexible' ? (
            <Text style={styles.hintText}>
              No fixed deadline — you agree on timing together.
            </Text>
          ) : null}

          <View style={styles.messageField}>
            <TextInput
              label="Message"
              placeholder="Anything else they should know?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              style={styles.multiline}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={submitting ? 'Sending…' : 'Send Request'}
            fullWidth
            disabled={!canSubmit}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.text },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  intro: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  currencyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
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
    paddingHorizontal: 2,
    borderRadius: radius.button - 2,
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeBtnTextActive: { color: colors.white },
  deadlineBlock: { gap: spacing.sm, marginTop: spacing.sm },
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
  dateFieldActive: { borderColor: colors.primary },
  dateFieldValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  durationValueField: { width: 84, marginBottom: 0 },
  durationValueInput: { textAlign: 'center' },
  unitToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.button,
    padding: 2,
  },
  hintText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  messageField: { marginTop: spacing.lg },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
});
