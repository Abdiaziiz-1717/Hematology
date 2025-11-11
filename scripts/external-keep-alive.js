/**
 * Simple keep-alive worker that can be run on an external service (e.g. Render cron, Railway, Fly.io, VPS)
 * to ping the public Hematology app every two minutes.
 *
 * Usage:
 *   KEEP_ALIVE_TARGET=https://hematology.onrender.com/ \
 *   KEEP_ALIVE_INTERVAL_MS=120000 \
 *   node scripts/external-keep-alive.js
 *
 * The script relies on Node.js 18+ for the global fetch API.
 */

const targetUrl = process.env.KEEP_ALIVE_TARGET ?? "https://hematology.onrender.com/"
const intervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS ?? 120_000)

if (!targetUrl) {
  console.error("KEEP_ALIVE_TARGET is not defined. Exiting.")
  process.exit(1)
}

if (Number.isNaN(intervalMs) || intervalMs <= 0) {
  console.error("KEEP_ALIVE_INTERVAL_MS must be a positive integer. Exiting.")
  process.exit(1)
}

console.log(`[keep-alive] Pinging ${targetUrl} every ${intervalMs / 1000} seconds`)

async function ping() {
  const timestamp = new Date().toISOString()
  try {
    const response = await fetch(targetUrl, { method: "GET" })
    if (!response.ok) {
      console.error(
        `[keep-alive] ${timestamp} – request failed with status ${response.status}`
      )
    } else {
      console.log(`[keep-alive] ${timestamp} – ping successful`)
    }
  } catch (error) {
    console.error(`[keep-alive] ${timestamp} – error during ping:`, error)
  }
}

// Run immediately, then on interval.
ping()

setInterval(ping, intervalMs)


