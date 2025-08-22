import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  scanForGarminDevices,
  connectToGarminDevice,
  disconnectGarminDevice,
  activateMobileSensors,
  requestBluetoothPermissions,
  setError,
  clearError,
  showConnectionModal,
  hideConnectionModal,
  selectGarminState,
  selectDiscoveredDevices,
  selectConnectedDevice,
  selectConnectionStatus,
  selectIsScanning,
  selectPermissions,
  selectCurrentDeviceType,
  selectDeviceStatusSummary,
} from '../../store/slices/garminSlice';
import { ConnectionStatus } from '../../services/GarminBluetoothService';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * GarminConnectionSection - Profile screen component for managing Garmin device connections
 * 
 * Features:
 * - Device scanning and discovery
 * - Connection management
 * - Battery level display
 * - Mobile sensor fallback
 * - Permission handling
 * - Auto-connect preferences
 */
export const GarminConnectionSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const garminState = useAppSelector(selectGarminState);
  const discoveredDevices = useAppSelector(selectDiscoveredDevices);
  const connectedDevice = useAppSelector(selectConnectedDevice);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const isScanning = useAppSelector(selectIsScanning);
  const permissions = useAppSelector(selectPermissions);
  const currentDeviceType = useAppSelector(selectCurrentDeviceType);
  const deviceStatusSummary = useAppSelector(selectDeviceStatusSummary);

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  const handleScanForDevices = useCallback(async () => {
    try {
      dispatch(clearError());
      
      // Check permissions first
      if (!permissions.bluetooth || !permissions.location) {
        console.log('🔵 GarminConnectionSection: Requesting permissions before scan');
        await dispatch(requestBluetoothPermissions()).unwrap();
      }
      
      console.log('🔵 GarminConnectionSection: Starting device scan');
      await dispatch(scanForGarminDevices(15000)).unwrap(); // 15 second scan
    } catch (error) {
      console.error('🔴 GarminConnectionSection: Scan failed:', error);
      Alert.alert(
        'Scan Failed',
        `Unable to scan for devices: ${error}`,
        [{ text: 'OK' }]
      );
    }
  }, [dispatch, permissions]);

  const handleConnectToDevice = useCallback(async (deviceId: string) => {
    try {
      dispatch(clearError());
      console.log(`🔵 GarminConnectionSection: Connecting to device ${deviceId}`);
      await dispatch(connectToGarminDevice(deviceId)).unwrap();
      
      Alert.alert(
        'Connected!',
        'Successfully connected to your Garmin device. Swing analysis will now be available during active rounds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔴 GarminConnectionSection: Connection failed:', error);
      Alert.alert(
        'Connection Failed',
        `Unable to connect to device: ${error}`,
        [{ text: 'OK' }]
      );
    }
  }, [dispatch]);

  const handleDisconnectDevice = useCallback(async () => {
    try {
      dispatch(clearError());
      console.log('🔵 GarminConnectionSection: Disconnecting device');
      await dispatch(disconnectGarminDevice()).unwrap();
      
      Alert.alert(
        'Disconnected',
        'Garmin device has been disconnected.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔴 GarminConnectionSection: Disconnect failed:', error);
      Alert.alert(
        'Disconnect Failed',
        `Unable to disconnect device: ${error}`,
        [{ text: 'OK' }]
      );
    }
  }, [dispatch]);

  const handleActivateMobileSensors = useCallback(async () => {
    try {
      dispatch(clearError());
      console.log('🔵 GarminConnectionSection: Activating mobile sensors');
      await dispatch(activateMobileSensors()).unwrap();
      
      Alert.alert(
        'Mobile Sensors Active',
        'Using your phone\'s sensors for swing detection. This is ideal for testing and when Garmin devices are unavailable.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔴 GarminConnectionSection: Mobile sensor activation failed:', error);
      Alert.alert(
        'Activation Failed',
        `Unable to activate mobile sensors: ${error}`,
        [{ text: 'OK' }]
      );
    }
  }, [dispatch]);

  const handleRequestPermissions = useCallback(async () => {
    try {
      console.log('🔵 GarminConnectionSection: Requesting Bluetooth permissions');
      await dispatch(requestBluetoothPermissions()).unwrap();
      
      Alert.alert(
        'Permissions Granted',
        'Bluetooth permissions have been granted. You can now scan for Garmin devices.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔴 GarminConnectionSection: Permission request failed:', error);
      Alert.alert(
        'Permission Required',
        'Bluetooth and location permissions are required to connect to Garmin devices. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // TODO: Open device settings
            console.log('🔵 GarminConnectionSection: Should open device settings');
          }}
        ]
      );
    }
  }, [dispatch]);

  const renderDeviceItem = ({ item }: { item: any }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <View style={styles.deviceTypeContainer}>
            <Icon 
              name={getDeviceIcon(item.deviceType)} 
              size={16} 
              color="#4a7c59" 
            />
            <Text style={styles.deviceType}>
              {getDeviceTypeLabel(item.deviceType)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.deviceId}>ID: {item.id.slice(-8)}</Text>
        
        {item.rssi && (
          <Text style={styles.deviceSignal}>
            Signal: {item.rssi} dBm ({getSignalStrength(item.rssi)})
          </Text>
        )}
        
        {item.batteryLevel && (
          <View style={styles.batteryContainer}>
            <Icon name="battery-std" size={16} color="#4a7c59" />
            <Text style={styles.batteryLevel}>
              {item.batteryLevel}%
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.connectButton,
          item.isConnected && styles.connectedButton
        ]}
        onPress={() => handleConnectToDevice(item.id)}
        disabled={item.isConnected || connectionStatus === ConnectionStatus.Connecting}
      >
        {connectionStatus === ConnectionStatus.Connecting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.connectButtonText}>
            {item.isConnected ? 'Connected' : 'Connect'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const getDeviceIcon = (deviceType: string): string => {
    switch (deviceType) {
      case 'forerunner': return 'watch';
      case 'watch': return 'watch';
      case 'fitness_tracker': return 'fitness-center';
      default: return 'device-unknown';
    }
  };

  const getDeviceTypeLabel = (deviceType: string): string => {
    switch (deviceType) {
      case 'forerunner': return 'Forerunner';
      case 'watch': return 'Watch';
      case 'fitness_tracker': return 'Fitness Tracker';
      default: return 'Unknown';
    }
  };

  const getSignalStrength = (rssi: number): string => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Good';
    if (rssi >= -70) return 'Fair';
    return 'Poor';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Garmin Device Connection</Text>
      <Text style={styles.sectionDescription}>
        Connect your Garmin Forerunner 55 or other compatible device for automatic swing detection and analysis during rounds.
      </Text>
      
      {/* Pairing Mode Instructions */}
      {isScanning && (
        <View style={styles.pairingInstructionsCard}>
          <Icon name="info" size={20} color="#3498db" />
          <View style={styles.pairingInstructions}>
            <Text style={styles.pairingTitle}>Having trouble finding your Garmin device?</Text>
            <Text style={styles.pairingStep}>1. Put your Forerunner 55 in pairing mode:</Text>
            <Text style={styles.pairingSubStep}>   • Hold LIGHT/BLUETOOTH button for 2-3 seconds</Text>
            <Text style={styles.pairingSubStep}>   • Look for "Bluetooth" on screen</Text>
            <Text style={styles.pairingStep}>2. Make sure your device is close to your phone</Text>
            <Text style={styles.pairingStep}>3. Try scanning again if no devices appear</Text>
          </View>
        </View>
      )}

      {/* Current Device Status */}
      {deviceStatusSummary.type ? (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon 
              name={deviceStatusSummary.type === 'garmin' ? 'watch' : 'smartphone'} 
              size={20} 
              color="#4a7c59" 
            />
            <Text style={styles.statusTitle}>Current Device</Text>
          </View>
          
          <Text style={styles.statusDeviceName}>{deviceStatusSummary.name}</Text>
          
          {deviceStatusSummary.batteryLevel && (
            <View style={styles.statusBattery}>
              <Icon name="battery-std" size={16} color="#4a7c59" />
              <Text style={styles.statusBatteryText}>
                {deviceStatusSummary.batteryLevel}%
              </Text>
            </View>
          )}
          
          {deviceStatusSummary.isRecording && (
            <View style={styles.recordingIndicator}>
              <Icon name="fiber-manual-record" size={12} color="#e74c3c" />
              <Text style={styles.recordingText}>Recording Active</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnectDevice}
            disabled={garminState.isLoading}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noDeviceCard}>
          <Icon name="watch-off" size={32} color="#999" />
          <Text style={styles.noDeviceText}>No Device Connected</Text>
          <Text style={styles.noDeviceSubtext}>
            Connect a Garmin device or use mobile sensors for swing analysis
          </Text>
        </View>
      )}

      {/* Permission Status */}
      {(!permissions.bluetooth || !permissions.location) && (
        <View style={styles.permissionCard}>
          <Icon name="security" size={20} color="#f39c12" />
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionDescription}>
            Bluetooth and location permissions are needed to scan for and connect to Garmin devices.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Device Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={handleScanForDevices}
          disabled={isScanning || !permissions.bluetooth}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="search" size={20} color="#fff" />
          )}
          <Text style={styles.actionButtonText}>
            {isScanning ? 'Scanning...' : 'Scan for Garmin Devices'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.mobileButton]}
          onPress={handleActivateMobileSensors}
          disabled={garminState.isLoading}
        >
          <Icon name="smartphone" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Use Mobile Sensors</Text>
        </TouchableOpacity>
      </View>

      {/* Discovered Devices */}
      {discoveredDevices.length > 0 && (
        <View style={styles.devicesContainer}>
          <Text style={styles.devicesTitle}>
            Discovered Devices ({discoveredDevices.length})
          </Text>
          <FlatList
            data={discoveredDevices}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            style={styles.devicesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Error Display */}
      {garminState.error && (
        <View style={styles.errorCard}>
          <Icon name="error" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{garminState.error}</Text>
          <TouchableOpacity
            style={styles.errorDismissButton}
            onPress={() => dispatch(clearError())}
          >
            <Text style={styles.errorDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Pairing Instructions Card
  pairingInstructionsCard: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#3498db',
    alignItems: 'flex-start',
  },
  pairingInstructions: {
    flex: 1,
    marginLeft: 12,
  },
  pairingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pairingStep: {
    fontSize: 13,
    color: '#34495e',
    marginBottom: 4,
    fontWeight: '500',
  },
  pairingSubStep: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
    marginLeft: 8,
  },
  
  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4a7c59',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  statusDeviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statusBattery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBatteryText: {
    fontSize: 14,
    color: '#4a7c59',
    marginLeft: 4,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  disconnectButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // No Device Card
  noDeviceCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noDeviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  noDeviceSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  
  // Permission Card
  permissionCard: {
    backgroundColor: '#fef9e7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f39c12',
    marginLeft: 8,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Actions Container
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButton: {
    backgroundColor: '#4a7c59',
  },
  mobileButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Devices Container
  devicesContainer: {
    marginBottom: 16,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  devicesList: {
    maxHeight: 300,
  },
  
  // Device Card
  deviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deviceType: {
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  deviceSignal: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryLevel: {
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
  },
  
  // Connect Button
  connectButton: {
    backgroundColor: '#4a7c59',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#28a745',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Error Card
  errorCard: {
    backgroundColor: '#fdeded',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#c0392b',
    marginLeft: 8,
    marginRight: 12,
  },
  errorDismissButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  errorDismissText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default GarminConnectionSection;