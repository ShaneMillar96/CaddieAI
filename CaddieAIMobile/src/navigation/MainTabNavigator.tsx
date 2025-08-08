import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import ActiveRoundScreen from '../screens/main/ActiveRoundScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CoursesNavigator from './CoursesNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icon components
const DashboardIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="dashboard" size={size} color={color} />
);

const CoursesIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="golf-course" size={size} color={color} />
);

const ActiveRoundIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="play-circle-filled" size={size} color={color} />
);

const AIChatIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="smart-toy" size={size} color={color} />
);

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="person" size={size} color={color} />
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2c5530',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e1e1e1',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#2c5530',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesNavigator}
        options={{
          title: 'Courses',
          tabBarIcon: CoursesIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ActiveRound"
        component={ActiveRoundScreen}
        options={{
          title: 'Active Round',
          tabBarIcon: ActiveRoundIcon,
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          title: 'AI Assistant',
          tabBarIcon: AIChatIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;