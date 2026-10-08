# TaskFlow Windows Widget — Tauri v2 Plan

## Goal

Build a lightweight Windows widget that uses the **same Firebase account and Firestore tasks** as the web app. It is a focused companion, not another copy of the full dashboard. Keep the existing TaskFlow design language and task behavior.

## Widget MVP

- Compact, movable window with light and dark themes.
- Today's focus: tasks assigned to today or due today.
- Separate **Upcoming**, **Overdue**, and **No Deadline** sections. Never invent a deadline for an unscheduled task.
- Quick Add with a required title and optional deadline and project.
- Complete/reopen a task and open its detail in the full app.
- Live synchronization with the web app.
- System tray controls to show/hide the widget, open TaskFlow, and quit.

Notifications, global shortcuts, autostart, and advanced editing follow after the MVP works.

## Current implementation (October 2026)

TaskFlow version 1.1.0 includes the first widget implementation in `src/widget/`, with a separate lazy-loaded React entry, shared Firebase services, a Tauri v2 shell, and a tray menu. Rust, Microsoft C++ Build Tools, the Windows SDK, and WebView2 are installed. `npm run build` and `npm run widget:build` pass. The native executable starts, and WebView2 inspection confirms that both the widget and full TaskFlow window render with their stylesheets. The NSIS installer is at `src-tauri/target/release/bundle/nsis/TaskFlow_1.1.0_x64-setup.exe`. Live desktop Firebase and installed-app interaction testing remain open.

### Completed native fixes

- [x] Build frontend assets with relative paths so packaged WebView2 windows load their CSS and JavaScript.
- [x] Use hash routing in Tauri's full window while retaining browser routing for the website.
- [x] Create the full window hidden at startup and show it on demand; opening it dynamically produced a blank WebView2 window.
- [x] Compile the Windows executable and NSIS installer, then confirm both app windows render through WebView2.
- [x] Add geometry persistence for both windows while preserving the widget-visible and full-window-hidden startup behavior.
- [x] Pause each window's Firestore listeners while hidden and resubscribe when it is shown.

## 1. Design the widget states

- [ ] Create compact and expanded mockups using the current palette, typography, priority colors, and task cards. Try a 320–380 px width, then adjust after testing real task titles and Windows display scaling.
- [x] Define task ordering, maximum visible items, and a way to open the full app for the rest.
- [ ] Design empty, loading, offline, signed-out, and permission-error states.
- [ ] Make every action accessible by keyboard and pointer; do not require drag and drop.

**Done when:** Each MVP state and interaction has a reviewable mockup.

## 2. Add the Tauri shell

- [x] Check Windows prerequisites: Rust with the MSVC toolchain, Microsoft C++ Build Tools, and WebView2. Add Tauri v2 to this Vite project while preserving the browser build. [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- [x] Create a dedicated widget entry or route and a Windows window. Begin with a normal window; add frameless or transparent styling after focus, resize, and accessibility behavior work. Tauri exposes `alwaysOnTop`, `decorations`, `transparent`, and `skipTaskbar` options. [Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [ ] Add a tray icon with Show/Hide, Open TaskFlow, and Quit. Closing the widget should hide it while the tray is active; Quit should exit the process. [System tray](https://v2.tauri.app/learn/system-tray/)
- [x] Save and restore the window's size and position with the window-state plugin. Its restore logic checks connected monitors and leaves placement to Windows if the saved monitor is unavailable. Test this on a disconnected monitor before release. [Window state plugin](https://v2.tauri.app/plugin/window-state/)

**Done when:** The widget launches, moves, hides, reopens, and quits predictably without breaking the web app.

## 3. Share data and handle desktop sign-in

- [x] Move selectors for today's focus, upcoming, overdue, and no-deadline tasks into shared TypeScript functions. Reuse `src/types.ts` and the Firebase services in `src/services/data.ts`; keep Tauri window calls separate.
- [ ] Connect the widget to the same user-scoped Firestore paths. Listeners and hide/show cleanup are implemented; verify live sync with a signed-in account.
- [ ] Test a separate desktop session. Web browser and WebView2 storage are separate, so do not assume website sign-in carries over. Start with email/password and verify persistence after app restart.
- [ ] Plan Google sign-in through the **system browser** with a safe return path. Google OAuth disallows authorization requests in embedded user agents; evaluate Tauri deep links and Windows single-instance handling before implementing this. [Google OAuth policy](https://developers.google.com/identity/protocols/oauth2/policies), [Tauri deep links](https://v2.tauri.app/reference/javascript/deep-link/)
- [ ] Keep Firebase Admin credentials and OAuth tokens out of the frontend bundle and plain widget settings. Retain Firestore ownership rules.

**Done when:** Widget and website show the same user's tasks, cross-device edits synchronize, sign-out clears the widget, and another account cannot access those tasks.

## 4. Implement MVP task actions

- [x] Render the four task sections with clear deadline and priority cues. No-deadline tasks must never appear as overdue.
- [x] Implement Quick Add with title validation, duplicate-submit protection, optional project/deadline, and a visible save result.
- [ ] Implement complete/reopen through the shared service so recurrence and activity behave like the web app.
- [ ] Add **Open in TaskFlow** for task details. Decide whether it opens the hosted site or a larger Tauri window, then verify the chosen path from an installed build.
- [ ] Handle offline and failed writes clearly. Show cached data only when available and label it as offline.

**Done when:** Quick Add, complete/reopen, and task opening work from the installed widget and synchronize without a refresh.

## 5. Add optional desktop features

- [ ] Add an optional always-on-top toggle and compact/expanded mode; persist both preferences and test with multiple monitors and fullscreen apps.
- [ ] Add a global show/hide shortcut if it does not conflict with common Windows shortcuts. [Global shortcut plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [ ] Add Start with Windows as an **opt-in** setting with an easy way to disable it. [Autostart API](https://v2.tauri.app/reference/javascript/autostart/)
- [ ] Consider deadline notifications only after defining quiet hours and duplicate prevention. Test Windows notifications from an installed build. [Notification plugin](https://v2.tauri.app/plugin/notification/)
- [ ] Grant the widget window only the Tauri commands and plugin permissions it needs. [Tauri capabilities](https://v2.tauri.app/security/capabilities/)

**Done when:** Optional desktop behaviors are reversible in settings and do not cause needless background activity.

## 6. Test and package for Windows

- [ ] Test Windows 10/11, 100%/150%/200% display scaling, multi-monitor movement, sleep/resume, network loss/reconnect, and restart.
- [ ] Test signed-out and expired-session states, two users on one PC, simultaneous web/widget edits, no-deadline tasks, recurrence, and permission errors.
- [ ] Measure memory, CPU, and Firestore reads while visible and hidden. Keep dashboard charts and other full-app modules out of the widget bundle.
- [ ] Install the built Windows installer on a clean machine and verify tray behavior, WebView2, authentication, and uninstall. The executable and NSIS installer already build successfully. [Windows installer](https://v2.tauri.app/distribute/windows-installer/)
- [x] Document widget setup, build commands, permissions, sign-in, and known limits in `README.md`.

**Release check:** The installed widget passes the MVP workflow on a clean Windows machine and the browser app still builds independently.
