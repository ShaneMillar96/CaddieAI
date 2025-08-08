# 🔒 Security Setup Guide

This guide explains how to securely configure API keys and sensitive configuration for the CaddieAI project without exposing secrets in the public repository.

## 🚨 Important Security Notice

**NEVER commit API keys, tokens, or other secrets to the repository!**

This project uses a secure configuration system where:
- Template files with placeholders are committed to the repository
- Local configuration files with real API keys are ignored by git
- A setup script helps developers configure their local environment

## 🛠️ Quick Setup

For team members with access to the project tokens, run:

```bash
./setup-local-config.sh
```

This will automatically configure all required API keys for local development.

## 📋 Manual Setup

If you prefer to set up configuration manually or need different API keys:

### 1. Mapbox Configuration

Copy the template and add your Mapbox tokens:

```bash
cp CaddieAIMobile/mapbox.config.js.example CaddieAIMobile/mapbox.config.js
```

Edit `CaddieAIMobile/mapbox.config.js` and replace:
- `pk.YOUR_MAPBOX_ACCESS_TOKEN_HERE` with your Mapbox public token

### 2. Android Gradle Configuration

Copy the template and add your Mapbox download token:

```bash
cp CaddieAIMobile/android/gradle.properties.example CaddieAIMobile/android/gradle.properties
```

Edit `CaddieAIMobile/android/gradle.properties` and replace:
- `sk.YOUR_MAPBOX_SECRET_TOKEN_HERE` with your Mapbox secret token

### 3. Google Maps API Configuration

Copy the template and add your Google Maps API key:

```bash
cp CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml.example CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml
```

Edit the file and replace:
- `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your Google Maps API key

### 4. JIRA/MCP Configuration

Copy the template and add your JIRA credentials:

```bash
cp .mcp.json.example .mcp.json
```

Edit `.mcp.json` and configure:
- `JIRA_HOST`: Your JIRA instance URL
- `JIRA_USERNAME`: Your JIRA username/email
- `JIRA_API_TOKEN`: Your JIRA API token
- `JIRA_PROJECT_KEY`: Your project key

## 🔑 Getting API Keys

### Mapbox Tokens
1. Create account at [mapbox.com](https://mapbox.com)
2. Go to [Account > Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a **public token** (pk.) for the app
4. Create a **secret token** (sk.) with Downloads:Read scope for SDK downloads

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps SDK for Android and iOS
3. Create API key and restrict to your app's package name

### JIRA API Token
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create API token for JIRA access

## 🛡️ Security Features

### Git Ignore Protection
The following files are automatically ignored by git:

```
CaddieAIMobile/android/gradle.properties
CaddieAIMobile/mapbox.config.js  
CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml
.mcp.json
```

### Template System
- `.example` files contain placeholder values
- These are safe to commit and share publicly
- Local files with real tokens are created from templates

### Verification
After setup, verify your configuration:

1. Check that API keys are configured:
   ```bash
   # This should show your actual tokens (not placeholders)
   grep "pk\." CaddieAIMobile/mapbox.config.js
   grep "sk\." CaddieAIMobile/android/gradle.properties
   ```

2. Verify files are ignored by git:
   ```bash
   # These should show "ignored" status
   git status --ignored | grep -E "(mapbox\.config|gradle\.properties|google_maps_api\.xml|\.mcp\.json)$"
   ```

## ⚠️ Troubleshooting

### "Map not loading" or "API key invalid"
- Verify your API keys are correctly configured
- Check that tokens have proper scopes and restrictions
- Ensure network connectivity

### "Build errors with Mapbox"
- Confirm your secret download token has `Downloads:Read` scope
- Try cleaning and rebuilding: `cd CaddieAIMobile/android && ./gradlew clean`

### Git trying to commit sensitive files
- Run `git status --ignored` to verify files are ignored
- If files appear in git status, they may not be in .gitignore correctly
- Never use `git add -f` on configuration files

## 🔄 Team Workflow

### For New Team Members:
1. Clone the repository
2. Run `./setup-local-config.sh` (if you have access to team tokens)
3. OR follow manual setup with your own API keys
4. Verify setup with build tests

### For Updates to Configuration:
1. Update template files (`.example` versions) 
2. Update this documentation if needed
3. Update setup script if new configurations are added
4. **NEVER** commit actual API keys

### For Production Deployment:
- Use environment variables or secure secrets management
- Rotate API keys regularly
- Monitor API usage and access logs
- Use different keys for development vs production

## 📞 Support

If you encounter issues with API key setup:
1. Check this documentation first
2. Verify your API keys are valid and have correct permissions
3. Test with minimal configuration to isolate issues
4. Contact team lead for project-specific API key access

---

**Remember: Security is everyone's responsibility. When in doubt, don't commit it!** 🔒