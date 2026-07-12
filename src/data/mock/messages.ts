import { Conversation, Message } from '../types';
import { users } from './users';

export const conversations: Conversation[] = [
  {
    id: 'c1',
    participant: users[1],
    lastMessage: 'The designs look amazing! Can we schedule a call tomorrow?',
    lastMessageAt: '2026-07-12T14:30:00Z',
    unreadCount: 2,
  },
  {
    id: 'c2',
    participant: users[2],
    lastMessage: 'I sent over the raw files from the shoot 📁',
    lastMessageAt: '2026-07-12T11:15:00Z',
    unreadCount: 0,
  },
  {
    id: 'c3',
    participant: users[3],
    lastMessage: 'Thanks for the referral! Really appreciate it 🙏',
    lastMessageAt: '2026-07-11T18:45:00Z',
    unreadCount: 0,
  },
  {
    id: 'c4',
    participant: users[4],
    lastMessage: 'Let me know when the character concepts are ready',
    lastMessageAt: '2026-07-11T09:20:00Z',
    unreadCount: 1,
  },
  {
    id: 'c5',
    participant: users[5],
    lastMessage: 'Great working with you on the campaign!',
    lastMessageAt: '2026-07-10T16:00:00Z',
    unreadCount: 0,
  },
];

export const messages: Message[] = [
  { id: 'm1', conversationId: 'c1', senderId: 'u2', text: 'Hey Layla! I saw your latest portfolio piece', createdAt: '2026-07-12T14:00:00Z', read: true },
  { id: 'm2', conversationId: 'c1', senderId: 'u1', text: 'Thanks Omar! Glad you liked it 😊', createdAt: '2026-07-12T14:10:00Z', read: true },
  { id: 'm3', conversationId: 'c1', senderId: 'u2', text: 'The designs look amazing! Can we schedule a call tomorrow?', createdAt: '2026-07-12T14:30:00Z', read: false },
  { id: 'm4', conversationId: 'c2', senderId: 'u3', text: 'Hi! Here are the photos from yesterday\'s session', createdAt: '2026-07-12T10:00:00Z', read: true },
  { id: 'm5', conversationId: 'c2', senderId: 'u1', text: 'These are incredible Fatima!', createdAt: '2026-07-12T10:30:00Z', read: true },
  { id: 'm6', conversationId: 'c2', senderId: 'u3', text: 'I sent over the raw files from the shoot 📁', createdAt: '2026-07-12T11:15:00Z', read: true },
];

export const getMessagesByConversation = (conversationId: string): Message[] =>
  messages.filter((m) => m.conversationId === conversationId);

export const getConversationById = (id: string): Conversation | undefined =>
  conversations.find((c) => c.id === id);
