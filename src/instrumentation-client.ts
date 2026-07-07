import * as Sentry from "@sentry/nextjs";
import { getSentryBaseOptions } from "../sentry.shared.config";

Sentry.init({
  ...getSentryBaseOptions(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
