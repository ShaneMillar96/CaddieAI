import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WeatherData } from '../../types/golf';

interface WeatherWidgetProps {
  weather: WeatherData;
  style?: ViewStyle;
  compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  style, 
  compact = false 
}) => {
  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) {
      return 'wb-sunny';
    } else if (condition.includes('cloudy') || condition.includes('overcast')) {
      return 'cloud';
    } else if (condition.includes('partly')) {
      return 'wb-cloudy';
    } else if (condition.includes('rain') || condition.includes('shower')) {
      return 'umbrella';
    } else if (condition.includes('storm') || condition.includes('thunder')) {
      return 'flash-on';
    } else if (condition.includes('snow')) {
      return 'ac-unit';
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return 'blur-on';
    }
    return 'wb-cloudy';
  };

  const getWindDirection = (direction?: string) => {
    if (!direction) return '';
    
    const directions: { [key: string]: string } = {
      'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
      'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
    };
    
    return directions[direction.toUpperCase()] || direction;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 25) return '#FF6B35'; // Hot - Orange
    if (temp >= 15) return '#4CAF50'; // Pleasant - Green
    if (temp >= 5) return '#2196F3';  // Cool - Blue
    return '#9C27B0'; // Cold - Purple
  };

  const getWindStrength = (speed: number) => {
    if (speed < 10) return 'Light';
    if (speed < 20) return 'Moderate';
    if (speed < 30) return 'Strong';
    return 'Very Strong';
  };

  const getHumidityLevel = (humidity: number) => {
    if (humidity < 30) return 'Low';
    if (humidity < 60) return 'Comfortable';
    if (humidity < 80) return 'High';
    return 'Very High';
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Icon 
          name={getWeatherIcon(weather.conditions || '')} 
          size={24} 
          color="#2c5530" 
        />
        <Text style={styles.compactTemp}>
          {Math.round(weather.temperature || 0)}°C
        </Text>
        <View style={styles.compactWind}>
          <Icon name="air" size={16} color="#666" />
          <Text style={styles.compactWindText}>
            {weather.windSpeed || 0} km/h
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Icon 
          name={getWeatherIcon(weather.conditions || '')} 
          size={32} 
          color="#2c5530" 
        />
        <View style={styles.mainInfo}>
          <Text style={[
            styles.temperature, 
            { color: getTemperatureColor(weather.temperature || 0) }
          ]}>
            {Math.round(weather.temperature || 0)}°C
          </Text>
          <Text style={styles.conditions}>
            {weather.conditions || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        {/* Wind */}
        <View style={styles.detailItem}>
          <View style={styles.detailHeader}>
            <Icon name="air" size={18} color="#666" />
            <Text style={styles.detailLabel}>Wind</Text>
          </View>
          <Text style={styles.detailValue}>
            {weather.windSpeed || 0} km/h
          </Text>
          <Text style={styles.detailSubValue}>
            {getWindDirection(weather.windDirection)} {getWindStrength(weather.windSpeed || 0)}
          </Text>
        </View>

        {/* Humidity */}
        <View style={styles.detailItem}>
          <View style={styles.detailHeader}>
            <Icon name="opacity" size={18} color="#666" />
            <Text style={styles.detailLabel}>Humidity</Text>
          </View>
          <Text style={styles.detailValue}>
            {weather.humidity || 0}%
          </Text>
          <Text style={styles.detailSubValue}>
            {getHumidityLevel(weather.humidity || 0)}
          </Text>
        </View>

        {/* Precipitation */}
        <View style={styles.detailItem}>
          <View style={styles.detailHeader}>
            <Icon name="umbrella" size={18} color="#666" />
            <Text style={styles.detailLabel}>Rain</Text>
          </View>
          <Text style={styles.detailValue}>
            {weather.precipitation || 0}mm
          </Text>
          <Text style={styles.detailSubValue}>
            {(weather.precipitation || 0) > 0 ? 'Active' : 'None'}
          </Text>
        </View>
      </View>

      {/* Playing Conditions */}
      <View style={styles.playingConditions}>
        <Text style={styles.playingLabel}>Playing Conditions</Text>
        <Text style={styles.playingText}>
          {getPlayingConditionsText(weather)}
        </Text>
      </View>
    </View>
  );
};

const getPlayingConditionsText = (weather: WeatherData): string => {
  const temp = weather.temperature || 0;
  const wind = weather.windSpeed || 0;
  const rain = weather.precipitation || 0;

  if (rain > 5) {
    return "⚠️ Heavy rain - Consider postponing your round";
  } else if (rain > 0) {
    return "🌧️ Light rain - Pack waterproofs and extra towels";
  } else if (wind > 25) {
    return "💨 Very windy - Ball flight will be significantly affected";
  } else if (wind > 15) {
    return "🌬️ Breezy conditions - Adjust club selection for wind";
  } else if (temp < 5) {
    return "❄️ Cold weather - Layer up and allow extra warm-up time";
  } else if (temp > 30) {
    return "☀️ Hot conditions - Stay hydrated and seek shade";
  } else if (temp >= 15 && temp <= 25 && wind < 15) {
    return "✅ Perfect golfing weather - Enjoy your round!";
  } else {
    return "🏌️ Good conditions for golf - Have a great round!";
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainInfo: {
    marginLeft: 12,
    flex: 1,
  },
  temperature: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  conditions: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  compactTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  compactWind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactWindText: {
    fontSize: 12,
    color: '#666',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 11,
    color: '#888',
  },
  playingConditions: {
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  playingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  playingText: {
    fontSize: 13,
    color: '#2c5530',
    lineHeight: 18,
  },
});

export default WeatherWidget;