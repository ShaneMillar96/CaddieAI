#!/bin/bash

# CaddieAI Local Configuration Setup Script
# This script helps developers configure their local environment with API keys
# without exposing secrets in the public repository

echo "🔧 Setting up CaddieAI local configuration..."

# Create the local mapbox config
echo "📍 Setting up Mapbox configuration..."
cp CaddieAIMobile/mapbox.config.js.example CaddieAIMobile/mapbox.config.js
sed -i '' 's/pk.YOUR_MAPBOX_ACCESS_TOKEN_HERE/pk.eyJ1Ijoic2hhbmVtaWxsYXI5NiIsImEiOiJjbWUwMTZmZjUwMDBrMmpvbDVlM29zaDY2In0.1vFGVjxhYRMtfi2vLMJGpA/g' CaddieAIMobile/mapbox.config.js

# Set up gradle properties
echo "🏗️ Setting up Android Gradle properties..."
cp CaddieAIMobile/android/gradle.properties.example CaddieAIMobile/android/gradle.properties
sed -i '' 's/sk.YOUR_MAPBOX_SECRET_TOKEN_HERE/sk.eyJ1Ijoic2hhbmVtaWxsYXI5NiIsImEiOiJjbWUwMTdrNHcwMDB3MmtvZjZ5dG1veTJzIn0.mh7-3Fi1MjyzEsp6P_tg1g/g' CaddieAIMobile/android/gradle.properties

# Set up Google Maps API key
echo "🗺️ Setting up Google Maps API key..."
mkdir -p CaddieAIMobile/android/app/src/main/res/values
cp CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml.example CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml
sed -i '' 's/YOUR_GOOGLE_MAPS_API_KEY_HERE/AIzaSyCJWhW4jOVOI38JMclbWzw-JluoKYU_SsQ/g' CaddieAIMobile/android/app/src/main/res/values/google_maps_api.xml

# Set up MCP configuration
echo "🔗 Setting up MCP configuration..."
cp .mcp.json.example .mcp.json
sed -i '' 's/YOUR_JIRA_API_TOKEN_HERE/YOUR_ACTUAL_JIRA_TOKEN/g' .mcp.json

echo "✅ Local configuration setup complete!"
echo ""
echo "🔒 Security Notes:"
echo "- Your API keys are now configured locally"
echo "- These files are in .gitignore and won't be committed"
echo "- Never share your actual API keys in commits or public channels"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'npm install' in CaddieAIMobile directory"
echo "2. Run 'npm run android' or 'npm run ios' to build and test"