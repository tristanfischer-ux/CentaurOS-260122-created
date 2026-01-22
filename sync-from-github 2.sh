#!/bin/bash
# Pull latest code from GitHub
echo "📥 Syncing from GitHub..."
git fetch github main
git merge github/main --no-edit
echo "✅ Synced!"
