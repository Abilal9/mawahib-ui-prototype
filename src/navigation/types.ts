import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash1: undefined;
  Splash2: undefined;
  Welcome: { step?: 1 | 2 | 3 };
  TurnOnNotifications: undefined;
  SignUp: undefined;
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
  PostDetail: { postId: string };
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
  ServiceDetail: { serviceId: string };
  Calendar: undefined;
  Settings: undefined;
  Premium: undefined;
  PostJob: { step?: number };
  JobInProgress: { jobId: string };
  ConfirmPayment: { serviceId?: string; amount?: number };
  ApplePay: { amount?: number };
  ScanCard: undefined;
  StoryViewer: { storyId: string };
  FullPhotoPreview: { images: string[]; initialIndex?: number };
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
