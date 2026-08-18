import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import type { PeerSummary, WorkContext } from '../../services/messagingApi';
import { formatMoneyDisplay } from '../../data/location/geo';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ');
}

function formatWorkPrice(work: WorkContext): string | null {
  if (!work.price) return null;
  const amount = Number(String(work.price).replace(/,/g, ''));
  if (!Number.isFinite(amount)) {
    return work.currency
      ? `${work.price} ${work.currency}`
      : String(work.price);
  }
  return formatMoneyDisplay({
    amount,
    currency: work.currency || 'SAR',
  });
}

export default function JobOverviewSheet({
  visible,
  workContext,
  peer,
  onClose,
  onViewJobDetails,
  onOpenParticipant,
}: {
  visible: boolean;
  workContext: WorkContext | null | undefined;
  peer: PeerSummary | null | undefined;
  onClose: () => void;
  onViewJobDetails: () => void;
  onOpenParticipant: () => void;
}) {
  const work = workContext;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {!work ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No job details available</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title} numberOfLines={2}>
                {work.title}
              </Text>

              <View style={styles.metaBlock}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Source</Text>
                  <Text style={styles.metaValue}>
                    {formatSource(work.source)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={styles.metaValue}>
                    {formatStatus(work.status)}
                  </Text>
                </View>
                {work.price ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Price</Text>
                    <Text style={styles.metaValue}>
                      {formatWorkPrice(work)}
                    </Text>
                  </View>
                ) : null}
                {work.deadline ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Deadline</Text>
                    <Text style={styles.metaValue}>{work.deadline}</Text>
                  </View>
                ) : null}
              </View>

              {peer ? (
                <TouchableOpacity
                  style={styles.participant}
                  onPress={onOpenParticipant}
                  activeOpacity={0.85}
                >
                  <Image
                    source={toImageSource(peer.avatarUrl ?? '')}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={styles.participantText}>
                    <Text style={styles.participantLabel}>Participant</Text>
                    <Text style={styles.participantName} numberOfLines={1}>
                      {peer.displayName}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => {
                  onViewJobDetails();
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.detailsBtnText}>View Job Details</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    minHeight: 160,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metaBlock: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.text,
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  participant: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  participantText: { flex: 1, minWidth: 0 },
  participantLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  participantName: {
    ...typography.label,
    color: colors.text,
  },
  detailsBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
  },
  detailsBtnText: {
    ...typography.label,
    color: colors.white,
  },
});
