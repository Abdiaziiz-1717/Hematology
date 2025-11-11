const KEEP_ALIVE_FLAG = Symbol.for("__keepAliveInterval")

declare global {
  // eslint-disable-next-line no-var
  var __keepAliveInterval: NodeJS.Timer | undefined
}

function pingExternalDomain() {
  const endpoint = process.env.KEEP_ALIVE_PING_URL ?? "https://osquiz.onrender.com/"
  const intervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS ?? 120_000)

  if (Number.isNaN(intervalMs) || intervalMs <= 0) {
    console.error("[keep-alive] Invalid KEEP_ALIVE_INTERVAL_MS value. Skipping keep-alive pings.")
    return
  }

  const globalSymbols = Object.getOwnPropertySymbols(globalThis)
  if (globalSymbols.indexOf(KEEP_ALIVE_FLAG) === -1) {
    Object.defineProperty(globalThis, KEEP_ALIVE_FLAG, {
      value: undefined,
      writable: true,
      configurable: true,
    })
  }

  if (globalThis.__keepAliveInterval) {
    return
  }

  const interval = setInterval(async () => {
    try {
      const response = await fetch(endpoint, { method: "GET" })
      if (!response.ok) {
        console.error(`[keep-alive] Ping failed with status ${response.status}`)
      }
    } catch (error) {
      console.error("[keep-alive] Ping failed:", error)
    }
  }, intervalMs)

  globalThis.__keepAliveInterval = interval
}

export function startKeepAlive() {
  if (typeof window !== "undefined") {
    return
  }

  pingExternalDomain()
}


