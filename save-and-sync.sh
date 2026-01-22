#!/bin/bash
# Save your work and sync to GitHub (and Vibe Code)

echo "📤 Saving and syncing your changes..."
git add .
git commit -m "${1:-Auto-save from local development}"
git push origin main
echo "✅ Changes saved and synced!"
