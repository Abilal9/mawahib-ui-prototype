import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppToast from '../../components/ui/AppToast';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import ProfileOverviewSheet from '../../components/messaging/ProfileOverviewSheet';
import JobOverviewSheet from '../../components/messaging/JobOverviewSheet';
import ChatImageLightbox from '../../components/messaging/ChatImageLightbox';
import { toImageSource } from '../../utils/image';
import UserAvatar from '../../components/ui/UserAvatar';
import { coerceByteSize, formatBytes } from '../../utils/formatBytes';
import { colors, spacing, radius, typography } from '../../theme';
import { CHAT_POLL_MS, MESSAGE_BODY_MAX_LENGTH } from '../../config/messaging';
import { usePolling } from '../../hooks/usePolling';
import { createClientId } from '../../lib/clientId';
import { ApiError } from '../../lib/apiClient';
import {
  pickLocalDocument,
  pickLocalImage,
  uploadLocalFile,
  type LocalPickedFile,
} from '../../lib/uploadMedia';
import { messageService } from '../../services/messageService';
import type {
  ApiConversation,
  ApiMessage,
  MessageAttachment,
  MessageReceiptStatus,
} from '../../services/messagingApi';
import { useMyProfile } from '../../context/ProfileContext';
import { useMessagingUnread } from '../../context/MessagingUnreadContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';

type PendingAttachment = LocalPickedFile & { id: string };

type ChatRow =
  | { kind: 'divider'; id: string }
  | { kind: 'message'; id: string; message: ApiMessage };

/** Lightweight chat projection of delivered → disputed; details live on the job. */
function isDeliveryDeclinedSystemMessage(message: ApiMessage): boolean {
  const payload = message.systemPayload;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (
      record.event === 'engagement_status' &&
      record.toStatus === 'disputed'
    ) {
      return true;
    }
  }
  return message.body === 'Delivery was declined.';
}

function mergeMessages(existing: ApiMessage[], incoming: ApiMessage[]): ApiMessage[] {
  const byId = new Map<string, ApiMessage>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) {
    const prev = byId.get(m.id);
    byId.set(m.id, prev ? { ...prev, ...m } : m);
  }
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function isImageMime(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith('image/'));
}

function isPdfMime(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/pdf' || Boolean(mimeType?.includes('pdf'));
}

function ReceiptTicks({ status }: { status: MessageReceiptStatus }) {
  const color =
    status === 'read' ? colors.white : 'rgba(255, 255, 255, 0.75)';
  const name = status === 'sent' ? 'checkmark' : 'checkmark-done';
  return (
    <View style={styles.receiptRow}>
      <Ionicons name={name} size={14} color={color} />
    </View>
  );
}

function AttachmentBlocks({
  attachments,
  isMe,
  onOpenImage,
}: {
  attachments: MessageAttachment[];
  isMe: boolean;
  onOpenImage: (url: string) => void;
}) {
  if (!attachments?.length) return null;
  return (
    <View style={styles.attachmentStack}>
      {attachments.map((a) => {
        const url = a.url ?? undefined;
        const size = coerceByteSize(a.byteSize);
        if (isImageMime(a.mimeType) && url) {
          return (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.85}
              onPress={() => onOpenImage(url)}
            >
              <Image
                source={{ uri: url }}
                style={styles.messageImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          );
        }
        if (isPdfMime(a.mimeType) || a.fileName) {
          return (
            <TouchableOpacity
              key={a.id}
              style={[
                styles.docCard,
                isMe ? styles.docCardMe : styles.docCardOther,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (!url) return;
                void Linking.openURL(url).catch(() => {
                  Alert.alert('Could not open file', 'Please try again later.');
                });
              }}
              disabled={!url}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={isMe ? colors.white : colors.primary}
              />
              <View style={styles.docMeta}>
                <Text
                  style={[styles.docName, isMe && styles.docNameMe]}
                  numberOfLines={2}
                >
                  {a.fileName || 'Document'}
                </Text>
                {size != null ? (
                  <Text style={[styles.docSize, isMe && styles.docSizeMe]}>
                    {formatBytes(size)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }
        return null;
      })}
    </View>
  );
}

export default function ChatScreen({ route, navigation }: ScreenProps<'Chat'>) {
  const conversationId = route.params.conversationId;
  const { user: me } = useMyProfile();
  const { refresh: refreshUnread } = useMessagingUnread();
  const [conversation, setConversation] = useState<ApiConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [jobSheetOpen, setJobSheetOpen] = useState(false);
  const [profileSheetUserId, setProfileSheetUserId] = useState<string | null>(
    null,
  );
  const [focused, setFocused] = useState(false);
  const [missing, setMissing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [unreadDividerBeforeId, setUnreadDividerBeforeId] = useState<
    string | null
  >(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const listRef = useRef<FlatList<ChatRow>>(null);
  const nearBottomRef = useRef(true);
  const pendingScrollTargetRef = useRef<'end' | 'divider' | null>(null);
  const loadingOlderRef = useRef(false);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const refreshLatest = useCallback(
    async (opts: { initial?: boolean } = {}) => {
      try {
        const [conv, page] = await Promise.all([
          messageService.getConversation(conversationId),
          messageService.getMessages(conversationId, { limit: 50 }),
        ]);
        setConversation(conv);
        const chronological = [...page.items].reverse();
        setMessages((prev) => {
          const prevNewest = prev[prev.length - 1]?.id;
          const merged = mergeMessages(prev, chronological);
          const nextNewest = merged[merged.length - 1]?.id;
          if (
            !opts.initial &&
            prevNewest &&
            nextNewest &&
            prevNewest !== nextNewest
          ) {
            if (nearBottomRef.current) {
              queueMicrotask(() => scrollToLatest(true));
            } else {
              queueMicrotask(() => setHasNewBelow(true));
            }
          }
          return merged;
        });
        if (opts.initial) {
          setOlderCursor(page.nextCursor);
          nearBottomRef.current = true;
          setHasNewBelow(false);

          const lastReadAt = conv.lastReadAt;
          const firstUnread = chronological.find(
            (m) =>
              m.kind === 'user' &&
              m.senderId &&
              m.senderId !== me.id &&
              (!lastReadAt || new Date(m.createdAt) > new Date(lastReadAt)),
          );
          setUnreadDividerBeforeId(firstUnread?.id ?? null);
          pendingScrollTargetRef.current = firstUnread ? 'divider' : 'end';
        }
        setMissing(false);
        await messageService.markRead(conversationId).catch(() => undefined);
        void refreshUnread();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setMissing(true);
        } else {
          console.warn('[chat] load failed', e);
        }
      } finally {
        setLoading(false);
      }
    },
    [conversationId, me.id, refreshUnread, scrollToLatest],
  );

  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const page = await messageService.getMessages(conversationId, {
        cursor: olderCursor,
        limit: 50,
      });
      const chronological = [...page.items].reverse();
      setMessages((prev) => mergeMessages(chronological, prev));
      setOlderCursor(page.nextCursor);
    } catch (e) {
      console.warn('[chat] load older failed', e);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, olderCursor]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setLoading(true);
      setMessages([]);
      setOlderCursor(null);
      pendingScrollTargetRef.current = 'end';
      nearBottomRef.current = true;
      setHasNewBelow(false);
      void refreshLatest({ initial: true });
      return () => {
        setFocused(false);
        setUnreadDividerBeforeId(null);
      };
    }, [refreshLatest]),
  );

  usePolling(
    () => void refreshLatest({ initial: false }),
    CHAT_POLL_MS,
    focused && !missing,
  );

  const onListScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const nearBottom = distanceFromBottom < 96;
    nearBottomRef.current = nearBottom;
    if (nearBottom && hasNewBelow) setHasNewBelow(false);
    if (contentOffset.y < 48) {
      void loadOlder();
    }
  };

  const peer = conversation?.peer;
  const work = conversation?.workContext;
  const writable = conversation?.writable ?? false;
  const viewerArchived =
    conversation?.viewerArchived === true ||
    Boolean(conversation?.viewerArchivedAt);

  const chatRows = useMemo<ChatRow[]>(() => {
    const rows: ChatRow[] = [];
    for (const message of messages) {
      if (unreadDividerBeforeId === message.id) {
        rows.push({ kind: 'divider', id: `divider-${message.id}` });
      }
      rows.push({ kind: 'message', id: message.id, message });
    }
    return rows;
  }, [messages, unreadDividerBeforeId]);

  const galleryUrls = useMemo(() => {
    const urls: string[] = [];
    for (const message of messages) {
      for (const a of message.attachments ?? []) {
        if (isImageMime(a.mimeType) && a.url) {
          urls.push(a.url);
        }
      }
    }
    return urls;
  }, [messages]);

  const openImage = useCallback(
    (url: string) => {
      const index = galleryUrls.indexOf(url);
      setLightboxIndex(index >= 0 ? index : 0);
      setLightboxOpen(true);
    },
    [galleryUrls],
  );

  const headerSubtitle = useMemo(() => {
    if (work) {
      return `${work.title} · ${work.status.replace(/_/g, ' ')}`;
    }
    return peer?.title || '';
  }, [work, peer]);

  const showRateCta =
    Boolean(work) &&
    work?.status === 'completed' &&
    !writable &&
    work?.viewerReviewRating == null;

  const canSend =
    (text.trim().length > 0 || pendingAttachments.length > 0) && !sending;

  const openRateReview = (initialRating?: number) => {
    if (!work) return;
    const workRequestId = work.workRequestId ?? undefined;
    const jobId = workRequestId ?? work.engagementId;
    navigation.navigate('WriteReview', {
      jobId,
      workRequestId,
      engagementId: work.engagementId,
      conversationId,
      initialRating,
    });
  };

  const archiveOrUnarchive = async () => {
    setManaging(true);
    try {
      if (viewerArchived) {
        await messageService.unarchive(conversationId);
        const refreshed = await messageService.getConversation(conversationId);
        setConversation(refreshed);
        void refreshUnread();
      } else {
        await messageService.archive(conversationId);
        void refreshUnread();
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert(
        viewerArchived ? 'Could not unarchive' : 'Could not archive',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setManaging(false);
    }
  };

  const confirmSoftDelete = async () => {
    setManaging(true);
    try {
      await messageService.softDelete(conversationId);
      setDeleteConfirmVisible(false);
      void refreshUnread();
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        'Could not delete',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setManaging(false);
    }
  };

  const openChatMenu = () => {
    if (managing) return;
    Alert.alert('Conversation', undefined, [
      {
        text: viewerArchived ? 'Unarchive conversation' : 'Archive conversation',
        onPress: () => void archiveOrUnarchive(),
      },
      {
        text: 'Delete conversation',
        style: 'destructive',
        onPress: () => setDeleteConfirmVisible(true),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const send = async () => {
    const trimmed = text.trim();
    const pending = pendingAttachments;
    if (!trimmed && pending.length === 0) return;
    if (!writable || sending) return;

    if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
      // Keep text + pending attachments; do not upload yet.
      setToast('Message is too long. Please make it shorter.');
      return;
    }

    setSending(true);
    const clientMessageId = createClientId();
    try {
      const mediaAssetIds: string[] = [];
      for (const file of pending) {
        const uploaded = await uploadLocalFile({
          uri: file.uri,
          mimeType: file.mimeType,
          byteSize: file.byteSize,
          fileName: file.fileName,
          purpose: 'message',
        });
        mediaAssetIds.push(uploaded.mediaAssetId);
      }

      const created = await messageService.sendMessage(conversationId, {
        body: trimmed || undefined,
        mediaAssetIds: mediaAssetIds.length > 0 ? mediaAssetIds : undefined,
        clientMessageId,
      });
      setMessages((prev) => mergeMessages(prev, [created]));
      setText('');
      setPendingAttachments([]);
      nearBottomRef.current = true;
      setHasNewBelow(false);
      scrollToLatest(true);
      const refreshed = await messageService.getConversation(conversationId);
      setConversation(refreshed);
      void refreshUnread();
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? e.message
          : 'Please try again.';
      if (/too long/i.test(message)) {
        setToast('Message is too long. Please make it shorter.');
      } else {
        Alert.alert('Could not send', message);
      }
      // Keep pending attachments on upload/send failure.
    } finally {
      setSending(false);
    }
  };

  const addPendingLocal = (local: LocalPickedFile | null) => {
    if (!local) return;
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: createClientId(),
        uri: local.uri,
        mimeType: local.mimeType,
        byteSize: local.byteSize,
        fileName: local.fileName,
      },
    ]);
  };

  const pickPhoto = async () => {
    setAttachMenuOpen(false);
    setAttaching(true);
    try {
      const local = await pickLocalImage();
      addPendingLocal(local);
    } catch (e) {
      Alert.alert(
        'Could not attach',
        e instanceof Error ? e.message : 'Could not attach image.',
      );
    } finally {
      setAttaching(false);
    }
  };

  const pickDocument = async () => {
    setAttachMenuOpen(false);
    setAttaching(true);
    try {
      const local = await pickLocalDocument();
      addPendingLocal(local);
    } catch (e) {
      Alert.alert(
        'Could not attach',
        e instanceof Error ? e.message : 'Could not attach file.',
      );
    } finally {
      setAttaching(false);
    }
  };

  const onAttach = () => {
    if (!writable || attaching || sending) return;
    setAttachMenuOpen(true);
  };

  const openHeaderOverview = () => {
    if (work) {
      setJobSheetOpen(true);
      return;
    }
    if (peer?.id) {
      setProfileSheetUserId(peer.id);
      setProfileSheetOpen(true);
    }
  };

  const openProfileOverview = (userId: string) => {
    setJobSheetOpen(false);
    setProfileSheetUserId(userId);
    setProfileSheetOpen(true);
  };

  const viewJobDetails = () => {
    if (!work) return;
    if (work.workRequestId) {
      navigation.navigate('WorkRequestDetail', {
        requestId: work.workRequestId,
      });
      return;
    }
    Alert.alert(
      'Job details',
      'A linked work request is not available for this engagement yet.',
    );
  };

  if (missing) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Conversation not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.missingBack}
          >
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerPerson}
          onPress={openHeaderOverview}
          activeOpacity={0.8}
          disabled={!peer?.id && !work}
        >
          <UserAvatar
            uri={peer?.avatarUrl}
            size={40}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {peer?.displayName ?? (loading ? 'Loading…' : 'Conversation')}
            </Text>
            {headerSubtitle ? (
              <Text style={styles.headerStatus} numberOfLines={1}>
                {headerSubtitle}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        {work ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setJobSheetOpen(true)}
            accessibilityLabel="Job overview"
          >
            <Ionicons name="briefcase-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.backButton}
          onPress={openChatMenu}
          disabled={managing}
          accessibilityLabel="Conversation options"
        >
          {managing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="archive-outline" size={22} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {showRateCta ? (
        <TouchableOpacity
          style={styles.rateCard}
          onPress={() => openRateReview()}
          activeOpacity={0.85}
        >
          <View style={styles.rateCopy}>
            <View style={styles.rateStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => openRateReview(star)}
                  hitSlop={6}
                  accessibilityLabel={`Rate ${star} stars`}
                >
                  <Ionicons
                    name="star-outline"
                    size={28}
                    color={colors.warning}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.rateTitle}>Rate this job</Text>
            <Text style={styles.rateSubtitle}>
              Share feedback on {work?.title ?? 'this completed work'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      ) : null}

      {work?.status === 'completed' && work.viewerReviewRating != null ? (
        <View style={styles.rateCard}>
          <View style={styles.rateCopy}>
            <View style={styles.rateStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (work.viewerReviewRating ?? 0) ? 'star' : 'star-outline'}
                  size={22}
                  color={colors.warning}
                />
              ))}
            </View>
            <Text style={styles.rateTitle}>Your rating</Text>
            <Text style={styles.rateSubtitle}>
              Thanks — this job chat is archived for you.
            </Text>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.flex}>
            <FlatList
              ref={listRef}
              data={chatRows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onScroll={onListScroll}
              scrollEventThrottle={16}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
              onScrollToIndexFailed={(info) => {
                listRef.current?.scrollToOffset({
                  offset: Math.max(0, info.averageItemLength * info.index),
                  animated: false,
                });
              }}
              onContentSizeChange={() => {
                const target = pendingScrollTargetRef.current;
                if (!target || chatRows.length === 0) return;
                if (target === 'divider') {
                  const index = chatRows.findIndex(
                    (row) => row.kind === 'divider',
                  );
                  if (index >= 0) {
                    listRef.current?.scrollToIndex({
                      index,
                      animated: false,
                      viewPosition: 0.2,
                    });
                  } else {
                    listRef.current?.scrollToEnd({ animated: false });
                  }
                } else {
                  listRef.current?.scrollToEnd({ animated: false });
                }
                pendingScrollTargetRef.current = null;
                nearBottomRef.current = true;
              }}
              ListHeaderComponent={
                loadingOlder ? (
                  <View style={styles.olderLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                if (item.kind === 'divider') {
                  return (
                    <View style={styles.newMessagesDivider}>
                      <View style={styles.newMessagesLine} />
                      <Text style={styles.newMessagesLabel}>New Messages</Text>
                      <View style={styles.newMessagesLine} />
                    </View>
                  );
                }
                const message = item.message;
                if (message.kind === 'system') {
                  const declined = isDeliveryDeclinedSystemMessage(message);
                  const canOpenJob = declined && !!work?.workRequestId;
                  const systemBody = (
                    <>
                      <Text style={styles.systemText}>
                        {message.body || 'System update'}
                      </Text>
                      {canOpenJob ? (
                        <Text style={styles.systemLink}>View details</Text>
                      ) : null}
                    </>
                  );
                  if (canOpenJob) {
                    return (
                      <TouchableOpacity
                        style={styles.systemRow}
                        onPress={viewJobDetails}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Delivery was declined. View job details"
                      >
                        {systemBody}
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View style={styles.systemRow}>{systemBody}</View>
                  );
                }
                const isMe = message.senderId === me.id;
                return (
                  <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                      ]}
                    >
                      <AttachmentBlocks
                        attachments={message.attachments ?? []}
                        isMe={isMe}
                        onOpenImage={openImage}
                      />
                      {message.body ? (
                        <Text
                          style={[
                            styles.bubbleText,
                            isMe && styles.bubbleTextMe,
                            message.attachments?.length
                              ? styles.captionAfterAttach
                              : null,
                          ]}
                        >
                          {message.body}
                        </Text>
                      ) : null}
                      {isMe && message.receiptStatus ? (
                        <ReceiptTicks status={message.receiptStatus} />
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
            {hasNewBelow ? (
              <TouchableOpacity
                style={styles.newMessagesChip}
                onPress={() => {
                  setHasNewBelow(false);
                  nearBottomRef.current = true;
                  scrollToLatest(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.newMessagesChipText}>New messages</Text>
                <Ionicons name="chevron-down" size={16} color={colors.white} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {!writable ? (
          <View style={styles.readOnlyBar}>
            <Text style={styles.readOnlyText}>
              This conversation is read-only.
            </Text>
          </View>
        ) : (
          <View style={styles.composer}>
            {pendingAttachments.length > 0 ? (
              <View style={styles.pendingRow}>
                {pendingAttachments.map((a) => (
                  <View key={a.id} style={styles.pendingItem}>
                    {isImageMime(a.mimeType) ? (
                      <Image
                        source={{ uri: a.uri }}
                        style={styles.pendingThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.pendingPdfChip}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color={colors.textTertiary}
                        />
                        <View style={styles.pendingPdfMeta}>
                          <Text style={styles.pendingChipText} numberOfLines={1}>
                            {a.fileName}
                          </Text>
                          <Text style={styles.pendingSizeText}>
                            {formatBytes(a.byteSize)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.pendingRemove}
                      onPress={() =>
                        setPendingAttachments((prev) =>
                          prev.filter((p) => p.id !== a.id),
                        )
                      }
                      hitSlop={8}
                      disabled={sending}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.inputBar}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={onAttach}
                disabled={attaching || sending}
              >
                {attaching ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
                editable={!sending}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                ]}
                onPress={() => void send()}
                disabled={!canSend}
              >
                <Ionicons name="send" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <ConfirmActionModal
        visible={deleteConfirmVisible}
        title="Delete conversation"
        message="This removes the conversation from your inbox. The other person keeps their copy."
        confirmLabel="Delete"
        danger
        busy={managing}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => void confirmSoftDelete()}
      />

      <JobOverviewSheet
        visible={jobSheetOpen}
        workContext={work}
        peer={peer}
        onClose={() => setJobSheetOpen(false)}
        onViewJobDetails={viewJobDetails}
        onOpenParticipant={() => {
          if (peer?.id) openProfileOverview(peer.id);
        }}
      />

      <ProfileOverviewSheet
        visible={profileSheetOpen}
        userId={profileSheetUserId}
        conversationId={conversationId}
        onClose={() => {
          setProfileSheetOpen(false);
          setProfileSheetUserId(null);
        }}
        onOpenFullProfile={(id) => openUserProfile(navigation, id, me.id)}
        onOpenMedia={() => {
          setProfileSheetOpen(false);
          setProfileSheetUserId(null);
          navigation.navigate('ConversationMedia', { conversationId });
        }}
      />

      <ChatImageLightbox
        visible={lightboxOpen}
        images={galleryUrls}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <Modal
        visible={attachMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachMenuOpen(false)}
      >
        <Pressable
          style={styles.attachMenuBackdrop}
          onPress={() => setAttachMenuOpen(false)}
        >
          <Pressable
            style={styles.attachMenu}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.attachMenuItem}
              onPress={() => void pickPhoto()}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={20} color={colors.text} />
              <Text style={styles.attachMenuText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachMenuItem}
              onPress={() => void pickDocument()}
              activeOpacity={0.85}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.attachMenuText}>PDF / Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachMenuItem, styles.attachMenuCancel]}
              onPress={() => setAttachMenuOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.attachMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {toast ? (
        <AppToast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPerson: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { ...typography.label, color: colors.text },
  headerStatus: { ...typography.caption, color: colors.textSecondary },
  attachMenuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  attachMenu: {
    marginLeft: spacing.screen,
    marginBottom: Platform.OS === 'ios' ? 88 : 72,
    alignSelf: 'flex-start',
    minWidth: 200,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  attachMenuText: {
    ...typography.body,
    color: colors.text,
  },
  attachMenuCancel: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    justifyContent: 'center',
  },
  attachMenuCancelText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.screen,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#FFF8E8',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#F5E0B0',
  },
  rateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rateCopy: { flex: 1, gap: 2 },
  rateTitle: { ...typography.label, color: colors.text },
  rateSubtitle: { ...typography.caption, color: colors.textSecondary },
  messageList: { padding: spacing.screen, paddingBottom: spacing.lg, flexGrow: 1 },
  olderLoading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  newMessagesDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  newMessagesLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
  },
  newMessagesLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  newMessagesChip: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  newMessagesChipText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  bubbleRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  bubbleRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bubbleText: { ...typography.body, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  captionAfterAttach: { marginTop: spacing.sm },
  receiptRow: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  attachmentStack: { gap: spacing.sm },
  messageImage: {
    width: 200,
    height: 160,
    borderRadius: radius.button,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.button,
    minWidth: 180,
  },
  docCardMe: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  docCardOther: {
    backgroundColor: colors.background,
  },
  docMeta: { flex: 1, minWidth: 0 },
  docName: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  docNameMe: { color: colors.white },
  docSize: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  docSizeMe: { color: 'rgba(255,255,255,0.8)' },
  systemRow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  systemLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  composer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  pendingItem: {
    position: 'relative',
  },
  pendingThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.button,
    backgroundColor: colors.borderLight,
  },
  pendingPdfChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 180,
    backgroundColor: colors.borderLight,
    borderRadius: radius.button,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  pendingPdfMeta: { flex: 1, minWidth: 0 },
  pendingChipText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  pendingSizeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  pendingRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  attachButton: { paddingBottom: spacing.sm, width: 28 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  readOnlyBar: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  readOnlyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
