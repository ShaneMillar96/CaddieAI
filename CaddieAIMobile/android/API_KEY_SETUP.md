# Google Maps API Key Setup for CaddieAI

This document explains how to properly configure your Google Maps API key for the CaddieAI mobile application.

## Current Configuration

The app is configured to read the Google Maps API key from a `secrets.properties` file, which provides better security than hardcoding the key in the source code.

## Required Setup Steps

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps SDK for Android** (required)
   - **Places API** (if using places features)
   - **Geocoding API** (if using geocoding features)

### 2. Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the generated API key

### 3. Configure API Key Restrictions

**IMPORTANT**: Always restrict your API keys for security.

1. Click on your API key to edit it
2. Under **Application restrictions**, select **Android apps**
3. Add your app's package name and SHA-1 certificate fingerprint:
   - **Package name**: `com.caddieaimobile`
   - **SHA-1 certificate fingerprint**: (see instructions below)

### 4. Get SHA-1 Certificate Fingerprint

For **debug builds** (development):
```bash
cd CaddieAIMobile/android
./gradlew signingReport
```

Look for the SHA1 fingerprint under `Variant: debug` and `Config: debug`.

For **release builds** (production):
You'll need the SHA-1 from your release keystore.

### 5. Update secrets.properties

1. Open `CaddieAIMobile/android/secrets.properties`
2. Replace the placeholder API key with your actual API key:
   ```properties
   MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

### 6. API Key Services Configuration

In the Google Cloud Console, under **API restrictions**, ensure these services are enabled:
- Maps SDK for Android
- Places API (if using places)
- Geocoding API (if using geocoding)

## Testing Your Configuration

1. **Run the app** on your device or emulator
2. **Check the map initialization**:
   - If the map loads successfully, your configuration is correct
   - If the map fails to load, tap the **"Run Diagnostics"** button in the error screen

3. **Use the Diagnostics Tool**:
   The app includes a built-in diagnostics tool to help troubleshoot configuration issues:
   - Shows API key validation status
   - Checks Google Play Services availability
   - Validates network connectivity to Google services
   - Provides specific error messages and solutions

## Common Issues and Solutions

### Issue: "Map failed to initialize"
**Causes:**
- Invalid or missing API key
- API key restrictions not configured correctly
- Google Play Services not installed/updated
- Network connectivity issues

**Solutions:**
1. Verify API key is correct in `secrets.properties`
2. Check API key restrictions match your app's package name and SHA-1
3. Ensure Google Play Services is installed and updated
4. Run the diagnostics tool for specific error information

### Issue: "API key invalid or restricted"
**Causes:**
- API key has incorrect restrictions
- Required APIs not enabled
- API key quota exceeded

**Solutions:**
1. Check API key restrictions in Google Cloud Console
2. Ensure Maps SDK for Android is enabled
3. Verify package name and SHA-1 fingerprint are correct
4. Check API usage and quotas

### Issue: "Google Play Services not available"
**Causes:**
- Google Play Services not installed (common on emulators)
- Google Play Services outdated
- Device doesn't support Google Play Services

**Solutions:**
1. Install Google Play Services on emulator
2. Update Google Play Services on device
3. Use a device that supports Google Play Services

## Security Best Practices

1. **Never commit API keys to version control**
   - The `secrets.properties` file is already added to `.gitignore`
   - Always use API key restrictions

2. **Use different API keys for development and production**
   - Create separate keys for debug and release builds
   - Configure appropriate restrictions for each environment

3. **Monitor API usage**
   - Set up billing alerts in Google Cloud Console
   - Monitor API usage to detect unusual activity

4. **Rotate API keys regularly**
   - Consider rotating API keys periodically for security
   - Update all environments when rotating keys

## Debugging Commands

### Clean and rebuild the project:
```bash
cd CaddieAIMobile
npx react-native clean
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### Check build configuration:
```bash
cd CaddieAIMobile/android
./gradlew app:dependencies
```

### View detailed build logs:
```bash
npx react-native run-android --verbose
```

## Support

If you continue to experience issues:

1. **Use the in-app diagnostics tool** first
2. **Check the console logs** for specific error messages
3. **Verify all setup steps** are completed correctly
4. **Test with a minimal Google Maps API example** to isolate issues

## File Structure

```
CaddieAIMobile/android/
├── secrets.properties          # API key configuration (not in git)
├── app/build.gradle           # Reads from secrets.properties
└── app/src/main/AndroidManifest.xml  # Uses manifest placeholder
```

The build system automatically reads the API key from `secrets.properties` and injects it into the Android manifest during build time.