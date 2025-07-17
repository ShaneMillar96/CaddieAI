# CaddieAI Development Setup Guide

## Prerequisites

- Node.js 18+
- .NET 9.0 SDK
- Docker Desktop
- React Native CLI (`npm install -g react-native-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

## Quick Start

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
cd frontend

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

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npm run reset-cache
```

### Build Issues
```bash
# Clean builds
npm run clean
```

### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## Environment Variables

Create `.env` file in frontend directory:
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
├── frontend/              # React Native app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API services
│   │   └── store/         # Redux store
└── docker-compose.yml     # Development infrastructure
```