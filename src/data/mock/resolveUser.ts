import { User } from '../types';
import { getUserById } from './users';
import { talents } from './talents';
import { services } from './services';
import { posts } from './posts';
import { conversations } from './messages';

/** Resolve a profile user from the directory, talents, services, posts, or chats. */
export function resolveProfileUser(userId: string): User | undefined {
  const fromDirectory = getUserById(userId);
  if (fromDirectory) return fromDirectory;

  const fromTalent = talents.find((t) => t.user.id === userId)?.user;
  if (fromTalent) return fromTalent;

  const fromService = services.find((s) => s.provider.id === userId)?.provider;
  if (fromService) return fromService;

  const fromPost = posts.find((p) => p.author.id === userId)?.author;
  if (fromPost) return fromPost;

  const fromChat = conversations.find((c) => c.participant.id === userId)?.participant;
  if (fromChat) return fromChat;

  return undefined;
}
