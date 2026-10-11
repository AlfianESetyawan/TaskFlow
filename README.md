# TaskFlow

TaskFlow 1.2.1 is a React, TypeScript, Vite, and Firebase task manager built from the static mockups in `Design/stitch_taskflow_modern_productivity_platform/`. The original design files remain untouched.

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

To publish the prepared web build to Firebase Hosting, run `npm run build` and then `firebase deploy --only hosting:app`. Add `taskflow-byaleks.web.app` to Firebase Authentication's authorized domains before signing in on the published site. Deploy Firestore rules separately with `firebase deploy --only firestore` when they change.

## Data model

All data is scoped to the signed in user: `users/{uid}/tasks`, `projects`, `templates`, and `activityLogs`. The app uses live Firestore listeners, capped at 1,000 tasks, 300 projects, 200 templates, and 100 recent activity entries. Task reads, filters, dashboard metrics, and charts derive from those live collections. Deadlines are empty strings when absent and are never filled automatically. Recurring tasks create the next occurrence when the current one is completed; an occurrence key prevents duplicates visible in the current task window.

The `src/services/data.ts` functions are shared by the web app and Tauri widget. Settings are stored in browser or WebView local storage; data export downloads JSON.

## Windows widget (Tauri v2)

The widget is a companion window backed by the same Firebase account and Firestore collections. It has Today, Next 7 days, Overdue, and No date views, Quick Add, task completion with Undo, and a tray menu. Selecting a task opens its details in the full TaskFlow window.

1. Install the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/): Rust with the MSVC toolchain, Microsoft C++ Build Tools with the Windows SDK, and WebView2. Check your setup with `npm exec tauri info`.
2. Keep the same `VITE_FIREBASE_*` values in `.env` as the web app. Enable Firebase Email/Password and Google authentication, and deploy the repository's Firestore rules. In Google Cloud Console, select the **same project as Firebase** and create an OAuth client with application type **Desktop app**, then set its client ID as `VITE_GOOGLE_DESKTOP_CLIENT_ID` in `.env`. The number before the hyphen in that ID should match `VITE_FIREBASE_MESSAGING_SENDER_ID`. If Google reports `client_secret is missing` during token exchange, set `GOOGLE_DESKTOP_CLIENT_SECRET` to the secret shown for that Desktop client and rebuild. The web OAuth client ID is not suitable for the desktop loopback redirect. Desktop OAuth client secrets are embedded in installed applications and cannot be kept confidential.
3. Run `npm install`, then `npm run widget:dev`. For an installer, run `npm run widget:build`; the NSIS output is under `src-tauri/target/release/bundle/nsis/`.

The Windows prerequisites are installed on this development machine. If an existing terminal cannot find `cargo`, restart the terminal or IDE so it picks up Rust's PATH entry. The 1.2.1 installer is built at `src-tauri/target/release/bundle/nsis/TaskFlow_1.2.1_x64-setup.exe`. The main window disables Tauri's native file-drop handler so Kanban and calendar HTML drag and drop work in WebView2.

For a quick UI preview without Rust, run `npm run dev` and open `http://localhost:5173/?widget-preview=1`. Browser preview uses that browser's Firebase session. The installed widget uses WebView2 storage and requires a separate sign-in. Its Google button opens the default browser and receives the result through a temporary `127.0.0.1` callback, which times out after three minutes. The full Tauri window uses the same flow. The web app continues to use Firebase's browser popup.

Closing the widget hides it in the tray. Use the tray's Quit command to exit. The full TaskFlow window is initialized hidden at startup and shown on demand. Both windows pause their Firestore listeners while hidden and resubscribe when shown. The app saves window size and position for the next launch; visibility is controlled separately so the full window still starts hidden. See `NEXT_STEPS.md` for interaction testing and later desktop features.

## Current limits

- The Windows widget compiles, starts, and renders both windows in WebView2, but the installed app's sign-in, tray interactions, and live Firestore synchronization still need interactive verification.
- The task listener is capped at 1,000 documents. Additional query based pagination is needed for larger accounts.
- Recurrence generation happens in the client and therefore requires the user to complete a task in the app. A background scheduler would be needed for autonomous generation.
- Calendar drag and drop and Kanban drag and drop use native HTML drag events; touch devices can change dates and status through the task editor.
