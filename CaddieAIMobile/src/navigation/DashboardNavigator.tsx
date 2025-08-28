import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardHomeScreen from '../screens/main/DashboardHomeScreen';
import AllRoundsScreen from '../screens/main/AllRoundsScreen';
import RoundScorecardScreen from '../screens/main/RoundScorecardScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  AllRounds: undefined;
  RoundScorecard: { roundId: number; courseName?: string };
};

const Stack = createStackNavigator<DashboardStackParamList>();

export const DashboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c5530',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
      initialRouteName="DashboardHome"
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="AllRounds"
        component={AllRoundsScreen}
        options={{
          title: 'All Rounds',
        }}
      />
      <Stack.Screen
        name="RoundScorecard"
        component={RoundScorecardScreen}
        options={({ route }) => ({
          title: route.params?.courseName ? `${route.params.courseName} Scorecard` : 'Scorecard',
        })}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;