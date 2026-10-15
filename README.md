# TaskFlow

TaskFlow 1.2.7 is a React, TypeScript, Vite, and Firebase task manager built from the static mockups in `Design/stitch_taskflow_modern_productivity_platform/`. The original design files remain untouched.

## Design mapping

| Source | Application route |
| --- | --- |
| `dashboard` and `dashboard_dark_mode` | `/` dashboard |
| `calendar_planner` and `calendar_planner_dark_mode` | `/calendar` planner |
| `kanban_board_task_detail` and its dark variant | `/board` plus the task details and edit dialogs |
| `kinetic_clarity` design guides | Shared colors, typography, card shape, spacing, and theme tokens |

The six HTML files are static Tailwind CDN mockups. Each has a corresponding screenshot. The two Kinetic Clarity directories contain design guides rather than page mockups. The only image assets are the screenshots; the HTML also references remote Google hosted images and fonts. The app uses CSS for the brand mark and Lucide icons so it does not depend on the mockups' broken remote logo. It reuses the visual patterns: left workspace sidebar, compact top bar, gradient hero, bento cards, tinted task cards, calendar grid, Kanban columns, and task dialogs. Projects, references, templates, analytics, activity, and settings extend those patterns.

## Run locally

1. Install Node.js 20.19+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Firebase web app values from Firebase Console → Project settings.
4. In Firebase Console, enable **Authentication → Email/Password** and **Google**. Add your development and production domains to Authorized domains.
5. Create a Cloud Firestore database and deploy `firestore.rules` and `firestore.indexes.json` with `firebase deploy --only firestore` (Firebase CLI required).
6. Run `npm run dev`.

Without Firebase configuration, the sign in page explains what is missing and disables sign in. The app does not ship demo user data or Firebase credentials.

## Deployment

`npm run build` creates `dist/`. Netlify settings are in `netlify.toml`; Firebase Hosting settings are in `firebase.json`. `.firebaserc` selects Firebase project `taskflow-474ab` and the `taskflow-byaleks` Hosting site, which serves `taskflow-byaleks.web.app`. Set the `VITE_FIREBASE_*` variables before building. The Firebase client configuration is public by design; ownership is enforced by Firestore rules. Do not put Admin SDK keys in frontend environment variables.

To publish the prepared web build to Firebase Hosting, run `npm run build` and then `firebase deploy --only hosting:app`. The web app downloads the Windows installer directly from the [GitHub Release](https://github.com/AlfianESetyawan/TaskFlow/releases/tag/v1.2.7). For each desktop release, upload the new installer to GitHub Releases and update `src/download.ts` before building the site. The earlier ZIP remains at `public/downloads/TaskFlow_1.2.4_Windows.zip` for existing links. Firebase Hosting on the Spark plan rejects `.exe` files. Add `taskflow-byaleks.web.app` to Firebase Authentication's authorized domains before signing in on the published site. Deploy Firestore rules separately with `firebase deploy --only firestore` when they change.

## Desktop updates and releases

Starting with 1.2.7, the installed Windows app checks GitHub Releases five seconds after startup and hourly while running. Newer versions download automatically in the native process, which verifies their signature before offering **Install and restart**. The widget and full window share the same download and update status. Closing to the tray keeps update checks running. Settings includes a manual check, download progress, release notes, and retry controls. Updates never install until the user selects the install action. Windows shows installation progress and restarts TaskFlow afterward.

Users running 1.2.6 or earlier need to install 1.2.7 manually once. The web app receives the current web build through Firebase Hosting. Automatic checks are disabled in development builds; manual checks remain available. Downloaded updates are held in memory until installed or the app quits; an uninstalled update downloads again at the next launch.

The public verification key is embedded in `src-tauri/tauri.conf.json`. The private signing key for this development machine is at `%USERPROFILE%/.tauri/taskflow.key`, outside the repository, with access restricted to the current Windows user and SYSTEM. **Keep a secure backup of this key.** Future releases must use the same key so installed apps trust them. Builds can instead read `TAURI_SIGNING_PRIVATE_KEY` (file path or contents) and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` from the process environment. Do not put the private key in frontend environment variables, source files, or release assets.

Release workflow from the repository root:

1. Run `npm run release:prepare -- 1.2.8` with the next version, then update `RELEASE_NOTES.md`.
2. Run `npm run release:build` (or `npm run widget:build`). This builds the frontend and NSIS installer, generates its `.sig` and `latest.json`, and verifies the signature against the app's public key, including rejecting tampered bytes.
3. Commit the changes and push to `origin/main`.
4. Run `npm run release:publish`. It uploads the installer, signature, and manifest into a draft GitHub release, then publishes it as latest after all assets are present. If uploading fails, inspect or remove that draft before retrying; do not publish incomplete assets.
5. Run `npx firebase-tools deploy --only hosting:app --project taskflow-474ab` to publish the web build with the new installer link.

The updater reads `https://github.com/AlfianESetyawan/TaskFlow/releases/latest/download/latest.json`. Always publish future desktop releases through this workflow so the latest release contains a valid update manifest. GitHub CLI authentication and Firebase CLI authentication are required to publish.

## Data model

All data is scoped to the signed in user: `users/{uid}/tasks`, `projects`, `templates`, and `activityLogs`. The app uses live Firestore listeners, capped at 1,000 tasks, 300 projects, 200 templates, and 100 recent activity entries. Task reads, filters, dashboard metrics, and charts derive from those live collections. Deadlines are empty strings when absent and are never filled automatically. Recurring tasks create the next occurrence when the current one is completed; an occurrence key prevents duplicates visible in the current task window.

Task dialogs open in a wide two-column view, with a compact view available from the header. Task details use a single progress slider that saves on release or keyboard adjustment. Both layouts support mobile screens and dark mode.

Tasks have a manually set progress percentage from 0 to 100 in both the task details and edit dialogs. Setting it to 100 completes the task; completing through a checkbox or Kanban also sets it to 100. Reopening a completed task restarts progress at 0. Older tasks without a stored percentage display 0, or 100 if already completed. Project progress is the average of its tasks' percentages.

All Tasks uses task cards with descriptions, dates, status, progress, subtasks, references, and reminders. Project workspaces show their task cards and progress summary; new tasks created there start with that project selected.

The `src/services/data.ts` functions are shared by the web app and Tauri widget. Settings are stored in browser or WebView local storage; data export downloads JSON.

Today's Focus shows tasks due today first, followed by tasks assigned today. If nothing is due today, it ranks all active tasks using task priority (20/40/60/80 points from low to urgent), project priority (up to 12 points), and deadline proximity (50 points today, increasing for overdue work and decreasing for later deadlines). A task assigned today gets 8 additional points. The same shared selection and ranking function supplies the first five tasks to both the dashboard and the widget Focus view.

## Windows widget (Tauri v2)

The widget is a companion window backed by the same Firebase account and Firestore collections. It has Focus, Next 7 days, Overdue, and No date views, Quick Add, task completion with Undo, and a tray menu. Selecting a task opens its details in the full TaskFlow window.

Each task can have an optional notification date and time. The installed Tauri app checks reminders while running, including when its windows are hidden in the system tray, and sends a native Windows toast. Completed or archived tasks do not notify. If the app starts up to 15 minutes after a reminder, it catches up once; reminders require the app to be running and Windows notification permission. Native desktop notifications cannot be scheduled by the Tauri plugin while the app is closed.

1. Install the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/): Rust with the MSVC toolchain, Microsoft C++ Build Tools with the Windows SDK, and WebView2. Check your setup with `npm exec tauri info`.
2. Keep the same `VITE_FIREBASE_*` values in `.env` as the web app. Enable Firebase Email/Password and Google authentication, and deploy the repository's Firestore rules. In Google Cloud Console, select the **same project as Firebase** and create an OAuth client with application type **Desktop app**, then set its client ID as `VITE_GOOGLE_DESKTOP_CLIENT_ID` in `.env`. The number before the hyphen in that ID should match `VITE_FIREBASE_MESSAGING_SENDER_ID`. If Google reports `client_secret is missing` during token exchange, set `GOOGLE_DESKTOP_CLIENT_SECRET` to the secret shown for that Desktop client and rebuild. The web OAuth client ID is not suitable for the desktop loopback redirect. Desktop OAuth client secrets are embedded in installed applications and cannot be kept confidential.
3. Run `npm install`, then `npm run widget:dev`. For an installer, run `npm run widget:build`; the NSIS output is under `src-tauri/target/release/bundle/nsis/`.

The Windows prerequisites are installed on this development machine. If an existing terminal cannot find `cargo`, restart the terminal or IDE so it picks up Rust's PATH entry. The 1.2.7 installer is built at `src-tauri/target/release/bundle/nsis/TaskFlow_1.2.7_x64-setup.exe`. The main window disables Tauri's native file-drop handler so Kanban and calendar HTML drag and drop work in WebView2.

For a quick UI preview without Rust, run `npm run dev` and open `http://localhost:5173/?widget-preview=1`. Browser preview uses that browser's Firebase session. The installed widget uses WebView2 storage and requires a separate sign-in. Its Google button opens the default browser and receives the result through a temporary `127.0.0.1` callback, which times out after three minutes. The full Tauri window uses the same flow. The web app continues to use Firebase's browser popup.

Closing the widget hides it in the tray. Use the tray's Quit command to exit. The full TaskFlow window is initialized hidden at startup and shown on demand. Both windows pause their Firestore listeners while hidden and resubscribe when shown. The app saves window size and position for the next launch; visibility is controlled separately so the full window still starts hidden. See `NEXT_STEPS.md` for interaction testing and later desktop features.

## Current limits

- The Windows widget compiles, starts, and renders both windows in WebView2, but the installed app's sign-in, tray interactions, and live Firestore synchronization still need interactive verification.
- The task listener is capped at 1,000 documents. Additional query based pagination is needed for larger accounts.
- Recurrence generation happens in the client and therefore requires the user to complete a task in the app. A background scheduler would be needed for autonomous generation.
- Calendar drag and drop and Kanban drag and drop use native HTML drag events; touch devices can change dates and status through the task editor.
