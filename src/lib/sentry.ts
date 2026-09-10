import * as Sentry from "@sentry/react-native";

// Shared across the client bundle and every server context (API routes,
// Inngest functions) — each runtime imports this module and gets its own
// initialized SDK instance, configured identically from one place.
Sentry.init({
  dsn: "https://4b0a994aada1591a239f3456ee2d7701@o4512013941211136.ingest.us.sentry.io/4512013974962176",
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  enableLogs: true,
});

export { Sentry };
