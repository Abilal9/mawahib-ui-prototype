import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { getConversationById, getMessagesByConversation } from '../../data/mock/messages';
import { currentUser } from '../../data/mock/users';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';

export default function ChatScreen({ route, navigation }: ScreenProps<'Chat'>) {
  const conversation = getConversationById(route.params.conversationId);
  const initialMessages = getMessagesByConversation(route.params.conversationId);
  const { user: me } = useMyProfile();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');

  if (!conversation) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Conversation not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages([
      ...messages,
      {
        id: `m${Date.now()}`,
        conversationId: conversation.id,
        senderId: currentUser.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        read: true,
      },
    ]);
    setText('');
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerPerson}
          onPress={() => openUserProfile(navigation, conversation.participant.id, me.id)}
          activeOpacity={0.8}
        >
          <Image source={toImageSource(conversation.participant.avatar)} style={styles.headerAvatar} contentFit="cover" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation.participant.name}</Text>
            <Text style={styles.headerStatus}>Active now</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser.id;
            return (
              <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
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
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerPerson: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { flex: 1 },
  headerName: { ...typography.label, color: colors.text },
  headerStatus: { ...typography.caption, color: colors.success },
  messageList: { padding: spacing.screen, paddingBottom: spacing.lg },
  bubbleRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  bubbleRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderLight },
  bubbleText: { ...typography.body, color: colors.text, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  attachButton: { paddingBottom: spacing.sm },
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
