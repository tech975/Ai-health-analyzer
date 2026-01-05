#!/bin/bash

# Setup script for Render deployment
echo "🚀 Setting up Render environment..."

# Set Chrome environment variables for Render
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
export CHROME_BIN=/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome

# Install Chrome via Puppeteer with retry logic
echo "📦 Installing Chrome browser..."
for i in {1..3}; do
    echo "Attempt $i: Installing Chrome..."
    if npx puppeteer browsers install chrome; then
        echo "✅ Chrome installation successful on attempt $i"
        break
    else
        echo "❌ Chrome installation failed on attempt $i"
        if [ $i -eq 3 ]; then
            echo "⚠️  All Chrome installation attempts failed, continuing anyway..."
        fi
        sleep 5
    fi
done

# Find and set Chrome executable path
echo "🔍 Looking for Chrome executable..."
CHROME_PATHS=(
    "/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
)

for path in "${CHROME_PATHS[@]}"; do
    if [[ "$path" == *"*"* ]]; then
        # Handle glob patterns
        for expanded_path in $path; do
            if [ -f "$expanded_path" ]; then
                echo "✅ Chrome found at: $expanded_path"
                export CHROME_BIN="$expanded_path"
                break 2
            fi
        done
    elif [ -f "$path" ]; then
        echo "✅ Chrome found at: $path"
        export CHROME_BIN="$path"
        break
    fi
done

if [ -z "$CHROME_BIN" ]; then
    echo "⚠️  Chrome executable not found, will use bundled Chromium"
else
    echo "🎯 Chrome executable set to: $CHROME_BIN"
fi

# Check Puppeteer cache
if [ -d "/opt/render/.cache/puppeteer" ]; then
    echo "📁 Puppeteer cache directory exists"
    ls -la /opt/render/.cache/puppeteer/ || echo "Could not list cache contents"
else
    echo "⚠️  Puppeteer cache directory not found"
fi

# Test Chrome installation
echo "🧪 Testing Chrome installation..."
if [ -n "$CHROME_BIN" ] && [ -f "$CHROME_BIN" ]; then
    if timeout 10s "$CHROME_BIN" --version 2>/dev/null; then
        echo "✅ Chrome test successful"
    else
        echo "⚠️  Chrome test failed or timed out"
    fi
else
    echo "⚠️  Skipping Chrome test - executable not found"
fi

echo "✅ Setup complete!"