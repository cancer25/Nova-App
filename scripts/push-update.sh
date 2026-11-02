#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Nova App - OTA Update Sender"
echo "=========================================="

CHANNEL="${1:-preview}"
MESSAGE="${2:-Update from Nova}"

# Check for EXPO_TOKEN
if [ -z "$EXPO_TOKEN" ]; then
  if [ -f ".expo-token" ]; then
    EXPO_TOKEN=$(cat .expo-token | tr -d '\r\n')
    export EXPO_TOKEN
  fi
fi

if [ -z "$EXPO_TOKEN" ]; then
  echo ""
  echo "🔑 Expo Access Token is required to bypass browser login (no localhost issues)."
  echo "1. Go to: https://expo.dev/settings/access-tokens"
  echo "2. Click 'Create Token' and copy it."
  echo ""
  read -r -p "Paste your Expo Token here: " INPUT_TOKEN
  if [ -n "$INPUT_TOKEN" ]; then
    echo "$INPUT_TOKEN" > .expo-token
    export EXPO_TOKEN="$INPUT_TOKEN"
    echo "✅ Token saved in .expo-token (never committed to git)."
  else
    echo "❌ Error: Token is required."
    exit 1
  fi
fi

# Ensure node_modules exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --legacy-peer-deps
fi

echo "📡 Publishing update to channel: $CHANNEL..."
echo "💬 Message: $MESSAGE"

npx eas-cli update --channel "$CHANNEL" --message "$MESSAGE" --non-interactive

echo ""
echo "🎉 Update successfully published to phones!"
echo "=========================================="
