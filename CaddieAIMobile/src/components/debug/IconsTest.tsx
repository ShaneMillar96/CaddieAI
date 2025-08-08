import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

const IconsTest: React.FC = () => {
  const testIcons = [
    { IconComponent: MaterialIcons, name: 'golf-course', label: 'Golf Course' },
    { IconComponent: MaterialIcons, name: 'gps-fixed', label: 'GPS Fixed' },
    { IconComponent: FontAwesome, name: 'user', label: 'User' },
    { IconComponent: FontAwesome, name: 'star', label: 'Star' },
    { IconComponent: Ionicons, name: 'home', label: 'Home' },
    { IconComponent: Ionicons, name: 'location', label: 'Location' },
    { IconComponent: Feather, name: 'map', label: 'Map' },
    { IconComponent: Feather, name: 'settings', label: 'Settings' }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vector Icons Test</Text>
      <Text style={styles.subtitle}>Testing icon rendering after installation</Text>
      
      <View style={styles.iconGrid}>
        {testIcons.map(({ IconComponent, name, label }, index) => (
          <View key={index} style={styles.iconItem}>
            <IconComponent name={name} size={32} color="#2E7D32" />
            <Text style={styles.iconLabel}>{label}</Text>
            <Text style={styles.iconName}>{name}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.status}>
        ✅ If you can see all icons above, vector icons are properly installed!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  iconItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  iconLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconName: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2E7D32',
    fontWeight: '500',
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
});

export default IconsTest;