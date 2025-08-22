import { BleManager, Device, Characteristic, Service } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Garmin device and connection types
export interface GarminDevice {
  id: string;
  name: string;
  rssi?: number;
  isConnected: boolean;
  batteryLevel?: number;
  firmwareVersion?: string;
  modelNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  hardwareRevision?: string;
  softwareRevision?: string;
  lastSeen: number;
  deviceType?: 'forerunner' | 'watch' | 'fitness_tracker' | 'unknown';
}

export interface MotionData {
  timestamp: number;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope?: {
    x: number;
    y: number;
    z: number;
  };
  magnetometer?: {
    x: number;
    y: number;
    z: number;
  };
  activity?: {
    stepCount?: number;
    heartRate?: number;
    cadence?: number;
    power?: number;
  };
}

export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting', 
  Connected = 'connected',
  Discovering = 'discovering',
  Error = 'error'
}

export interface BluetoothPermissions {
  bluetooth: boolean;
  location: boolean;
  bluetoothAdvertise?: boolean; // Android 12+
  bluetoothConnect?: boolean;   // Android 12+
  bluetoothScan?: boolean;      // Android 12+
}

// Standard Bluetooth Low Energy Service UUIDs based on research
export const BLE_SERVICES = {
  // Standard BLE Services
  DEVICE_INFORMATION: '180A',
  BATTERY_SERVICE: '180F',
  GENERIC_ACCESS: '1800',
  GENERIC_ATTRIBUTE: '1801',
  HEART_RATE: '180D',
  
  // Common characteristics
  DEVICE_NAME: '2A00',
  BATTERY_LEVEL: '2A19',
  MANUFACTURER_NAME: '2A29',
  MODEL_NUMBER: '2A24',
  SERIAL_NUMBER: '2A25',
  FIRMWARE_REVISION: '2A26',
  HARDWARE_REVISION: '2A27',
  SOFTWARE_REVISION: '2A28',
  HEART_RATE_MEASUREMENT: '2A37',
  
  // Garmin may use custom UUIDs for motion data - these would need to be discovered
  // Custom services typically use 128-bit UUIDs
  GARMIN_CUSTOM_MOTION: '12345678-1234-1234-1234-123456789ABC', // Placeholder - would need actual UUID
  GARMIN_CUSTOM_FITNESS: '87654321-4321-4321-4321-CBA987654321', // Placeholder - would need actual UUID
};

/**
 * GarminBluetoothService - Manages Bluetooth Low Energy connections to Garmin devices
 * 
 * Key capabilities:
 * - Device discovery and filtering for Garmin devices
 * - Connection management with auto-reconnect
 * - Battery level monitoring
 * - Device information retrieval
 * - Motion data subscription (when available)
 * - Cross-platform permission handling
 */
export class GarminBluetoothService {
  private bleManager: BleManager;
  private connectedDevices: Map<string, Device> = new Map();
  private discoveredDevices: Map<string, GarminDevice> = new Map();
  private isScanning: boolean = false;
  private connectionStatus: ConnectionStatus = ConnectionStatus.Disconnected;
  private selectedDeviceId: string | null = null;

  // Callbacks for service events
  private deviceDiscoveryCallbacks: Array<(devices: GarminDevice[]) => void> = [];
  private connectionStatusCallbacks: Array<(status: ConnectionStatus, deviceId?: string) => void> = [];
  private batteryLevelCallbacks: Array<(level: number, deviceId: string) => void> = [];
  private motionDataCallbacks: Array<(data: MotionData, deviceId: string) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];

  // Auto-reconnect settings
  private autoReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // 2 seconds

  // Scanning settings
  private scanTimeout: number = 10000; // 10 seconds
  private scanTimer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🔵 GarminBluetoothService: Initializing Bluetooth Low Energy service');
    this.bleManager = new BleManager();
    this.setupBleManager();
  }

  private setupBleManager(): void {
    // Monitor BLE state changes
    this.bleManager.onStateChange((state) => {
      console.log(`🔵 GarminBluetoothService: BLE state changed to ${state}`);
      if (state === 'PoweredOn') {
        console.log('✅ GarminBluetoothService: Bluetooth is ready for use');
      } else {
        console.log(`⚠️ GarminBluetoothService: Bluetooth not available: ${state}`);
        this.notifyError(`Bluetooth is ${state}. Please enable Bluetooth.`);
      }
    }, true);

    // Monitor device disconnections
    this.bleManager.onDeviceDisconnected((error: any, device: any) => {
      if (error) {
        console.error('🔴 GarminBluetoothService: Device disconnection error:', error);
        this.notifyError(`Device disconnected with error: ${error.message}`);
      } else if (device) {
        console.log(`🟡 GarminBluetoothService: Device ${device.name || device.id} disconnected`);
        this.handleDeviceDisconnection(device);
      }
    });
  }

  /**
   * Request all necessary permissions for Bluetooth operation
   * Handles both iOS and Android permission requirements
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔵 GarminBluetoothService: Requesting Bluetooth permissions...');

      if (Platform.OS === 'android') {
        return await this.requestAndroidPermissions();
      } else {
        return await this.requestIOSPermissions();
      }
    } catch (error) {
      console.error('🔴 GarminBluetoothService: Error requesting permissions:', error);
      this.notifyError('Failed to request Bluetooth permissions');
      return false;
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    // Android 12 (API 31) and above require new permissions
    const androidVersion = Platform.Version as number;
    console.log(`🔵 GarminBluetoothService: Android version ${androidVersion}, requesting appropriate permissions`);

    if (androidVersion >= 31) {
      // Android 12+ permissions
      const permissions = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ];

      const results = await Promise.all(permissions.map(permission => request(permission)));
      const allGranted = results.every(result => result === RESULTS.GRANTED);

      if (allGranted) {
        console.log('✅ GarminBluetoothService: Android 12+ permissions granted');
        return true;
      } else {
        console.log('❌ GarminBluetoothService: Some Android 12+ permissions denied');
        Alert.alert(
          'Bluetooth Permissions Required',
          'CaddieAI needs Bluetooth and location permissions to connect to your Garmin device. Please enable these in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openAppSettings() }
          ]
        );
        return false;
      }
    } else {
      // Pre-Android 12 permissions
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'CaddieAI needs location access to scan for Bluetooth devices.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );

      if (locationPermission === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ GarminBluetoothService: Android location permission granted');
        return true;
      } else {
        console.log('❌ GarminBluetoothService: Android location permission denied');
        return false;
      }
    }
  }

  private async requestIOSPermissions(): Promise<boolean> {
    // iOS permissions are handled automatically by the BLE manager
    // Check if Bluetooth is available
    const state = await this.bleManager.state();
    if (state === 'PoweredOn') {
      console.log('✅ GarminBluetoothService: iOS Bluetooth available');
      return true;
    } else {
      console.log(`❌ GarminBluetoothService: iOS Bluetooth not available: ${state}`);
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth to connect to your Garmin device.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  private openAppSettings(): void {
    if (Platform.OS === 'android') {
      // Open Android app settings (would require react-native-open-settings or similar)
      console.log('🔵 GarminBluetoothService: Opening Android app settings...');
    } else {
      // Open iOS settings (would require Linking.openURL)
      console.log('🔵 GarminBluetoothService: Opening iOS settings...');
    }
  }

  /**
   * Scan for Garmin devices with intelligent filtering
   * Returns discovered devices through callback
   */
  async scanForDevices(timeoutMs: number = this.scanTimeout): Promise<GarminDevice[]> {
    try {
      console.log(`🔵 GarminBluetoothService: Starting device scan for ${timeoutMs}ms...`);

      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Bluetooth permissions not granted');
      }

      // Check if already scanning
      if (this.isScanning) {
        console.log('🟡 GarminBluetoothService: Already scanning, stopping previous scan');
        this.stopScanning();
      }

      // Clear previous discoveries
      this.discoveredDevices.clear();
      this.isScanning = true;

      // Start scanning for ALL devices (no service filtering) to catch all Garmin devices
      this.bleManager.startDeviceScan(
        null, // Scan for ALL devices - no service filtering
        { 
          allowDuplicates: true,  // Allow duplicates to catch devices that might be missed
          scanMode: 'LowLatency'  // Use low latency for better detection
        },
        (error, device) => {
          if (error) {
            console.error('🔴 GarminBluetoothService: Scan error:', error);
            this.stopScanning();
            this.notifyError(`Scan error: ${error.message}`);
            return;
          }

          if (device) {
            // Log ALL discovered devices for debugging
            console.log(`🔍 GarminBluetoothService: Discovered device - Name: "${device.name || 'null'}", LocalName: "${device.localName || 'null'}", ID: ${device.id}, RSSI: ${device.rssi}`);
            if (device.serviceUUIDs && device.serviceUUIDs.length > 0) {
              console.log(`  📋 Services: [${device.serviceUUIDs.join(', ')}]`);
            }
            if (device.manufacturerData) {
              console.log(`  🏭 Manufacturer Data: ${device.manufacturerData}`);
            }
            
            if (this.isGarminDevice(device)) {
              console.log(`✅ GarminBluetoothService: Found potential Garmin device: ${device.name || device.localName || 'Unknown'}`);
              this.handleDeviceDiscovered(device);
            } else {
              console.log(`❌ GarminBluetoothService: Device "${device.name || device.localName || 'Unknown'}" filtered out (not recognized as Garmin)`);
            }
          }
        }
      );

      // Set scan timeout
      this.scanTimer = setTimeout(() => {
        this.stopScanning();
        console.log(`🔵 GarminBluetoothService: Scan completed after ${timeoutMs}ms. Found ${this.discoveredDevices.size} devices`);
      }, timeoutMs);

      // Return promise that resolves when scan completes
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(Array.from(this.discoveredDevices.values()));
        }, timeoutMs + 100); // Small buffer
      });

    } catch (error) {
      console.error('🔴 GarminBluetoothService: Failed to start device scan:', error);
      this.isScanning = false;
      this.notifyError(`Failed to scan for devices: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Enhanced intelligent filtering to identify Garmin devices
   * Based on device name patterns, manufacturer data, and partial matching
   */
  private isGarminDevice(device: Device): boolean {
    const deviceName = device.name?.toLowerCase() || '';
    const localName = device.localName?.toLowerCase() || '';
    const allNames = `${deviceName} ${localName}`.trim();

    console.log(`🔍 GarminBluetoothService: Checking device - Name: "${device.name}", LocalName: "${device.localName}"`);

    // Known Garmin device name patterns (expanded list)
    const garminPatterns = [
      'garmin',
      'forerunner',
      'fenix',
      'vivoactive',
      'vivosmart',
      'vivomove',
      'instinct',
      'approach',
      'edge',
      'fr55',     // Forerunner 55 short name
      'fr45',     // Other Forerunner models
      'fr235',
      'fr245',
      'fr645',
      'fr745',
      'fr945',
      'fr955',
      'fr965',
      'epix',
      'tactix',
      'marq',
      'enduro',
      'descent',
    ];

    // Check exact pattern matches first
    const exactMatch = garminPatterns.some(pattern => {
      const matches = deviceName.includes(pattern) || localName.includes(pattern);
      if (matches) {
        console.log(`✅ GarminBluetoothService: Device matches exact pattern "${pattern}"`);
      }
      return matches;
    });

    if (exactMatch) {
      return true;
    }

    // Check for numeric patterns that might indicate Forerunner models
    // Many Garmin devices may advertise with just numbers (e.g., "55" for Forerunner 55)
    const numericPatterns = [
      /^\d{2,3}$/,        // 2-3 digit numbers (55, 245, 945, etc.)
      /^fr\d{2,3}$/,      // fr + numbers
      /forerunner.*\d+/,   // forerunner with numbers
      /garmin.*\d+/,       // garmin with numbers
    ];

    const numericMatch = numericPatterns.some(pattern => {
      const matches = pattern.test(deviceName) || pattern.test(localName);
      if (matches) {
        console.log(`✅ GarminBluetoothService: Device matches numeric pattern "${pattern}"`);
      }
      return matches;
    });

    if (numericMatch) {
      return true;
    }

    // Check manufacturer data for Garmin identifier
    if (device.manufacturerData) {
      try {
        // Garmin's company identifier is 0x008D (141 decimal)
        const manufacturerBase64 = device.manufacturerData;
        console.log(`🏭 GarminBluetoothService: Checking manufacturer data: ${manufacturerBase64}`);
        
        // Decode Base64 to binary data
        const manufacturerBuffer = Buffer.from(manufacturerBase64, 'base64');
        console.log(`🔍 GarminBluetoothService: Decoded manufacturer buffer length: ${manufacturerBuffer.length}`);
        
        if (manufacturerBuffer.length >= 2) {
          // Read first 2 bytes as company ID (little endian)
          const companyId = manufacturerBuffer.readUInt16LE(0);
          console.log(`🏢 GarminBluetoothService: Company ID: 0x${companyId.toString(16).toUpperCase()} (${companyId})`);
          
          // Garmin's official Bluetooth company identifier is 0x008D (141 decimal)
          if (companyId === 0x008D || companyId === 141) {
            console.log(`✅ GarminBluetoothService: Device matches Garmin company ID!`);
            return true;
          }
          
          // Also check for other potential Garmin-related IDs or common values
          // Some devices might use different encodings or have additional data
          const potentialGarminIds = [0x008D, 141, 0x8D00]; // Different endianness possibilities
          if (potentialGarminIds.includes(companyId)) {
            console.log(`✅ GarminBluetoothService: Device matches potential Garmin company ID variant!`);
            return true;
          }
          
          // Log the raw bytes for debugging
          const hexBytes = Array.from(manufacturerBuffer.slice(0, Math.min(8, manufacturerBuffer.length)))
            .map(b => `0x${b.toString(16).padStart(2, '0')}`)
            .join(' ');
          console.log(`🔍 GarminBluetoothService: First bytes: ${hexBytes}`);
        }
        
        // Fallback: Check if manufacturer data contains 'Garmin' string
        const manufacturerString = manufacturerBuffer.toString('utf8');
        if (manufacturerString.toLowerCase().includes('garmin')) {
          console.log(`✅ GarminBluetoothService: Device contains 'Garmin' in manufacturer data!`);
          return true;
        }
        
      } catch (error) {
        console.warn('⚠️ GarminBluetoothService: Error parsing manufacturer data:', error);
      }
    }

    // Special handling for unnamed devices with strong signal (could be Garmin in non-discoverable mode)
    if (!device.name && !device.localName && device.manufacturerData) {
      const rssi = device.rssi || -100;
      if (rssi > -70) { // Strong signal, close device
        console.log(`⚠️ GarminBluetoothService: Strong unnamed device (RSSI: ${rssi}) - might be Garmin in non-discoverable mode`);
        console.log(`   Consider putting your Garmin device in pairing mode`);
        console.log(`   Manufacturer data present but not recognized as Garmin`);
        
        // For debugging: Try to identify the manufacturer by common patterns
        try {
          const manufacturerBuffer = Buffer.from(device.manufacturerData, 'base64');
          if (manufacturerBuffer.length >= 2) {
            const companyId = manufacturerBuffer.readUInt16LE(0);
            // Log known company IDs for reference
            const knownCompanies: { [key: number]: string } = {
              0x004C: 'Apple',
              0x0006: 'Microsoft',
              0x00E0: 'Google',
              0x008D: 'Garmin',
              0x0087: 'Garmin (alt)',
            };
            const companyName = knownCompanies[companyId] || 'Unknown';
            console.log(`   Manufacturer: ${companyName} (0x${companyId.toString(16).toUpperCase()})`);
          }
        } catch (error) {
          console.warn('   Could not identify manufacturer');
        }
      }
    }
    
    // Log why device was filtered out
    console.log(`❌ GarminBluetoothService: Device "${device.name || device.localName || 'Unknown'}" does not match Garmin patterns`);
    console.log(`   Checked names: "${allNames}"`);
    console.log(`   Has manufacturer data: ${!!device.manufacturerData}`);
    console.log(`   RSSI: ${device.rssi || 'unknown'}`);
    
    return false;
  }

  private handleDeviceDiscovered(device: Device): void {
    const garminDevice: GarminDevice = {
      id: device.id,
      name: device.name || 'Unknown Garmin Device',
      rssi: device.rssi || undefined,
      isConnected: false,
      lastSeen: Date.now(),
      deviceType: this.determineDeviceType(device.name || ''),
    };

    this.discoveredDevices.set(device.id, garminDevice);

    // Notify discovery callbacks
    this.deviceDiscoveryCallbacks.forEach(callback => {
      try {
        callback(Array.from(this.discoveredDevices.values()));
      } catch (error) {
        console.error('🔴 GarminBluetoothService: Error in device discovery callback:', error);
      }
    });
  }

  private determineDeviceType(deviceName: string): GarminDevice['deviceType'] {
    const name = deviceName.toLowerCase();
    
    if (name.includes('forerunner') || name.includes('fr')) {
      return 'forerunner';
    } else if (name.includes('fenix') || name.includes('instinct') || name.includes('approach')) {
      return 'watch';
    } else if (name.includes('vivo')) {
      return 'fitness_tracker';
    }
    
    return 'unknown';
  }

  /**
   * Stop device scanning
   */
  stopScanning(): void {
    if (this.isScanning) {
      console.log('🔵 GarminBluetoothService: Stopping device scan');
      this.bleManager.stopDeviceScan();
      this.isScanning = false;
      
      if (this.scanTimer) {
        clearTimeout(this.scanTimer);
        this.scanTimer = null;
      }
    }
  }

  /**
   * Connect to a specific Garmin device
   */
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔵 GarminBluetoothService: Attempting to connect to device ${deviceId}`);

      // Check if device is already connected
      if (this.connectedDevices.has(deviceId)) {
        console.log(`🟡 GarminBluetoothService: Device ${deviceId} already connected`);
        return true;
      }

      // Update connection status
      this.setConnectionStatus(ConnectionStatus.Connecting, deviceId);
      this.selectedDeviceId = deviceId;

      // Stop scanning if active
      this.stopScanning();

      // Connect to device with timeout
      const device = await this.bleManager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 512, // Request larger MTU for better throughput
        timeout: 10000,  // 10 second timeout
      });

      console.log(`✅ GarminBluetoothService: Connected to ${device.name || device.id}`);

      // Discover services and characteristics
      await this.discoverDeviceServices(device);

      // Store connected device
      this.connectedDevices.set(deviceId, device);
      
      // Update device status
      const garminDevice = this.discoveredDevices.get(deviceId);
      if (garminDevice) {
        garminDevice.isConnected = true;
        this.discoveredDevices.set(deviceId, garminDevice);
      }

      // Update connection status
      this.setConnectionStatus(ConnectionStatus.Connected, deviceId);

      // Start monitoring services (battery, etc.)
      this.startDeviceMonitoring(device);

      this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
      return true;

    } catch (error) {
      console.error(`🔴 GarminBluetoothService: Failed to connect to device ${deviceId}:`, error);
      this.setConnectionStatus(ConnectionStatus.Error, deviceId);
      this.notifyError(`Failed to connect to device: ${(error as Error).message}`);
      
      // Attempt auto-reconnect if enabled
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(deviceId);
      }
      
      return false;
    }
  }

  /**
   * Discover and log all services and characteristics for a connected device
   */
  private async discoverDeviceServices(device: Device): Promise<void> {
    try {
      console.log(`🔵 GarminBluetoothService: Discovering services for ${device.name || device.id}...`);
      this.setConnectionStatus(ConnectionStatus.Discovering, device.id);

      // Discover all services
      const services = await device.discoverAllServicesAndCharacteristics();
      const serviceList = await services.services();

      console.log(`📱 GarminBluetoothService: Found ${serviceList.length} services on device ${device.name}`);

      for (const service of serviceList) {
        console.log(`  📋 Service: ${service.uuid}`);
        
        try {
          const characteristics = await service.characteristics();
          for (const characteristic of characteristics) {
            console.log(`    🔧 Characteristic: ${characteristic.uuid} (${characteristic.isReadable ? 'R' : ''}${(characteristic as any).isWritable ? 'W' : ''}${characteristic.isNotifiable ? 'N' : ''})`);
          }
        } catch (error) {
          console.warn(`⚠️ GarminBluetoothService: Could not read characteristics for service ${service.uuid}`);
        }
      }

      // Update device information from standard services
      await this.readDeviceInformation(services);

    } catch (error) {
      console.error('🔴 GarminBluetoothService: Error discovering device services:', error);
      throw error;
    }
  }

  /**
   * Read device information from standard BLE services
   */
  private async readDeviceInformation(device: Device): Promise<void> {
    try {
      console.log(`🔵 GarminBluetoothService: Reading device information...`);

      // Read device information service characteristics
      const deviceInfoPromises = [
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.MANUFACTURER_NAME),
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.MODEL_NUMBER),
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.SERIAL_NUMBER),
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.FIRMWARE_REVISION),
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.HARDWARE_REVISION),
        this.readCharacteristic(device, BLE_SERVICES.DEVICE_INFORMATION, BLE_SERVICES.SOFTWARE_REVISION),
      ];

      const [
        manufacturer,
        modelNumber,
        serialNumber,
        firmwareRevision,
        hardwareRevision,
        softwareRevision
      ] = await Promise.allSettled(deviceInfoPromises);

      // Update device information in our stored device
      const garminDevice = this.discoveredDevices.get(device.id);
      if (garminDevice) {
        if (manufacturer.status === 'fulfilled') garminDevice.manufacturer = manufacturer.value || undefined;
        if (modelNumber.status === 'fulfilled') garminDevice.modelNumber = modelNumber.value || undefined;
        if (serialNumber.status === 'fulfilled') garminDevice.serialNumber = serialNumber.value || undefined;
        if (firmwareRevision.status === 'fulfilled') garminDevice.firmwareVersion = firmwareRevision.value || undefined;
        if (hardwareRevision.status === 'fulfilled') garminDevice.hardwareRevision = hardwareRevision.value || undefined;
        if (softwareRevision.status === 'fulfilled') garminDevice.softwareRevision = softwareRevision.value || undefined;

        this.discoveredDevices.set(device.id, garminDevice);
        console.log(`📱 GarminBluetoothService: Updated device info for ${garminDevice.name}:`, {
          manufacturer: garminDevice.manufacturer,
          model: garminDevice.modelNumber,
          firmware: garminDevice.firmwareVersion
        });
      }

    } catch (error) {
      console.warn('⚠️ GarminBluetoothService: Could not read all device information:', error);
      // Don't throw here - device info is nice-to-have, not critical
    }
  }

  /**
   * Helper to read a characteristic value and decode as string
   */
  private async readCharacteristic(device: Device, serviceUUID: string, characteristicUUID: string): Promise<string | null> {
    try {
      const characteristic = await device.readCharacteristicForService(serviceUUID, characteristicUUID);
      if (characteristic.value) {
        // Decode base64 value to string
        const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
        return decoded.trim();
      }
      return null;
    } catch (error) {
      // Many characteristics may not be available - don't log as error
      return null;
    }
  }

  /**
   * Start monitoring device services (battery level, etc.)
   */
  private async startDeviceMonitoring(device: Device): void {
    try {
      console.log(`🔵 GarminBluetoothService: Starting device monitoring for ${device.name}`);

      // Monitor battery level if available
      this.monitorBatteryLevel(device);

      // Monitor for motion data (custom service - may not be available)
      // This would need to be implemented based on actual Garmin service specifications
      // await this.subscribeToMotionData(device);

    } catch (error) {
      console.warn('⚠️ GarminBluetoothService: Could not start all monitoring services:', error);
      // Don't throw - partial monitoring is acceptable
    }
  }

  /**
   * Monitor battery level from device
   */
  private async monitorBatteryLevel(device: Device): Promise<void> {
    try {
      // Try to read battery level immediately
      const batteryLevel = await this.readBatteryLevel(device);
      if (batteryLevel !== null) {
        console.log(`🔋 GarminBluetoothService: Device battery level: ${batteryLevel}%`);
        
        // Update stored device
        const garminDevice = this.discoveredDevices.get(device.id);
        if (garminDevice) {
          garminDevice.batteryLevel = batteryLevel;
          this.discoveredDevices.set(device.id, garminDevice);
        }

        // Notify battery callbacks
        this.batteryLevelCallbacks.forEach(callback => {
          try {
            callback(batteryLevel, device.id);
          } catch (error) {
            console.error('🔴 GarminBluetoothService: Error in battery level callback:', error);
          }
        });
      }

      // Set up battery level notifications if supported
      try {
        await device.monitorCharacteristicForService(
          BLE_SERVICES.BATTERY_SERVICE,
          BLE_SERVICES.BATTERY_LEVEL,
          (error, characteristic) => {
            if (error) {
              console.warn('⚠️ GarminBluetoothService: Battery monitoring error:', error);
              return;
            }

            if (characteristic?.value) {
              const batteryLevel = Buffer.from(characteristic.value, 'base64').readUInt8(0);
              console.log(`🔋 GarminBluetoothService: Battery level updated: ${batteryLevel}%`);
              
              // Update stored device
              const garminDevice = this.discoveredDevices.get(device.id);
              if (garminDevice) {
                garminDevice.batteryLevel = batteryLevel;
                this.discoveredDevices.set(device.id, garminDevice);
              }

              // Notify callbacks
              this.batteryLevelCallbacks.forEach(callback => {
                try {
                  callback(batteryLevel, device.id);
                } catch (error) {
                  console.error('🔴 GarminBluetoothService: Error in battery level callback:', error);
                }
              });
            }
          }
        );
        console.log('✅ GarminBluetoothService: Battery level monitoring started');
      } catch (error) {
        console.warn('⚠️ GarminBluetoothService: Could not set up battery level notifications:', error);
      }

    } catch (error) {
      console.warn('⚠️ GarminBluetoothService: Could not monitor battery level:', error);
    }
  }

  /**
   * Read current battery level from device
   */
  private async readBatteryLevel(device: Device): Promise<number | null> {
    try {
      const characteristic = await device.readCharacteristicForService(
        BLE_SERVICES.BATTERY_SERVICE,
        BLE_SERVICES.BATTERY_LEVEL
      );
      
      if (characteristic.value) {
        const batteryLevel = Buffer.from(characteristic.value, 'base64').readUInt8(0);
        return batteryLevel;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ GarminBluetoothService: Could not read battery level:', error);
      return null;
    }
  }

  /**
   * Disconnect from device
   */
  async disconnectDevice(deviceId?: string): Promise<void> {
    try {
      const targetDeviceId = deviceId || this.selectedDeviceId;
      if (!targetDeviceId) {
        console.log('🟡 GarminBluetoothService: No device to disconnect');
        return;
      }

      console.log(`🔵 GarminBluetoothService: Disconnecting from device ${targetDeviceId}`);

      const device = this.connectedDevices.get(targetDeviceId);
      if (device) {
        await device.cancelConnection();
        this.connectedDevices.delete(targetDeviceId);
      }

      // Update device status
      const garminDevice = this.discoveredDevices.get(targetDeviceId);
      if (garminDevice) {
        garminDevice.isConnected = false;
        this.discoveredDevices.set(targetDeviceId, garminDevice);
      }

      // Update connection status
      this.setConnectionStatus(ConnectionStatus.Disconnected, targetDeviceId);
      
      if (targetDeviceId === this.selectedDeviceId) {
        this.selectedDeviceId = null;
      }

      console.log('✅ GarminBluetoothService: Device disconnected successfully');

    } catch (error) {
      console.error('🔴 GarminBluetoothService: Error disconnecting device:', error);
      this.notifyError(`Failed to disconnect device: ${(error as Error).message}`);
    }
  }

  /**
   * Handle automatic device disconnection
   */
  private handleDeviceDisconnection(device: Device): void {
    console.log(`🟡 GarminBluetoothService: Handling disconnection for ${device.name || device.id}`);

    // Remove from connected devices
    this.connectedDevices.delete(device.id);

    // Update device status
    const garminDevice = this.discoveredDevices.get(device.id);
    if (garminDevice) {
      garminDevice.isConnected = false;
      this.discoveredDevices.set(device.id, garminDevice);
    }

    // Update connection status
    this.setConnectionStatus(ConnectionStatus.Disconnected, device.id);

    // Clear selected device if it was this one
    if (this.selectedDeviceId === device.id) {
      this.selectedDeviceId = null;
    }

    // Attempt auto-reconnect if enabled
    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect(device.id);
    }
  }

  /**
   * Schedule automatic reconnection attempt
   */
  private scheduleReconnect(deviceId: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 GarminBluetoothService: Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`🔄 GarminBluetoothService: Attempting auto-reconnect to ${deviceId}`);
        await this.connectToDevice(deviceId);
      } else {
        console.log(`❌ GarminBluetoothService: Max reconnect attempts reached for ${deviceId}`);
        this.reconnectAttempts = 0;
      }
    }, delay);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get currently connected devices
   */
  getConnectedDevices(): GarminDevice[] {
    return Array.from(this.discoveredDevices.values()).filter(device => device.isConnected);
  }

  /**
   * Get discovered devices
   */
  getDiscoveredDevices(): GarminDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Get selected device
   */
  getSelectedDevice(): GarminDevice | null {
    return this.selectedDeviceId ? this.discoveredDevices.get(this.selectedDeviceId) || null : null;
  }

  // Subscription methods for service events

  onDeviceDiscovery(callback: (devices: GarminDevice[]) => void): () => void {
    this.deviceDiscoveryCallbacks.push(callback);
    return () => {
      const index = this.deviceDiscoveryCallbacks.indexOf(callback);
      if (index > -1) {
        this.deviceDiscoveryCallbacks.splice(index, 1);
      }
    };
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus, deviceId?: string) => void): () => void {
    this.connectionStatusCallbacks.push(callback);
    return () => {
      const index = this.connectionStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionStatusCallbacks.splice(index, 1);
      }
    };
  }

  onBatteryLevelUpdate(callback: (level: number, deviceId: string) => void): () => void {
    this.batteryLevelCallbacks.push(callback);
    return () => {
      const index = this.batteryLevelCallbacks.indexOf(callback);
      if (index > -1) {
        this.batteryLevelCallbacks.splice(index, 1);
      }
    };
  }

  onMotionData(callback: (data: MotionData, deviceId: string) => void): () => void {
    this.motionDataCallbacks.push(callback);
    return () => {
      const index = this.motionDataCallbacks.indexOf(callback);
      if (index > -1) {
        this.motionDataCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Private helper methods

  private setConnectionStatus(status: ConnectionStatus, deviceId?: string): void {
    this.connectionStatus = status;
    console.log(`🔵 GarminBluetoothService: Connection status changed to ${status}${deviceId ? ` for device ${deviceId}` : ''}`);

    this.connectionStatusCallbacks.forEach(callback => {
      try {
        callback(status, deviceId);
      } catch (error) {
        console.error('🔴 GarminBluetoothService: Error in connection status callback:', error);
      }
    });
  }

  private notifyError(error: string): void {
    console.error(`🔴 GarminBluetoothService: ${error}`);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('🔴 GarminBluetoothService: Error in error callback:', err);
      }
    });
  }

  /**
   * Clean up service resources
   */
  cleanup(): void {
    console.log('🔵 GarminBluetoothService: Cleaning up service resources');
    
    // Stop scanning
    this.stopScanning();
    
    // Disconnect all devices
    this.connectedDevices.forEach(async (device) => {
      try {
        await device.cancelConnection();
      } catch (error) {
        console.warn('⚠️ GarminBluetoothService: Error disconnecting device during cleanup:', error);
      }
    });
    
    // Clear all data
    this.connectedDevices.clear();
    this.discoveredDevices.clear();
    this.selectedDeviceId = null;
    
    // Clear callbacks
    this.deviceDiscoveryCallbacks = [];
    this.connectionStatusCallbacks = [];
    this.batteryLevelCallbacks = [];
    this.motionDataCallbacks = [];
    this.errorCallbacks = [];
    
    // Destroy BLE manager
    this.bleManager.destroy();
  }
}

// Export singleton instance
let _garminBluetoothService: GarminBluetoothService | null = null;

export const getGarminBluetoothService = (): GarminBluetoothService => {
  if (!_garminBluetoothService) {
    _garminBluetoothService = new GarminBluetoothService();
  }
  return _garminBluetoothService;
};

export const garminBluetoothService = getGarminBluetoothService();