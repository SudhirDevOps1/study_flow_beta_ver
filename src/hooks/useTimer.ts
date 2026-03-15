import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const RELAXED_HIDDEN_PAUSE_MS = 10 * 60 * 1000;

export function useTimer() {
  const timer = useAppStore((state) => state.timer);
  const sessions = useAppStore((state) => state.sessions);
  const strictFocusMode = useAppStore((state) => state.strictFocusMode);
  const pauseSession = useAppStore((state) => state.pauseSession);
  const setHiddenAt = useAppStore((state) => state.setHiddenAt);
  const markTimerInteraction = useAppStore((state) => state.markTimerInteraction);
  const getActiveElapsed = useAppStore((state) => state.getActiveElapsed);
  const syncActiveSession = useAppStore((state) => state.syncActiveSession);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setNowMs(now);
      void syncActiveSession(now);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [syncActiveSession]);

  useEffect(() => {
    const onVisibleInteraction = () => {
      if (document.hidden) return;
      void markTimerInteraction(Date.now());
      setNowMs(Date.now());
    };

    const updateVisibility = () => {
      if (document.hidden) {
        void setHiddenAt(Date.now());
        void syncActiveSession(Date.now());
        return;
      }

      const hiddenAt = useAppStore.getState().timer.hiddenAtMs;
      const hiddenDuration = hiddenAt ? Date.now() - hiddenAt : 0;
      if (!strictFocusMode && hiddenAt && hiddenDuration > RELAXED_HIDDEN_PAUSE_MS) {
        void pauseSession();
        void setHiddenAt(null);
        return;
      }

      void setHiddenAt(null);
      void markTimerInteraction(Date.now());
      void syncActiveSession(Date.now());
      setNowMs(Date.now());
    };

    const syncOnExit = () => {
      void syncActiveSession(Date.now());
    };

    const syncOnFocus = () => {
      void markTimerInteraction(Date.now());
      void syncActiveSession(Date.now());
      setNowMs(Date.now());
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "mousemove", "touchstart"];

    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("pagehide", syncOnExit);
    window.addEventListener("focus", syncOnFocus);
    interactionEvents.forEach((eventName) => window.addEventListener(eventName, onVisibleInteraction, { passive: true }));

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("pagehide", syncOnExit);
      window.removeEventListener("focus", syncOnFocus);
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, onVisibleInteraction));
    };
  }, [markTimerInteraction, pauseSession, setHiddenAt, strictFocusMode, syncActiveSession]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === timer.activeSessionId) ?? null,
    [sessions, timer.activeSessionId]
  );

  const elapsedSeconds = getActiveElapsed(nowMs);
  const plannedSeconds = (activeSession?.plannedMinutes ?? 0) * 60;
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const progress = plannedSeconds > 0 ? Math.min(100, (elapsedSeconds / plannedSeconds) * 100) : 0;

  return { activeSession, elapsedSeconds, remainingSeconds, progress };
}
