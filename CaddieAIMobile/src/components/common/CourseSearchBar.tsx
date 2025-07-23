import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
// import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CourseSearchBarProps {
  onSearch: (searchTerm: string) => void;
  onLocationPress?: () => void;
  placeholder?: string;
  style?: ViewStyle;
  showLocationButton?: boolean;
  isLocationLoading?: boolean;
}

export const CourseSearchBar: React.FC<CourseSearchBarProps> = ({
  onSearch,
  onLocationPress,
  placeholder = "Search courses...",
  style,
  showLocationButton = true,
  isLocationLoading = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search functionality
  const debouncedSearch = useCallback((text: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(text.trim());
    }, 500); // 500ms delay

    setDebounceTimer(timer);
  }, [debounceTimer, onSearch]);

  useEffect(() => {
    debouncedSearch(searchText);
    
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchText, debouncedSearch, debounceTimer]);

  const clearSearch = () => {
    setSearchText('');
    onSearch(''); // Immediately clear search
  };

  const handleLocationPress = () => {
    if (!isLocationLoading && onLocationPress) {
      onLocationPress();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        {/* Search Icon */}
        <Icon 
          name="search" 
          size={20} 
          color="#666" 
          style={styles.searchIcon} 
        />
        
        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {/* Clear Button */}
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Button */}
      {showLocationButton && (
        <TouchableOpacity
          style={[
            styles.locationButton,
            isLocationLoading && styles.locationButtonLoading
          ]}
          onPress={handleLocationPress}
          disabled={isLocationLoading}
          activeOpacity={0.8}
        >
          <Icon 
            name={isLocationLoading ? "hourglass-empty" : "my-location"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.locationButtonText}>
            {isLocationLoading ? "Finding..." : "Near Me"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5530',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    gap: 6,
  },
  locationButtonLoading: {
    backgroundColor: '#4a7c59',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CourseSearchBar;