import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
}) => (
  <View style={styles.container}>
    <Icon name="error-outline" size={64} color="#ff6b6b" />
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>
      {error?.message || 'An unexpected error occurred'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={resetError}>
      <Icon name="refresh" size={20} color="#fff" />
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
    {__DEV__ && error && (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>{error.stack}</Text>
      </View>
    )}
  </View>
);

// Specialized error boundary for map components
export const MapErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackComponent={MapErrorFallback}
    onError={(error, errorInfo) => {
      console.error('Map Error:', error, errorInfo);
      // Could send to crash reporting service here
    }}
  >
    {children}
  </ErrorBoundary>
);

const MapErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ resetError }) => (
  <View style={styles.mapErrorContainer}>
    <Icon name="map-off" size={48} color="#ff6b6b" />
    <Text style={styles.mapErrorTitle}>Map Error</Text>
    <Text style={styles.mapErrorMessage}>
      The map encountered an error and couldn't load properly.
    </Text>
    <TouchableOpacity style={styles.mapRetryButton} onPress={resetError}>
      <Icon name="refresh" size={16} color="#4a7c59" />
      <Text style={styles.mapRetryText}>Reload Map</Text>
    </TouchableOpacity>
  </View>
);

// Specialized error boundary for voice components
export const VoiceErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackComponent={VoiceErrorFallback}
    onError={(error, errorInfo) => {
      console.error('Voice AI Error:', error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

const VoiceErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ resetError }) => (
  <View style={styles.voiceErrorContainer}>
    <Icon name="mic-off" size={32} color="#ff6b6b" />
    <Text style={styles.voiceErrorText}>Voice AI Error</Text>
    <TouchableOpacity style={styles.voiceRetryButton} onPress={resetError}>
      <Icon name="refresh" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a7c59',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  
  // Map-specific error styles
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  mapErrorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginTop: 12,
    marginBottom: 8,
  },
  mapErrorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  mapRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a7c59',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  mapRetryText: {
    color: '#4a7c59',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Voice-specific error styles
  voiceErrorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceErrorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
  },
  voiceRetryButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    padding: 6,
  },
});

export default ErrorBoundary;