#!/bin/bash

# Keep-alive script for Render deployment
# Pings the service every 10 minutes to prevent it from sleeping

URL="https://briworld.onrender.com/api/health"
INTERVAL=600  # 10 minutes in seconds

echo "Starting keep-alive service for BriWorld..."
echo "Pinging $URL every $INTERVAL seconds"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "[$TIMESTAMP] ✓ Ping successful (HTTP $RESPONSE)"
    else
        echo "[$TIMESTAMP] ✗ Ping failed (HTTP $RESPONSE)"
    fi
    
    sleep $INTERVAL
done
