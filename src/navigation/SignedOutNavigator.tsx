import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuestTabs from './GuestTabs';
import {
  WelcomeScreen,
  TurnOnNotificationsScreen,
  AccountTypeScreen,
  SignInScreen,
  SignUpScreen,
  VerifyAccountScreen,
  ConfirmCodeScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  SignupSuccessScreen,
} from '../screens';
import { SignedOutStackParamList } from './types';
import GuestUserProfileScreen from '../screens/guest/GuestUserProfileScreen';
import GuestServiceDetailScreen from '../screens/guest/GuestServiceDetailScreen';
import GuestJobListingDetailScreen from '../screens/guest/GuestJobListingDetailScreen';
import GuestPostDetailScreen from '../screens/guest/GuestPostDetailScreen';
import GuestReviewsScreen from '../screens/guest/GuestReviewsScreen';
import GuestPortfolioProjectDetailScreen from '../screens/guest/GuestPortfolioProjectDetailScreen';

const Stack = createNativeStackNavigator<SignedOutStackParamList>();

/**
 * Signed-out product tree.
 *
 * Public detail routes map to Guest-safe containers. Private
 * UserProfileScreen / ServiceDetailScreen / JobListingDetailScreen /
 * PostDetailScreen / ReviewsScreen / PortfolioProjectDetailScreen
 * remain registered only on AuthenticatedNavigator.
 */
export default function SignedOutNavigator({
  initialRouteName,
  initialParams,
}: {
  initialRouteName: keyof SignedOutStackParamList;
  initialParams?: object;
}) {
  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    contentStyle: { backgroundColor: '#F7F9FB' },
  };

  return (
    <Stack.Navigator
      key="signed-out"
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
    >
      <Stack.Screen name="GuestTabs" component={GuestTabs} />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        initialParams={
          initialRouteName === 'Welcome'
            ? (initialParams as { step?: 1 | 2 | 3 })
            : undefined
        }
      />
      <Stack.Screen
        name="TurnOnNotifications"
        component={TurnOnNotificationsScreen}
      />
      <Stack.Screen name="AccountType" component={AccountTypeScreen} />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        initialParams={
          initialRouteName === 'SignIn'
            ? (initialParams as SignedOutStackParamList['SignIn'])
            : undefined
        }
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} />
      <Stack.Screen
        name="ConfirmCode"
        component={ConfirmCodeScreen}
        initialParams={
          initialRouteName === 'ConfirmCode'
            ? (initialParams as SignedOutStackParamList['ConfirmCode'])
            : undefined
        }
      />
      <Stack.Screen name="SignupSuccess" component={SignupSuccessScreen} />
      <Stack.Screen name="UserProfile" component={GuestUserProfileScreen} />
      <Stack.Screen name="ServiceDetail" component={GuestServiceDetailScreen} />
      <Stack.Screen
        name="JobListingDetail"
        component={GuestJobListingDetailScreen}
      />
      <Stack.Screen name="PostDetail" component={GuestPostDetailScreen} />
      <Stack.Screen name="Reviews" component={GuestReviewsScreen} />
      <Stack.Screen
        name="PortfolioProjectDetail"
        component={GuestPortfolioProjectDetailScreen}
      />
    </Stack.Navigator>
  );
}
