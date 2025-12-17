# Keep-Alive Scripts for Render

This project includes multiple options to keep your Render service active and prevent it from sleeping.

## Option 1: GitHub Actions (Recommended)

The `.github/workflows/keep-alive.yml` workflow automatically pings your service every 10 minutes.

**Setup:**
1. Push this repository to GitHub
2. The workflow will run automatically
3. Monitor in GitHub Actions tab

**Advantages:**
- Free and automated
- No external service needed
- Runs in GitHub's infrastructure

## Option 2: Local Bash Script

Run `keep-alive.sh` on your local machine or server.

```bash
./keep-alive.sh
```

**Advantages:**
- Simple and lightweight
- No dependencies

## Option 3: Node.js Script

Run `keep-alive.js` using Node.js.

```bash
node keep-alive.js
```

**Advantages:**
- Cross-platform
- Can be deployed to any Node.js hosting

## Option 4: External Services

Use free services like:
- **UptimeRobot** (https://uptimerobot.com) - Free monitoring with 5-minute intervals
- **Cron-job.org** (https://cron-job.org) - Free cron jobs
- **Pingdom** - Free tier available

**Setup for UptimeRobot:**
1. Create free account
2. Add new monitor
3. URL: `https://briworld.onrender.com/api/health`
4. Interval: 5 minutes

## Health Check Endpoint

All scripts ping: `https://briworld.onrender.com/api/health`

This endpoint returns HTTP 200 when the service is running.

## Notes

- Render free tier spins down after 15 minutes of inactivity
- Keep-alive scripts prevent this by making regular requests
- GitHub Actions is the most reliable free option
- Consider upgrading to Render paid tier for always-on service
