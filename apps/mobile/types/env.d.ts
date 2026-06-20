/**
 * Ambient types for Expo public env vars. Expo inlines any variable prefixed
 * with EXPO_PUBLIC_ at build time; this declaration lets TypeScript resolve
 * `process.env.EXPO_PUBLIC_*` without pulling the full @types/node surface.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_SCHOOL_ID?: string;
    }
  }

  // eslint-disable-next-line no-var
  var process: { env: NodeJS.ProcessEnv };
}

export {};
