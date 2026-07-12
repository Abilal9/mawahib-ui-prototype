import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/layout/CustomTabBar';
import {
  HomeScreen,
  SearchScreen,
  MessagesInboxScreen,
  JobsScreen,
} from '../screens';
import AppSidebar from '../components/layout/AppSidebar';
import CreateActionMenu from '../components/layout/CreateActionMenu';
import CreateTabPlaceholder from '../screens/create/CreateTabPlaceholder';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <View style={styles.root}>
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Explore' }} />
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
        name="MessagesTab"
        component={MessagesInboxScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobsScreen}
        options={{ title: 'Jobs' }}
      />
    </Tab.Navigator>
    <AppSidebar />
    <CreateActionMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
