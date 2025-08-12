# 🚀 CaddieAI Development Setup Guide

Complete setup guide for the CaddieAI golf companion application, covering backend, mobile, and security configuration.

## 📋 Prerequisites

- Node.js 18+
- .NET 9.0 SDK  
- Docker Desktop
- React Native CLI (`npm install -g react-native-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Git

## 🔒 Security Configuration (Required First)

**⚠️ CRITICAL: Set up API keys and sensitive configuration before starting development.**

### Option 1: Automated Setup (Recommended)
If you have access to team API keys:
```bash
./setup-local-config.sh
```

### Option 2: Manual Configuration  
Create your local configuration files:

#### A. Environment Variables for Backend
Create `.env.caddieai` in the project root:
```bash
# Database Configuration  
CADDIEAI_CONNECTION_STRING=Host=localhost;Database=caddieai_dev;Username=caddieai_user;Password=caddieai_password;Include Error Detail=true

# JWT Configuration
CADDIEAI_JWT_SECRET=YourSuperSecretJWTKeyThatShouldBeAtLeast32CharactersLong!

# OpenAI Configuration
CADDIEAI_OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Configuration (Optional for local development)
CADDIEAI_SMTP_HOST=smtp.gmail.com
CADDIEAI_SMTP_USERNAME=your-email@gmail.com
CADDIEAI_SMTP_PASSWORD=your-app-password-here
CADDIEAI_FROM_EMAIL=noreply@caddieai.com
```

#### B. Mapbox Configuration (Required for Maps)
```bash
# Copy template and configure
cp CaddieAIMobile/mapbox.config.js.example CaddieAIMobile/mapbox.config.js
```
Edit and replace `pk.YOUR_MAPBOX_ACCESS_TOKEN_HERE` with your actual Mapbox token.

```bash  
# Configure Android Gradle
cp CaddieAIMobile/android/gradle.properties.example CaddieAIMobile/android/gradle.properties
```
Edit and replace `sk.YOUR_MAPBOX_SECRET_TOKEN_HERE` with your Mapbox secret token.

#### C. Backend Configuration
```bash
# Copy local configuration template
cp backend/src/caddie.portal.api/appsettings.Local.json.example backend/src/caddie.portal.api/appsettings.Local.json
```
Edit the file with your actual API keys and connection strings.

### 🔑 Getting API Keys

**OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com)  
2. Sign in or create account
3. Navigate to API Keys → Create new key
4. Set usage limits for cost control

**Mapbox Tokens:**
1. Create account at [mapbox.com](https://mapbox.com)
2. Go to Account → Access Tokens
3. Create public token (pk.) and secret token (sk.) with Downloads:Read scope

## 🚀 Quick Start

### 1. Start Database Infrastructure

```bash
# Start PostgreSQL, pgAdmin, and Redis
docker-compose up -d

# Verify database is running
docker-compose logs postgres

# Access pgAdmin at http://localhost:8080
# Login: admin@caddieai.com / admin
```

### 2. Start Backend API

```bash
cd backend/src/caddie.portal.api

# Install dependencies and run
dotnet restore
dotnet run

# API will be available at:
# - http://localhost:5277 (Swagger documentation)
# - http://localhost:5277/api (API endpoints)
# - http://localhost:5277/health (Health check)
```

### 3. Start Frontend Mobile App

```bash
cd CaddieAIMobile

# Install dependencies (with legacy peer deps due to React Native compatibility)
npm install --legacy-peer-deps

# Start Metro bundler
npx react-native start

# In another terminal, run on device/emulator:
npx react-native run-android  # For Android
npx react-native run-ios      # For iOS
```

## Development URLs

- **Backend API**: http://localhost:5277
- **API Documentation**: http://localhost:5277 (Swagger UI)
- **Health Check**: http://localhost:5277/health
- **Database Admin**: http://localhost:8080 (pgAdmin)
- **Metro Bundler**: http://localhost:8081

## Mobile Development

### Android Setup
1. Install Android Studio
2. Set up Android SDK and emulator
3. Run `npm run android` to launch on emulator

### iOS Setup (macOS only)
1. Install Xcode
2. Set up iOS simulator
3. Run `npm run ios` to launch on simulator

### Physical Device Testing
1. Enable Developer Mode on your device
2. For Android: Enable USB debugging
3. For iOS: Add device to development team
4. Connect device and run respective commands

### Device Disconnection Troubleshooting
If your Android device gets disconnected during development:
```bash
# Re-establish ADB port forwarding for Metro bundler
adb reverse tcp:8081 tcp:8081
```
This ensures the device can connect to the Metro bundler running on your development machine.

## Testing Authentication Flow

1. Start all services (database, backend, frontend)
2. Open mobile app on device/emulator
3. Register a new account or login
4. Verify authentication works end-to-end

## 🔧 Troubleshooting

### Backend Issues

#### "OpenAI API key not configured"
```bash
# Check if environment variable is set
echo $CADDIEAI_OPENAI_API_KEY    # Linux/macOS
echo $env:CADDIEAI_OPENAI_API_KEY # Windows PowerShell

# If not set, add to your environment or .env.caddieai file
export CADDIEAI_OPENAI_API_KEY="sk-your-key-here"
```

#### Database Connection Issues
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d

# Check database logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U caddieai_user -d caddieai_dev
```

#### JWT Secret Issues
- Ensure CADDIEAI_JWT_SECRET is at least 32 characters long
- Use a cryptographically secure random string
- Restart the backend after changing environment variables

### Mobile Development Issues

#### Metro Bundler Issues
```bash
# Clear cache and restart Metro
npm run reset-cache
npx react-native start --reset-cache

# Clean build directories
npm run clean
```

#### Android Build Issues
```bash
# Clean Android build
cd CaddieAIMobile/android
./gradlew clean

# Reset ADB connection
adb kill-server
adb start-server

# Re-establish port forwarding
adb reverse tcp:8081 tcp:8081
```

#### Mapbox Configuration Issues

**Map not loading or "API key invalid":**
1. Verify your public token (pk.) is correct in `mapbox.config.js`
2. Check token permissions in your Mapbox account  
3. Ensure network connectivity

**Android build errors with Mapbox:**
1. Confirm secret token (sk.) has `Downloads:Read` scope
2. Clean and rebuild: `cd CaddieAIMobile/android && ./gradlew clean`
3. Check `gradle.properties` file exists and has correct token

### Security & Configuration Issues

#### Environment Variables Not Loading
```bash
# Verify environment variables are set
env | grep CADDIEAI

# For development, ensure .env.caddieai exists in project root
ls -la .env.caddieai

# Load environment variables in current session
source .env.caddieai  # Linux/macOS
```

#### Git Trying to Commit Sensitive Files
```bash
# Check what files are being ignored
git status --ignored

# If sensitive files appear in git status, check .gitignore
# NEVER use git add -f on configuration files

# Files that should be ignored:
# - CaddieAIMobile/mapbox.config.js
# - CaddieAIMobile/android/gradle.properties  
# - backend/src/caddie.portal.api/appsettings.Local.json
# - .env.caddieai
```

### OpenAI API Issues

#### Quota Exceeded (HTTP 429)
- Check usage at https://platform.openai.com/usage
- Add payment method or increase usage limits
- App includes fallback responses when quota exceeded

#### High Token Usage
- Current config uses cost-effective `gpt-4o-mini` model
- Daily estimates: ~$0.02-0.04 for 100 interactions
- Monitor usage and adjust limits as needed

### Performance Issues

#### Slow Startup
1. Ensure Docker containers are running efficiently
2. Check available disk space and memory
3. Close unnecessary applications during development

#### Mobile App Performance
1. Use Release builds for performance testing
2. Profile using React Native Flipper
3. Check for memory leaks in long-running sessions

## Environment Variables

Create `.env` file in CaddieAIMobile directory:
```
API_BASE_URL=http://localhost:5277/api
```

## Database Access

**Connection Details:**
- Host: localhost
- Port: 5432
- Database: caddieai_dev
- Username: caddieai_user
- Password: caddieai_password

## API Testing

Use the included HTTP files for testing:
- `backend/test-auth.http` - Authentication endpoints
- `backend/src/caddie.portal.api/caddie.portal.api.http` - All API endpoints

## Project Structure

```
CaddieAI/
├── backend/               # .NET Core API
│   ├── src/
│   │   ├── caddie.portal.api/      # Controllers, middleware
│   │   ├── caddie.portal.services/ # Business logic
│   │   └── caddie.portal.dal/      # Data access layer
│   └── database/migrations/        # Database migrations
├── CaddieAIMobile/        # React Native app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API services
│   │   └── store/         # Redux store
└── docker-compose.yml     # Development infrastructure
```