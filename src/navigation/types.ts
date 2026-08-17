import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Explore tabs — aligns with SearchScreen / explore utils (no legacy all/posts). */
export type SearchContentType = 'talents' | 'jobs' | 'services';

export type JobsTabLanding = {
  /**
   * Explicit landing override (success redirect / deep link).
   * When omitted on focus, Jobs preserves its current tab/section
   * (e.g. Back from a detail screen).
   */
  tab?: 'sent' | 'received';
  /** Horizontal section carousel key inside that tab */
  section?:
    | 'requests'
    | 'pending-payment'
    | 'in-progress'
    | 'completed'
    | 'posted';
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab:
    | {
        contentType?: SearchContentType;
        category?: string;
      }
    | undefined;
  CreateTab: undefined;
  MessagesTab: undefined;
  JobsTab: JobsTabLanding | undefined;
};

export type RootStackParamList = {
  Splash1: undefined;
  Splash2: undefined;
  Welcome: { step?: 1 | 2 | 3 };
  TurnOnNotifications: undefined;
  AccountType: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyAccount: { email: string; phoneE164: string };
  SignupSuccess: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  EditProfile: undefined;
  EditAboutSection: {
    section: 'bio' | 'languages' | 'talents' | 'education' | 'experience' | 'certifications';
  };
  AddPortfolioProject: { projectId?: string } | undefined;
  AddProfileService: { serviceId?: string } | undefined;
  ManageProfileList: { type: 'portfolio' | 'services' };
  PortfolioProjectDetail: { projectId: string; userId?: string };
  JobListingDetail: { listingId: string };
  ConfirmCode: { phone?: string; email?: string };
  ProfileSetup: { step?: number };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Notifications: undefined;
  PostDetail: { postId: string; focusComments?: boolean };
  UserPosts: { userId?: string } | undefined;
  PostCreate: undefined;
  PhotoCapture: undefined;
  PhotoEdit: { uri?: string };
  VideoEdit: { uri?: string };
  VideoTrim: { uri?: string };
  Chat: { conversationId: string };
  ConversationMedia: { conversationId: string };
  ArchivedConversations: undefined;
  ServiceDetail: { serviceId: string; userId?: string };
  RequestService: {
    userId: string;
    serviceId?: string;
    packageName?: 'Basic' | 'Standard' | 'Premium';
  };
  Calendar: undefined;
  Connections: { userId?: string } | undefined;
  Reviews: { userId?: string } | undefined;
  Documentation: undefined;
  ChangeLanguage: undefined;
  Settings: undefined;
  Premium: undefined;
  PostJob: { step?: number };
  /** The unified request detail — every inbox row opens here. */
  WorkRequestDetail: { requestId: string };
  DirectRequest: { userId: string };
  WriteReview: {
    jobId: string;
    initialRating?: number;
    engagementId?: string;
    conversationId?: string;
    workRequestId?: string;
  };
  ConfirmPayment: { serviceId?: string; amount?: number; requestId?: string };
  ApplePay: { amount?: number; requestId?: string };
  ScanCard: undefined;
  StoryViewer: { storyId: string };
  FullPhotoPreview: { images: string[]; initialIndex?: number };
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = ScreenProps<T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
