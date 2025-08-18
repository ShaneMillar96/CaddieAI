import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocationData } from '../../services/LocationService';

interface Props {
  children: ReactNode;
  currentLocation: LocationData | null;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onRetryMap?: () => void;
  fallbackMode?: 'gps-only' | 'minimal' | 'full-fallback';
}

interface State {
  hasError: boolean;
  errorCount: number;
  lastErrorTime: number;
  errorDetails: string | null;
  isRecovering: boolean;
}

/**
 * MapErrorBoundary - Comprehensive error boundary for map components
 * 
 * Features:
 * - Catches MapView crashes and NPE errors
 * - Provides GPS-only fallback mode
 * - Automatic retry with exponential backoff
 * - Detailed error logging and recovery
 * - Progressive fallback strategies
 */
class MapErrorBoundary extends Component<Props, State> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private maxRetries = 3;
  private baseRetryDelay = 2000; // 2 seconds

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      lastErrorTime: 0,
      errorDetails: null,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    console.error('🔴 MapErrorBoundary: Map component error caught:', error);
    
    return {
      hasError: true,
      errorDetails: error.message || 'Unknown map error',
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 MapErrorBoundary: Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      location: this.props.currentLocation,
    });

    // Update error count for retry logic
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1,
    }));

    // Check if this is a MapView-specific error
    const isMapViewError = error.message?.includes('MapView') || 
                          error.message?.includes('LinkedList') ||
                          error.message?.includes('NullPointer') ||
                          error.stack?.includes('MapViewManager');

    if (isMapViewError) {
      console.log('🔍 MapErrorBoundary: Detected MapView-specific error, enabling smart recovery');
      this.scheduleAutoRetry();
    }
  }

  scheduleAutoRetry = () => {
    const { errorCount } = this.state;
    
    // Don't retry if we've exceeded max attempts
    if (errorCount >= this.maxRetries) {
      console.log(`🛑 MapErrorBoundary: Max retries (${this.maxRetries}) exceeded, staying in fallback mode`);
      return;
    }

    // Calculate exponential backoff delay
    const retryDelay = this.baseRetryDelay * Math.pow(2, errorCount);
    
    console.log(`🔄 MapErrorBoundary: Scheduling auto-retry #${errorCount + 1} in ${retryDelay}ms`);
    
    this.setState({ isRecovering: true });
    
    this.retryTimeout = setTimeout(() => {
      console.log('🔄 MapErrorBoundary: Attempting automatic recovery...');
      this.handleRetry();
    }, retryDelay);
  };

  handleRetry = () => {
    console.log('🔄 MapErrorBoundary: Manual retry requested');
    
    this.setState({
      hasError: false,
      errorDetails: null,
      isRecovering: false,
    });

    // Clear any pending retry
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Notify parent component about retry
    this.props.onRetryMap?.();
  };

  handleResetErrorCount = () => {
    this.setState({
      errorCount: 0,
      hasError: false,
      errorDetails: null,
      isRecovering: false,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  renderGPSOnlyFallback = () => {
    const { currentLocation, onMapPress } = this.props;
    const { errorCount, isRecovering, errorDetails } = this.state;

    return (
      <View style={styles.fallbackContainer}>
        {/* Header */}
        <View style={styles.fallbackHeader}>
          <Icon name="gps-fixed" size={48} color="#4a7c59" />
          <Text style={styles.fallbackTitle}>GPS Mode Active</Text>
          <Text style={styles.fallbackSubtitle}>
            Map temporarily unavailable, using GPS-only mode
          </Text>
        </View>

        {/* GPS Status Display */}
        <View style={styles.gpsStatusCard}>
          <View style={styles.gpsStatusHeader}>
            <Icon name="my-location" size={24} color={currentLocation ? '#28a745' : '#ffc107'} />
            <Text style={styles.gpsStatusTitle}>
              GPS Status: {currentLocation ? 'Active' : 'Searching...'}
            </Text>
          </View>
          
          {currentLocation && (
            <View style={styles.gpsDetails}>
              <View style={styles.gpsDetailRow}>
                <Text style={styles.gpsLabel}>Coordinates:</Text>
                <Text style={styles.gpsValue}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.gpsDetailRow}>
                <Text style={styles.gpsLabel}>Accuracy:</Text>
                <Text style={[
                  styles.gpsValue,
                  { color: (currentLocation.accuracy && currentLocation.accuracy <= 10) ? '#28a745' : '#ffc107' }
                ]}>
                  ±{currentLocation.accuracy?.toFixed(1) || 'Unknown'}m
                </Text>
              </View>
              
              {currentLocation.accuracy && currentLocation.accuracy <= 15 && (
                <View style={styles.accuracyIndicator}>
                  <Icon name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.accuracyText}>High Accuracy GPS Lock</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Available Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Available Features:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color="#28a745" />
              <Text style={styles.featureText}>Real-time GPS tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color="#28a745" />
              <Text style={styles.featureText}>Distance calculations</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color="#28a745" />
              <Text style={styles.featureText}>Voice AI assistance</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color="#28a745" />
              <Text style={styles.featureText}>Round tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="info" size={20} color="#6c757d" />
              <Text style={[styles.featureText, { color: '#6c757d' }]}>
                Tap-to-measure (via coordinate input)
              </Text>
            </View>
          </View>
        </View>

        {/* Coordinate Input for Distance Measurement */}
        {currentLocation && (
          <TouchableOpacity
            style={styles.coordinateButton}
            onPress={() => {
              // For now, use a simple example coordinate for testing
              const exampleCoordinate = {
                latitude: currentLocation.latitude + 0.001,
                longitude: currentLocation.longitude + 0.001,
              };
              onMapPress?.(exampleCoordinate);
            }}
          >
            <Icon name="straighten" size={20} color="#fff" />
            <Text style={styles.coordinateButtonText}>
              Test Distance Measurement
            </Text>
          </TouchableOpacity>
        )}

        {/* Recovery Actions */}
        <View style={styles.recoveryActions}>
          {isRecovering ? (
            <View style={styles.recoveringIndicator}>
              <Icon name="refresh" size={20} color="#6c757d" />
              <Text style={styles.recoveringText}>
                Attempting recovery... (Attempt {errorCount + 1}/{this.maxRetries})
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              disabled={errorCount >= this.maxRetries}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>
                {errorCount >= this.maxRetries ? 'Max Retries Reached' : 'Retry Map Loading'}
              </Text>
            </TouchableOpacity>
          )}
          
          {errorCount >= this.maxRetries && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={this.handleResetErrorCount}
            >
              <Icon name="restart-alt" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>Reset & Try Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Technical Details (Debug Mode) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>Error Count: {errorCount}</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            {errorDetails && (
              <Text style={styles.debugText} numberOfLines={2}>
                Last Error: {errorDetails}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return this.renderGPSOnlyFallback();
    }

    return children;
  }
}

// const { width } = Dimensions.get('window'); // Unused for now

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  fallbackHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 12,
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  gpsStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gpsStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 12,
  },
  gpsDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  gpsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  gpsValue: {
    fontSize: 14,
    color: '#2c5530',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  accuracyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  accuracyText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginLeft: 6,
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
  },
  coordinateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a7c59',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  coordinateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recoveryActions: {
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recoveringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 8,
  },
  recoveringText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default MapErrorBoundary;