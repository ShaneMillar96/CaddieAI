import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

interface TestResults {
  defaultProvider: 'success' | 'failed' | 'testing';
  googleProvider: 'success' | 'failed' | 'testing' | 'pending';
  hasMapRef: boolean;
  onLayoutCalled: boolean;
  onMapReadyCalled: boolean;
}

const MapsTestComponent: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const hasRefBeenSet = useRef<boolean>(false);
  const testStartTime = useRef<number>(Date.now());
  
  const [testResults, setTestResults] = useState<TestResults>({
    defaultProvider: 'testing',
    googleProvider: 'pending',
    hasMapRef: false,
    onLayoutCalled: false,
    onMapReadyCalled: false,
  });

  const [currentTest, setCurrentTest] = useState<'default' | 'google'>('default');
  const [currentProvider, setCurrentProvider] = useState(PROVIDER_DEFAULT);

  // Test timeout - if no callbacks after 10 seconds, mark as failed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentTest === 'default' && testResults.defaultProvider === 'testing') {
        console.log('🔴 DEFAULT PROVIDER TEST FAILED - No callbacks after 10 seconds');
        setTestResults(prev => ({ ...prev, defaultProvider: 'failed' }));
        // Start Google test after default fails
        setCurrentTest('google');
        setTestResults(prev => ({ ...prev, googleProvider: 'testing' }));
      } else if (currentTest === 'google' && testResults.googleProvider === 'testing') {
        console.log('🔴 GOOGLE PROVIDER TEST FAILED - No callbacks after 10 seconds');
        setTestResults(prev => ({ ...prev, googleProvider: 'failed' }));
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [currentTest, testResults]);

  // Single MapView callbacks with proper memoization
  const handleMapRef = useCallback((ref: MapView | null) => {
    const providerName = currentTest.toUpperCase();
    console.log(`🟡 ${providerName} PROVIDER REF CALLBACK:`, !!ref);
    if (ref && !hasRefBeenSet.current) {
      hasRefBeenSet.current = true;
      setTestResults(prev => ({ ...prev, hasMapRef: true }));
    } else if (!ref && hasRefBeenSet.current) {
      // Ref being unset - this shouldn't happen with stable mounting
      console.warn(`⚠️ ${providerName} PROVIDER REF LOST - possible unmount/remount`);
    }
  }, [currentTest]);

  const handleMapLayout = useCallback(() => {
    const providerName = currentTest.toUpperCase();
    console.log(`🟡 ${providerName} PROVIDER ON LAYOUT`);
    setTestResults(prev => ({ ...prev, onLayoutCalled: true }));
  }, [currentTest]);

  const handleMapReady = useCallback(() => {
    const providerName = currentTest.toUpperCase();
    console.log(`🟢 ${providerName} PROVIDER MAP READY - SUCCESS!`);
    
    if (currentTest === 'default') {
      setTestResults(prev => ({ ...prev, onMapReadyCalled: true, defaultProvider: 'success' }));
      // Start Google test after default succeeds
      setTimeout(() => {
        console.log('🔄 Switching to Google Provider test (without remounting)...');
        // Reset tracking for next provider test - but keep component mounted
        hasRefBeenSet.current = false;
        testStartTime.current = Date.now();
        setCurrentTest('google');
        setCurrentProvider(PROVIDER_GOOGLE);
        setTestResults(prev => ({ 
          ...prev, 
          googleProvider: 'testing',
          hasMapRef: false,
          onLayoutCalled: false,
          onMapReadyCalled: false
        }));
      }, 2000);
    } else if (currentTest === 'google') {
      setTestResults(prev => ({ ...prev, onMapReadyCalled: true, googleProvider: 'success' }));
      console.log('🎉 ALL TESTS COMPLETED - Both providers working!');
    }
  }, [currentTest]);

  const renderTestStatus = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'testing': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Maps Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {renderTestStatus(testResults.defaultProvider)} Default Provider: {testResults.defaultProvider}
        </Text>
        <Text style={styles.statusText}>
          {renderTestStatus(testResults.googleProvider)} Google Provider: {testResults.googleProvider}
        </Text>
        <Text style={styles.statusText}>
          {testResults.hasMapRef ? '✅' : '❌'} Has Map Ref: {testResults.hasMapRef ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          {testResults.onLayoutCalled ? '✅' : '❌'} OnLayout Called: {testResults.onLayoutCalled ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          {testResults.onMapReadyCalled ? '✅' : '❌'} OnMapReady Called: {testResults.onMapReadyCalled ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          🔄 Current Test: {currentTest}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={handleMapRef}
          style={styles.map}
          provider={currentProvider}
          initialRegion={{
            latitude: 54.9783,
            longitude: -7.3086,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onLayout={handleMapLayout}
          onMapReady={handleMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsIndoors={false}
          showsTraffic={false}
          toolbarEnabled={false}
          moveOnMarkerPress={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  statusContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default MapsTestComponent;