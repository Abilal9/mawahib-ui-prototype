import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab:
    | {
        contentType?: 'talents' | 'jobs' | 'services' | 'all' | 'posts';
        category?: string;
      }
    | undefined;
  CreateTab: undefined;
  MessagesTab: undefined;
  JobsTab: undefined;
};

export type RootStackParamList = {
  Splash1: undefined;
  Splash2: undefined;
  Welcome: { step?: 1 | 2 | 3 };
  TurnOnNotifications: undefined;
  AccountType: undefined;
  SignIn: undefined;
  SignUp: undefined;
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
  JobListingDetail: { jobId: string };
  ConfirmCode: { phone?: string; email?: string };
  ProfileSetup: { step?: number };
  ProfileSetupStep1: undefined;
  ProfileSetupStep2: undefined;
  ProfileSetupStep3: undefined;
  ProfileSetupStep4: undefined;
  ProfileSetupStep5: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ExploreEmpty: undefined;
  Notifications: undefined;
  PostDetail: { postId: string; focusComments?: boolean };
  UserPosts: { userId?: string } | undefined;
  CreateMenu: undefined;
  PostCreate: undefined;
  PhotoCapture: undefined;
  VideoCapture: undefined;
  PhotoEdit: { uri?: string };
  VideoEdit: { uri?: string };
  VideoTrim: { uri?: string };
  Chat: { conversationId: string };
  Portfolio: { userId?: string };
  Services: { userId?: string };
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
  JobInProgress: { jobId: string };
  WriteReview: { jobId: string; initialRating?: number };
  ConfirmPayment: { serviceId?: string; amount?: number; jobId?: string };
  ApplePay: { amount?: number };
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
