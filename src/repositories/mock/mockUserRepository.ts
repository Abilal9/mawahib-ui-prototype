import { users, currentUser, getUserById } from '../../data/mock/users';
import { talents } from '../../data/mock/talents';
import { services } from '../../data/mock/services';
import { posts } from '../../data/mock/posts';
import { conversations } from '../../data/mock/messages';
import { UserRepository } from '../types';

/** Mock user directory — replace with Supabase auth/profiles later. */
export const mockUserRepository: UserRepository = {
  getCurrent: () => currentUser,
  list: () => users,
  getById: (id) => getUserById(id),
  resolveProfileUser: (userId) => {
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
  },
};
