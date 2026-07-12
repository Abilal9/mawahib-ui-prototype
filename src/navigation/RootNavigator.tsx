import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import {
  SplashScreen1,
  SplashScreen2,
  WelcomeScreen,
  TurnOnNotificationsScreen,
  SignUpScreen,
  ConfirmCodeScreen,
  ProfileSetupScreen,
  ExploreEmptyScreen,
  NotificationsScreen,
  PostDetailScreen,
  PostCreateScreen,
  PhotoCaptureScreen,
  VideoCaptureScreen,
  PhotoEditScreen,
  VideoEditScreen,
  VideoTrimScreen,
  ChatScreen,
  PortfolioScreen,
  ServicesScreen,
  ServiceDetailScreen,
  CalendarScreen,
  SettingsScreen,
  PremiumScreen,
  PostJobScreen,
  JobInProgressScreen,
  ConfirmPaymentScreen,
  ApplePayScreen,
  ScanCardScreen,
  StoryViewerScreen,
  FullPhotoPreviewScreen,
} from '../screens';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ConfirmCode" component={ConfirmCodeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ExploreEmpty" component={ExploreEmptyScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PostCreate" component={PostCreateScreen} />
      <Stack.Screen name="PhotoCapture" component={PhotoCaptureScreen} />
      <Stack.Screen name="VideoCapture" component={VideoCaptureScreen} />
      <Stack.Screen name="PhotoEdit" component={PhotoEditScreen} />
      <Stack.Screen name="VideoEdit" component={VideoEditScreen} />
      <Stack.Screen name="VideoTrim" component={VideoTrimScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="JobInProgress" component={JobInProgressScreen} />
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
