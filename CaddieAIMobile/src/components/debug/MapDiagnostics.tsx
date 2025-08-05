import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  NativeModules,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}

interface MapDiagnosticsProps {
  visible: boolean;
  onClose: () => void;
}

const MapDiagnostics: React.FC<MapDiagnosticsProps> = ({ visible, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Check platform
    results.push({
      name: 'Platform',
      status: 'info',
      message: `Running on ${Platform.OS} ${Platform.Version}`,
      details: `OS: ${Platform.OS}, Version: ${Platform.Version}`
    });

    // Check API key availability
    try {
      const apiKey = NativeModules?.BuildConfig?.MAPS_API_KEY || '';
      if (apiKey && apiKey.length > 0) {
        results.push({
          name: 'API Key Configuration',
          status: 'success',
          message: 'API key found in build config',
          details: `Key starts with: ${apiKey.substring(0, 10)}...`
        });

        // Validate API key
        try {
          const testUrl = `https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=1x1&key=${apiKey}`;
          const response = await fetch(testUrl);
          
          if (response.status === 200) {
            results.push({
              name: 'API Key Validation',
              status: 'success',
              message: 'API key is valid and working',
              details: 'Successfully validated against Google Maps API'
            });
          } else if (response.status === 403) {
            results.push({
              name: 'API Key Validation',
              status: 'error',
              message: 'API key is invalid or restricted',
              details: `HTTP ${response.status}: Check API key restrictions in Google Cloud Console`
            });
          } else {
            results.push({
              name: 'API Key Validation',
              status: 'warning',
              message: `Validation returned status ${response.status}`,
              details: 'API key may have restrictions or quotas'
            });
          }
        } catch (error) {
          results.push({
            name: 'API Key Validation',
            status: 'error',
            message: 'Failed to validate API key',
            details: `Error: ${error}`
          });
        }
      } else {
        results.push({
          name: 'API Key Configuration',
          status: 'error',
          message: 'No API key found in build config',
          details: 'Check secrets.properties and build.gradle configuration'
        });
      }
    } catch (error) {
      results.push({
        name: 'API Key Configuration',
        status: 'error',
        message: 'Failed to access build config',
        details: `Error: ${error}`
      });
    }

    // Check Google Play Services (Android only)
    if (Platform.OS === 'android') {
      try {
        // Basic network test for Google services
        const response = await fetch('https://maps.googleapis.com/maps/api/js', { method: 'HEAD' });
        if (response.status === 200) {
          results.push({
            name: 'Google Services Access',
            status: 'success',
            message: 'Can access Google services endpoints',
            details: 'Network connectivity to Google services is working'
          });
        } else {
          results.push({
            name: 'Google Services Access',
            status: 'warning',
            message: 'Limited access to Google services',
            details: `HTTP ${response.status}: May affect map functionality`
          });
        }
      } catch (error) {
        results.push({
          name: 'Google Services Access',
          status: 'error',
          message: 'Cannot access Google services',
          details: 'Check network connectivity and Google Play Services installation'
        });
      }
    }

    // Check react-native-maps installation
    try {
      const ReactNativeMaps = require('react-native-maps');
      if (ReactNativeMaps && ReactNativeMaps.default) {
        results.push({
          name: 'React Native Maps',
          status: 'success',
          message: 'react-native-maps is properly installed',
          details: 'MapView component is available'
        });
      } else {
        results.push({
          name: 'React Native Maps',
          status: 'warning',
          message: 'react-native-maps may not be properly configured',
          details: 'MapView component structure is unexpected'
        });
      }
    } catch (error) {
      results.push({
        name: 'React Native Maps',
        status: 'error',
        message: 'react-native-maps installation issue',
        details: `Error: ${error}`
      });
    }

    // Check permissions status (basic check)
    results.push({
      name: 'Location Permissions',
      status: 'info',
      message: 'Check location permissions in device settings',
      details: 'Ensure location access is granted for precise location'
    });

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    if (visible) {
      runDiagnostics();
    }
  }, [visible]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Icon name="check-circle" size={20} color="#4CAF50" />;
      case 'warning':
        return <Icon name="warning" size={20} color="#FF9800" />;
      case 'error':
        return <Icon name="error" size={20} color="#F44336" />;
      case 'info':
        return <Icon name="info" size={20} color="#2196F3" />;
      default:
        return <Icon name="help" size={20} color="#9E9E9E" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return '#E8F5E8';
      case 'warning':
        return '#FFF3E0';
      case 'error':
        return '#FFEBEE';
      case 'info':
        return '#E3F2FD';
      default:
        return '#F5F5F5';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Map Diagnostics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isRunning ? (
            <View style={styles.loading}>
              <Text style={styles.loadingText}>Running diagnostics...</Text>
            </View>
          ) : (
            diagnostics.map((diagnostic, index) => (
              <View
                key={index}
                style={[
                  styles.diagnosticItem,
                  { backgroundColor: getStatusColor(diagnostic.status) }
                ]}
              >
                <View style={styles.diagnosticHeader}>
                  {getStatusIcon(diagnostic.status)}
                  <Text style={styles.diagnosticName}>{diagnostic.name}</Text>
                </View>
                <Text style={styles.diagnosticMessage}>{diagnostic.message}</Text>
                {diagnostic.details && (
                  <Text style={styles.diagnosticDetails}>{diagnostic.details}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={runDiagnostics}
            style={styles.retryButton}
            disabled={isRunning}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>
              {isRunning ? 'Running...' : 'Run Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxWidth: 400,
    maxHeight: '80%',
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  diagnosticItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  diagnosticName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  diagnosticMessage: {
    fontSize: 13,
    color: '#666',
    marginLeft: 28,
    marginBottom: 2,
  },
  diagnosticDetails: {
    fontSize: 11,
    color: '#999',
    marginLeft: 28,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapDiagnostics;