/**
 * Quick Actions Widget Component
 * Provides quick access to primary app features from the dashboard
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QuickActionsWidgetProps } from '../../types/dashboard';

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onStartRound,
  onViewCourses,
  onOpenChat,
}) => {
  const renderActionButton = (
    title: string,
    subtitle: string,
    iconName: string,
    onPress: () => void,
    isPrimary: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionContent}>
        <View style={[
          styles.iconContainer,
          isPrimary ? styles.primaryIconContainer : styles.secondaryIconContainer,
        ]}>
          <Icon
            name={iconName}
            size={24}
            color={isPrimary ? '#ffffff' : '#2c5530'}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.actionTitle,
              isPrimary ? styles.primaryTitle : styles.secondaryTitle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {title}
          </Text>
          <Text 
            style={[
              styles.actionSubtitle,
              isPrimary ? styles.primarySubtitle : styles.secondarySubtitle,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        
        <Icon
          name="chevron-right"
          size={20}
          color={isPrimary ? '#ffffff' : '#4a7c59'}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="dashboard" size={20} color="#2c5530" />
          <Text style={styles.title}>Quick Actions</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Primary Action - Start New Round */}
        {renderActionButton(
          'Start New Round',
          'Begin tracking your golf round',
          'play-arrow',
          onStartRound,
          true
        )}

        {/* Secondary Actions Row */}
        <View style={styles.secondaryActionsRow}>
          <View style={styles.secondaryActionWrapper}>
            {renderActionButton(
              'Courses',
              'Explore golf courses',
              'terrain',
              onViewCourses,
              false
            )}
          </View>
          
          <View style={styles.secondaryActionWrapper}>
            {renderActionButton(
              'AI Chat',
              'Get golf advice',
              'chat',
              onOpenChat,
              false
            )}
          </View>
        </View>

        {/* Additional Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Quick Tip</Text>
          <Text style={styles.tipsText}>
            Use the AI Caddie during your round for real-time club recommendations and course strategy advice.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  content: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: '#2c5530',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryIconContainer: {
    backgroundColor: '#e8f5e8',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  primaryTitle: {
    color: '#ffffff',
  },
  secondaryTitle: {
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 12,
  },
  primarySubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondarySubtitle: {
    color: '#6b7280',
  },
  chevron: {
    marginLeft: 8,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionWrapper: {
    flex: 1,
  },
  tipsSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
});

export default QuickActionsWidget;
