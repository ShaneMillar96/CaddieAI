import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

/**
 * Global Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('GlobalErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Here you could send error reports to crash reporting service
    // e.g., Crashlytics, Bugsnag, Sentry, etc.
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || error.stack || null
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback component is provided, use it
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Icon name="error" size={64} color="#e53e3e" style={styles.errorIcon} />
            
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            
            <Text style={styles.errorMessage}>
              We're sorry, but an unexpected error occurred. Please try refreshing the app.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info (Dev Mode):</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugStack} numberOfLines={5}>
                    {this.state.errorInfo}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.resetError}
            >
              <Icon name="refresh" size={20} color="#fff" style={styles.retryIcon} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#e53e3e',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  debugStack: {
    fontSize: 10,
    color: '#718096',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GlobalErrorBoundary;