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
import { colors, spacing, typography } from '../../theme';
import { ApiError } from '../../lib/apiClient';
import { useUserJobs } from '../../context/UserJobsContext';
import { useVisitorUser } from '../../hooks/useVisitorUser';
import { ScreenProps } from '../../navigation/types';

/**
 * Cold "hire me" request — no listing, no service offering. Prices stay
 * free-text labels until payments ship.
 */
export default function DirectRequestScreen({
  route,
  navigation,
}: ScreenProps<'DirectRequest'>) {
  const { createDirectRequest } = useUserJobs();
  const recipient = useVisitorUser(route.params.userId);

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    void (async () => {
      setSubmitting(true);
      try {
        const requestId = await createDirectRequest({
          recipientUserId: route.params.userId,
          title: title.trim(),
          scope: scope.trim() || undefined,
          price: price.trim() || undefined,
          deadlineLabel: deadline.trim() || undefined,
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
            placeholder="e.g. SAR 8,000 project"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            label="Deadline"
            placeholder="e.g. 3 weeks, or 05/14/2026"
            value={deadline}
            onChangeText={setDeadline}
          />
          <TextInput
            label="Message"
            placeholder="Anything else they should know?"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={submitting ? 'Sending…' : 'Send Request'}
            fullWidth
            disabled={submitting || !title.trim()}
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
  footer: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
});
