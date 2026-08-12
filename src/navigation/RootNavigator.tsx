import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import {
  SplashScreen1,
  SplashScreen2,
  WelcomeScreen,
  TurnOnNotificationsScreen,
  AccountTypeScreen,
  SignInScreen,
  SignUpScreen,
  VerifyAccountScreen,
  ConfirmCodeScreen,
  SignupSuccessScreen,
  ProfileSetupScreen,
  NotificationsScreen,
  PostDetailScreen,
  PostCreateScreen,
  PhotoCaptureScreen,
  PhotoEditScreen,
  VideoEditScreen,
  VideoTrimScreen,
  ChatScreen,
  ProfileScreen,
  UserProfileScreen,
  EditProfileScreen,
  EditAboutSectionScreen,
  AddPortfolioProjectScreen,
  AddProfileServiceScreen,
  ManageProfileListScreen,
  PortfolioProjectDetailScreen,
  UserPostsScreen,
  ServiceDetailScreen,
  RequestServiceScreen,
  CalendarScreen,
  ConnectionsScreen,
  ReviewsScreen,
  DocumentationScreen,
  ChangeLanguageScreen,
  SettingsScreen,
  PremiumScreen,
  PostJobScreen,
  JobInProgressScreen,
  WriteReviewScreen,
  JobListingDetailScreen,
  ConfirmPaymentScreen,
  ApplePayScreen,
  ScanCardScreen,
  StoryViewerScreen,
  FullPhotoPreviewScreen,
} from '../screens';
import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Gates MainTabs behind authenticated Nest user (session + /users/me).
 * Auth/onboarding screens stay registered so SignIn/SignupSuccess can reset
 * navigation without remount races.
 *
 * Orphaned screens intentionally unregistered (files kept for later reuse):
 * ExploreEmpty, Portfolio, Services, VideoCapture, CreateMenu,
 * ProfileSetupStep1–5 as routes, MessagesEmpty.
 */
function MainTabsGate() {
  const { isSignedIn, authLoading, apiUser, session, signUpBasics } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const emailOk = Boolean(apiUser?.emailVerified);
  const needsVerify =
    isSignedIn && apiUser && !emailOk;

  useEffect(() => {
    if (authLoading) return;
    if (!isSignedIn || !apiUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
      return;
    }
    if (!emailOk) {
      const email = apiUser.email || session?.user?.email || signUpBasics?.email;
      const phoneE164 = apiUser.phoneE164 || signUpBasics?.phoneE164;
      if (email && phoneE164) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VerifyAccount', params: { email, phoneE164 } }],
        });
      } else if (email) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ConfirmCode', params: { email } }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
    }
  }, [
    authLoading,
    isSignedIn,
    apiUser,
    emailOk,
    navigation,
    session,
    signUpBasics,
  ]);

  if (authLoading || !isSignedIn || !apiUser || needsVerify) return null;
  return <MainTabs />;
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash1"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F7F9FB' },
      }}
    >
      <Stack.Screen name="Splash1" component={SplashScreen1} />
      <Stack.Screen name="Splash2" component={SplashScreen2} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="TurnOnNotifications" component={TurnOnNotificationsScreen} />
      <Stack.Screen name="AccountType" component={AccountTypeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} />
      <Stack.Screen name="ConfirmCode" component={ConfirmCodeScreen} />
      <Stack.Screen name="SignupSuccess" component={SignupSuccessScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="MainTabs" component={MainTabsGate} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EditAboutSection" component={EditAboutSectionScreen} />
      <Stack.Screen name="AddPortfolioProject" component={AddPortfolioProjectScreen} />
      <Stack.Screen name="AddProfileService" component={AddProfileServiceScreen} />
      <Stack.Screen name="ManageProfileList" component={ManageProfileListScreen} />
      <Stack.Screen name="PortfolioProjectDetail" component={PortfolioProjectDetailScreen} />
      <Stack.Screen name="UserPosts" component={UserPostsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PostCreate" component={PostCreateScreen} />
      <Stack.Screen name="PhotoCapture" component={PhotoCaptureScreen} />
      <Stack.Screen name="PhotoEdit" component={PhotoEditScreen} />
      <Stack.Screen name="VideoEdit" component={VideoEditScreen} />
      <Stack.Screen name="VideoTrim" component={VideoTrimScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="RequestService" component={RequestServiceScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="Documentation" component={DocumentationScreen} />
      <Stack.Screen name="ChangeLanguage" component={ChangeLanguageScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="JobListingDetail" component={JobListingDetailScreen} />
      <Stack.Screen name="JobInProgress" component={JobInProgressScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="ConfirmPayment" component={ConfirmPaymentScreen} />
      <Stack.Screen name="ApplePay" component={ApplePayScreen} />
      <Stack.Screen name="ScanCard" component={ScanCardScreen} />
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewerScreen}
        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="FullPhotoPreview"
        component={FullPhotoPreviewScreen}
        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
