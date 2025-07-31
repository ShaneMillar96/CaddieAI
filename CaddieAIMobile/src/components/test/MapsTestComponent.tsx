import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

const MapsTestComponent: React.FC = () => {
  const handleMapReady = () => {
    Alert.alert('Success', 'React Native Maps is working correctly!');
    console.log('✅ react-native-maps TurboModule loaded successfully');
  };

  const handleMapError = (error: any) => {
    Alert.alert('Map Error', `Error loading map: ${error.message || 'Unknown error'}`);
    console.error('❌ react-native-maps error:', error);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maps Integration Test</Text>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 54.9783, // Faughan Valley Golf Centre
            longitude: -7.2054,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onMapReady={handleMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
        />
      </View>
      <Text style={styles.status}>
        If you see this map without errors, the TurboModule issue is resolved!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MapsTestComponent;