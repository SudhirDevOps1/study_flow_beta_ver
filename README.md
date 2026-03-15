# FlowTrack

FlowTrack is a strict study tracking PWA built with React, Vite, TypeScript, Tailwind CSS, Zustand, and Dexie (IndexedDB).

## Features

- Planned vs actual session tracking
- System-clock-based strict timer with pause/resume
- Inactivity auto-pause via Visibility API
- Floating timer using Document Picture-in-Picture with draggable fallback widget
- Analytics dashboard (daily, weekly, monthly, yearly)
- Streak tracking and 90-day heatmap
- Session history with subject, completion, and date range filters
- Subject manager (create, edit, delete)
- Manual time entry for backfilling completed study
- JSON import/export backup (`study-backup.json`)
- Offline support with service worker caching and IndexedDB persistence
- PWA manifest + installable app support

## Project Structure

```text
src/
  components/
    charts/
    common/
    layout/
    session/
    timer/
  hooks/
  lib/
  pages/
  store/
  types/
  utils/
```

## Setup

1. Install dependencies:
   `npm install`
2. Start dev server:
   `npm run dev`
3. Build for production:
   `npm run build`
4. Preview production build:
   `npm run preview`

## Notes

- Timer accuracy is derived from timestamps (`Date.now`) instead of relying only on `setInterval` ticks.
- Running sessions are synced to IndexedDB every second for resilient recovery.
- Service worker is registered from `src/sw-register.ts`, with implementation in `public/sw.js`.