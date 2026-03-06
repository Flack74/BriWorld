// Keep-alive script for Render deployment
// Pings the service every 10 minutes to prevent it from sleeping

const https = require('https');

const URL = 'https://briworld.onrender.com/api/health';
const INTERVAL = 10 * 60 * 1000; // 10 minutes

console.log('Starting keep-alive service for BriWorld...');
console.log(`Pinging ${URL} every ${INTERVAL / 1000} seconds`);

function ping() {
  const timestamp = new Date().toISOString();
  
  https.get(URL, (res) => {
    if (res.statusCode === 200) {
      console.log(`[${timestamp}] ✓ Ping successful (HTTP ${res.statusCode})`);
    } else {
      console.log(`[${timestamp}] ✗ Ping failed (HTTP ${res.statusCode})`);
    }
  }).on('error', (err) => {
    console.log(`[${timestamp}] ✗ Ping error: ${err.message}`);
  });
}

// Initial ping
ping();

// Set interval for subsequent pings
setInterval(ping, INTERVAL);
