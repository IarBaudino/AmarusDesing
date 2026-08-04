const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

export const isSentryEnabled = Boolean(sentryDsn);

export function getSentryEnvironment() {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
}

/** Solo reporta en producción desplegada (no en dev local). */
export function shouldEnableSentry() {
  return isSentryEnabled && process.env.NODE_ENV === "production";
}

export function getSentryBaseOptions() {
  return {
    dsn: sentryDsn,
    enabled: shouldEnableSentry(),
    environment: getSentryEnvironment(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Ruido de apps (Instagram/Facebook in-app browser) y cortes de red puntuales
    ignoreErrors: [
      /webkit\.messageHandlers/i,
      "Failed to get document because the client is offline",
      /Could not reach Cloud Firestore backend/i,
    ],
  };
}
