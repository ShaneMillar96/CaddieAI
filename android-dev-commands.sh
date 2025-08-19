#!/bin/bash
# CaddieAI Android Development Commands

# List available AVDs
echo "Available Android Virtual Devices:"
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager list avd

echo -e "\n==================================="
echo "Android Development Quick Commands:"
echo "==================================="

# Launch emulator (replace AVD_NAME with your actual AVD name)
echo "1. Launch emulator:"
echo "   $ANDROID_HOME/emulator/emulator -avd AVD_NAME"

# Check connected devices
echo -e "\n2. Check connected devices:"
echo "   adb devices"

# Deploy React Native app
echo -e "\n3. Deploy CaddieAI app:"
echo "   cd /Users/shane.millar/Desktop/Projects/CaddieAI/CaddieAIMobile && npm run android"

# Kill all emulators
echo -e "\n4. Kill all emulators:"
echo "   adb emu kill"

# Open AVD Manager
echo -e "\n5. Open AVD Manager:"
echo "   $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd --help"

echo -e "\n==================================="