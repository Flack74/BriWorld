#!/bin/bash
# Comprehensive health check for BriWorld production

set -e

echo "=== BriWorld Production Health Check ==="
echo "Timestamp: $(date)"
echo "Environment: $ENV"
echo "Port: $PORT"
echo "Working Directory: $(pwd)"
echo "User: $(whoami)"

# Check binary
echo "\n[1/8] Checking application binary..."
if [ -f "./briworld" ] && [ -x "./briworld" ]; then
    echo "✓ Binary exists and is executable"
    echo "Binary info: $(file ./briworld)"
else
    echo "✗ CRITICAL: Binary missing or not executable"
    exit 1
fi

# Check database configuration
echo "\n[2/8] Checking database configuration..."
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
    echo "✓ Database configured: $DB_HOST:$DB_PORT/$DB_NAME"
    echo "✓ SSL Mode: $DB_SSL_MODE"
else
    echo "✗ CRITICAL: Database not properly configured"
    exit 1
fi

# Check static files
echo "\n[3/8] Checking static assets..."
if [ -d "./static" ]; then
    echo "✓ Static directory exists"
    STATIC_COUNT=$(find ./static -type f | wc -l)
    echo "✓ Static files count: $STATIC_COUNT"
else
    echo "✗ CRITICAL: Static directory missing"
    exit 1
fi

# Check critical game files
echo "\n[4/8] Checking game assets..."
if [ -f "./static/world.json" ]; then
    COUNTRIES=$(grep -o '"[A-Z][A-Z]"' ./static/world.json | wc -l)
    echo "✓ world.json exists ($COUNTRIES countries)"
else
    echo "✗ CRITICAL: world.json missing"
    exit 1
fi

if [ -f "./static/world.svg" ]; then
    echo "✓ world.svg exists"
else
    echo "✗ WARNING: world.svg missing"
fi

# Check JavaScript files
echo "\n[5/8] Checking JavaScript files..."
JS_FILES=("game.js" "lobby.js" "auth.js")
for js in "${JS_FILES[@]}"; do
    if [ -f "./static/js/$js" ]; then
        echo "✓ $js exists"
    else
        echo "✗ CRITICAL: $js missing"
        exit 1
    fi
done

# Check CSS files
echo "\n[6/8] Checking CSS files..."
CSS_FILES=("global.css" "game.css" "animations.css")
for css in "${CSS_FILES[@]}"; do
    if [ -f "./static/css/$css" ]; then
        echo "✓ $css exists"
    else
        echo "✗ WARNING: $css missing"
    fi
done

# Check HTML templates
echo "\n[7/8] Checking HTML templates..."
HTML_FILES=("index.html" "game.html" "lobby.html" "login.html" "register.html")
for html in "${HTML_FILES[@]}"; do
    if [ -f "./web/$html" ]; then
        echo "✓ $html exists"
    else
        echo "✗ CRITICAL: $html missing"
        exit 1
    fi
done

# Test external connectivity
echo "\n[8/8] Testing external connectivity..."
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 5 https://flagcdn.com/w20/us.png > /dev/null; then
        echo "✓ Flag CDN accessible"
    else
        echo "✗ WARNING: Flag CDN not accessible"
    fi
else
    echo "✗ WARNING: curl not available for connectivity test"
fi

echo "\n=== Health Check Complete - All Critical Components Ready ==="
echo "Application ready for production traffic"
exit 0