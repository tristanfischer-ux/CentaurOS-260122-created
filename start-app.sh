#!/bin/bash
# CentaurOS Local Development Starter
# This pulls the latest code and starts the app

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "🚀 Starting iOS Simulator..."
npx expo start --ios
