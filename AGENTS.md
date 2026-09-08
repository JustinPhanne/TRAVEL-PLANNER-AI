# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Tech stack

- **Expo SDK 57**, managed workflow, `expo-dev-client` for custom native builds.
- **Expo Router** (`expo-router`) — file-based routing under [src/app/](src/app/). Typed routes are ON (`experiments.typedRoutes` in [app.json](app.json)) — use the generated route types, don't hand-type route strings.
- **React 19** / **React Native 0.86**.
- **React Compiler is ON** (`experiments.reactCompiler`). Do not add manual `useMemo`/`useCallback`/`React.memo` for optimization — the compiler handles it. Only reach for them if profiling shows a real problem the compiler doesn't cover.
- **NativeWind v4** (Tailwind for React Native) for all styling.
- **@expo/ui** for native UI components (SwiftUI on iOS, Jetpack Compose on Android), including tab navigation (see Navigation below).
- **Postgres via Neon** as the database.
- **Drizzle ORM** for all database access and schema/migrations — no raw SQL client, no other ORM.
- **Clerk** for authentication.
- **ImageKit** for image optimization/delivery.
- **Inngest** for background jobs / event-driven functions.
- **Sentry** (`@sentry/react-native`) for error tracking and monitoring — already wired in [app.json](app.json) plugins.
- **TypeScript strict mode** — [tsconfig.json](tsconfig.json).
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`.

> Note: Neon/Drizzle/Clerk/ImageKit/Inngest are not yet installed in [package.json](package.json) as of this writing — this section documents the mandated stack for when that work happens, not necessarily what's wired up today. Check `package.json` before assuming a given package is already integrated.

# Navigation

- **Tab bars always use `expo-router/unstable-native-tabs`** (`NativeTabs` + `NativeTabs.Trigger`, rendering the real system tab bar — SwiftUI on iOS, Jetpack Compose on Android). Never use `expo-router`'s built-in `<Tabs>` layout or any other JS-rendered tab bar — this is a hard rule, not a default.
  - Correction (2026-09-03): earlier guidance here pointed at `@expo/ui`'s `Host`/`Tabs`. That component (`TabView` in `@expo/ui`) is iOS-only in the installed version (`~57.0.12`, no Android implementation) and its own docs recommend `expo-router/unstable-native-tabs` for exactly this routed bottom-tab use case — so that's the mandated API going forward.
  - Use `expo-router`'s stack/layout primitives for everything else (screens, stacks, modals).
- **Web is not a first-class target for tab navigation.** Native tabs don't render on web, and per the rule above there's no JS tab fallback — tabbed sections of the app are native-only (iOS/Android). Don't build a web tab bar substitute; treat those screens as unsupported/best-effort on web.

# Styling

- **NativeWind only** — use `className`, no exceptions (no `StyleSheet.create`, no inline `style={{}}` objects for visual styling). This includes animated components: prefer NativeWind classes over `StyleSheet.create` even for `react-native-reanimated`/`react-native-gesture-handler` usage where possible.

# Platforms

- iOS and Android are the primary targets. **Web is secondary**: keep non-tab screens working on web where reasonable, but tabbed navigation surfaces (see Navigation above) are native-only — don't invest in a web equivalent for those. Web uses static output + Metro bundler ([app.json](app.json)).

# Commands

- `npm start` / `expo start` — dev server
- `npm run ios` / `npm run android` — native builds
- `npm run web` — web dev server
- `npm run lint` / `expo lint`
- **No test runner is configured yet.** Don't assume Jest or any test framework exists — check before referencing test commands or writing test files.

# Never run the app

- **Never run `expo start`, `npm start`, `npm run ios`, `npm run android`, `npm run web`, or any other command that launches the dev server or builds/runs the app.** The user always has it running in a separate terminal already. Running it again can conflict with their session (port clashes, duplicate Metro instances, etc).
- If you need to verify a change, ask the user to check it in their running instance, or use static checks instead (TypeScript, lint, reading the code) rather than starting the app yourself.
