import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MyCoursesScreen from '../screens/main/MyCoursesScreen';
import CoursesScreen from '../screens/main/CoursesScreen';
import CourseDetailScreen from '../screens/main/CourseDetailScreen';

export type CoursesStackParamList = {
  MyCourses: undefined;
  CoursesList: { fromActiveRound?: boolean } | undefined;
  CourseDetail: { courseId: number; courseName?: string };
};

const Stack = createStackNavigator<CoursesStackParamList>();

export const CoursesNavigator: React.FC = () => {
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
      initialRouteName="MyCourses"
    >
      <Stack.Screen
        name="MyCourses"
        component={MyCoursesScreen}
        options={{
          title: 'My Courses',
        }}
      />
      <Stack.Screen
        name="CoursesList"
        component={CoursesScreen}
        options={{
          title: 'All Courses',
        }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={({ route }) => ({
          title: route.params?.courseName || 'Course Details',
        })}
      />
    </Stack.Navigator>
  );
};

export default CoursesNavigator;