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

const Stack = createNativeStackNavigator<SignedOutStackParamList>();

/**
 * Signed-out product tree.
 *
 * Public detail routes (UserProfile, ServiceDetail, JobListingDetail,
 * PostDetail, Reviews, PortfolioProjectDetail) are deferred to Phase F.
 * Current screens depend on authenticated providers; registering the
 * private versions here would violate route isolation.
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
    </Stack.Navigator>
  );
}
