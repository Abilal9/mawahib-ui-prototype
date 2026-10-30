import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/layout/CustomTabBar';
import CreateTabPlaceholder from '../screens/create/CreateTabPlaceholder';
import GuestHomeScreen from '../screens/guest/GuestHomeScreen';
import GuestExploreScreen from '../screens/guest/GuestExploreScreen';
import GuestAccountScreen from '../screens/guest/GuestAccountScreen';
import GuestCreateMenu from '../components/layout/GuestCreateMenu';
import { CreateMenuProvider } from '../context/CreateMenuContext';
import { GuestTabParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<GuestTabParamList>();

export default function GuestTabs() {
  return (
    <CreateMenuProvider>
      <View style={styles.root}>
        <Tab.Navigator
          tabBar={(props) => (
            <CustomTabBar {...props} showUnreadIndicators={false} />
          )}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.background },
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
            },
          }}
        >
          <Tab.Screen
            name="HomeTab"
            component={GuestHomeScreen}
            options={{ title: 'Home' }}
          />
          <Tab.Screen
            name="SearchTab"
            component={GuestExploreScreen}
            options={{ title: 'Explore' }}
          />
          <Tab.Screen
            name="CreateTab"
            component={CreateTabPlaceholder}
            options={{ title: 'Create' }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
              },
            }}
          />
          <Tab.Screen
            name="AccountTab"
            component={GuestAccountScreen}
            options={{ title: 'Account' }}
          />
        </Tab.Navigator>
        <GuestCreateMenu />
      </View>
    </CreateMenuProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
