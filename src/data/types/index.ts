export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string | number;
  coverImage?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  followers: number;
  following: number;
  posts: number;
  isVerified?: boolean;
  title?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Post {
  id: string;
  author: User;
  caption: string;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  location?: string;
  role?: string;
  timeAgo?: string;
}

export interface Story {
  id: string;
  user: User;
  items: StoryItem[];
  seen: boolean;
  isOwn?: boolean;
}

export interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  location: string;
  salary: string;
  description: string;
  skills: string[];
  postedAt: string;
  status?: 'open' | 'in-progress' | 'completed' | 'cancelled';
  matchScore?: number;
  logo?: string | number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'job' | 'message' | 'system';
  user?: User;
  message: string;
  createdAt: string;
  read: boolean;
  postId?: string;
  jobId?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  category: string;
  provider: User;
  rating: number;
  reviewCount: number;
  images: string[];
}

export interface Talent {
  id: string;
  user: User;
  category: string;
  rating: number;
  hourlyRate: number;
  skills: string[];
}
