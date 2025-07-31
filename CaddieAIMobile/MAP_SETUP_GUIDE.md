# Map Implementation Setup Guide

## Overview
This guide covers the final setup steps needed to enable the map-based ActiveRoundScreen functionality.

## Google Maps API Setup

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (if using place search)

### 2. Create API Keys
1. Navigate to "Credentials" in Google Cloud Console
2. Click "Create Credentials" > "API Key"
3. Create separate keys for Android and iOS (recommended)
4. Restrict the keys:
   - **Android**: Add package name restriction (`com.caddieaimobile` or your package name)
   - **iOS**: Add iOS app restriction with bundle identifier

### 3. Configure Android
1. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `android/app/src/main/AndroidManifest.xml`
2. Add your actual Google Maps Android API key

### 4. Configure iOS
1. Add the following to `ios/CaddieAIMobile/Info.plist`:
```xml
<key>GMSApiKey</key>
<string>YOUR_IOS_GOOGLE_MAPS_API_KEY_HERE</string>
```

## Platform Linking (if needed)

### Android
If autolinking doesn't work, manually link in `android/settings.gradle`:
```gradle
include ':react-native-maps'
project(':react-native-maps').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-maps/lib/android')
```

### iOS
1. Run `cd ios && pod install` to install CocoaPods dependencies
2. If using Xcode, ensure the following frameworks are linked:
   - GoogleMaps
   - GoogleMapsCore
   - GoogleMapsBase

## Testing the Implementation

### 1. Build and Run
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

### 2. Test Map Features
- ✅ Map loads with satellite view
- ✅ User location marker appears (blue dot with pulse)
- ✅ Tap to place target pin
- ✅ Distance calculation displays
- ✅ Voice interface integration works
- ✅ Round controls modal functions

### 3. GPS Accuracy Testing
- Test in different environments (indoor/outdoor)
- Verify distance measurements are accurate
- Check GPS status indicators work properly

## Troubleshooting

### Common Issues

**Map doesn't load:**
- Check API key is correct and restrictions match
- Verify internet connection
- Check console for API errors

**Location not working:**
- Ensure location permissions are granted
- Test on physical device (not simulator)
- Check GPS is enabled on device

**Performance issues:**
- Ensure map updates are throttled (implemented in LocationService)
- Check for memory leaks in location subscriptions
- Test on lower-end devices

### Debug Mode
Enable debug logging in development by adding to your app:
```javascript
// In development only
if (__DEV__) {
  console.log('Map Debug Mode Enabled');
}
```

## Feature Validation Checklist

### Core Map Features
- [ ] Full-screen satellite map display
- [ ] User location tracking with accuracy indicator
- [ ] Target pin placement via tap
- [ ] Real-time distance calculation
- [ ] Bearing calculation for club recommendations

### UI/UX Features
- [ ] Floating overlay with course info
- [ ] Distance badge with large, readable text
- [ ] Voice button always accessible
- [ ] Round controls in modal
- [ ] Settings toggle (map type switching)

### AI Integration
- [ ] Enhanced location context sent to AI
- [ ] Target pin data included in AI requests
- [ ] Club recommendations based on distance
- [ ] GPS accuracy validation
- [ ] Course feature detection (when available)

### Performance & Reliability
- [ ] Smooth 60fps map rendering
- [ ] <100ms distance calculation response
- [ ] Efficient battery usage
- [ ] Graceful GPS accuracy degradation
- [ ] Offline functionality when possible

## Next Steps

1. **Get Google Maps API Keys**: Set up Google Cloud project and generate restricted API keys
2. **Update Configuration**: Replace placeholder API keys in AndroidManifest.xml and Info.plist
3. **Test on Device**: Install and test on physical devices (iOS/Android)
4. **Golf Course Testing**: Test at actual golf course for real-world validation
5. **Performance Optimization**: Monitor and optimize for battery life and performance

## Support

If you encounter issues:
1. Check the React Native Maps documentation: https://github.com/react-native-maps/react-native-maps
2. Verify Google Maps API setup and billing
3. Test permissions and location services
4. Check device compatibility and GPS accuracy

The map implementation is now complete and ready for testing with proper API key configuration!