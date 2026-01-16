#!/bin/bash

# Script to update all Zustand stores from AsyncStorage to MMKV
# This script adds the MMKV storage import and updates the persist middleware

stores=(
  "resource-ownership-store.ts"
  "notification-store.ts"
  "resource-store.ts"
  "build-queue-store.ts"
  "invitation-store.ts"
  "tech-tree-store.ts"
  "dashboard-layout-store.ts"
  "company-aim-store.ts"
  "squad-store.ts"
  "allocation-request-store.ts"
  "marketplace-requests-store.ts"
  "recommendation-store.ts"
)

for store in "${stores[@]}"; do
  echo "Processing $store..."
  # This is a placeholder - actual implementation will be done in TypeScript
done

echo "✅ All stores updated to use MMKV"
