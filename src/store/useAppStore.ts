import { create } from "zustand";
import { db } from "@/lib/db";
import { calcPlannedMinutes } from "@/utils/time";
import { createMockSessions, createMockSubjects } from "@/utils/mockData";
import { applyTheme, getThemeColors } from "@/utils/themes";
import { getInitialAchievements, calculateAchievements } from "@/utils/achievements";
import type { StudySession, Subject, TimerSnapshot, ThemeName, Achievement, AchievementType, RecurrenceConfig, SessionStatus } from "@/types/models";

interface CreateSessionInput {
  subjectId: string;
  startTime: string;
  endTime: string;
  colorTag: string;
  notes: string;
  tags: string[];
}

export interface AppState {
  subjects: Subject[];
  sessions: StudySession[];
  timer: TimerSnapshot;
  loading: boolean;
  pomodoroMode: boolean;
  strictFocusMode: boolean;
  autoPauseOnHidden: boolean;
  dailyGoalHours: number;
  weeklyTargetHours: number;
  focusMusicEnabled: boolean;
  notificationsEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  theme: ThemeName;
  achievements: Achievement[];
  dailyGoalHitStreak: number;
  totalXP: number;
  level: number;
  rank: string;
  xpToNextLevel: number;
  xpProgress: number; // 0-100
  initApp: () => Promise<void>;
  createSubject: (name: string, color: string, emoji?: string, weeklyGoalMinutes?: number) => Promise<void>;
  updateSubject: (id: string, name: string, color: string, emoji?: string, weeklyGoalMinutes?: number) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  createSession: (input: CreateSessionInput) => Promise<void>;
  updateSession: (session: StudySession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  importAll: (subjects: Subject[], sessions: StudySession[]) => Promise<void>;
  addManualEntry: (input: {
    subjectId: string;
    date: string;
    hours: number;
    notes?: string;
    tags?: string[];
  }) => Promise<void>;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  setHiddenAt: (ms: number | null) => Promise<void>;
  markTimerInteraction: (ms?: number) => Promise<void>;
  getActiveElapsed: (nowMs: number) => number;
  syncActiveSession: (nowMs?: number) => Promise<void>;
  setPomodoroMode: (enabled: boolean) => void;
  setStrictFocusMode: (enabled: boolean) => void;
  setAutoPauseOnHidden: (enabled: boolean) => void;
  setDailyGoalHours: (hours: number) => void;
  setWeeklyTargetHours: (hours: number) => void;
  setFocusMusicEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeName) => void;
  recalculateAchievements: () => void;
  setDailyGoalHitStreak: (streak: number) => void;
  cloneSession: (sessionId: string, targetDate: string) => Promise<void>;
  rescheduleSession: (sessionId: string, targetDate: string) => Promise<void>;
  moveSessionToNextDay: (sessionId: string) => Promise<void>;
  createRecurringSessions: (sessionId: string, config: RecurrenceConfig) => Promise<void>;
  bulkReschedule: (sessionIds: string[], offsetDays: number) => Promise<void>;
}

const defaultTimer: TimerSnapshot = {
  activeSessionId: null,
  startedAtMs: null,
  accumulatedSeconds: 0,
  pausedAtMs: null,
  isPaused: false,
  hiddenAtMs: null,
  lastInteractionAtMs: null,
};

const STRICT_INACTIVITY_LIMIT_MS = 60 * 1000;

async function saveTimer(timer: TimerSnapshot): Promise<void> {
  await db.settings.put({ key: "timer", value: JSON.stringify(timer) });
}

function sortSessions(sessions: StudySession[]) {
  return [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

function calculateDailyStreak(sessions: StudySession[]): number {
  const days = new Set<string>();
  sessions.forEach((s) => {
    if (s.actualSeconds > 0) {
      const day = new Date(s.startTime).toDateString();
      days.add(day);
    }
  });
  return days.size;
}
function calculateGamificationStats(sessions: StudySession[]) {
  const totalSeconds = sessions.reduce((sum, s) => sum + s.actualSeconds, 0);
  const totalXP = Math.floor(totalSeconds / 36);
  const level = Math.floor(totalXP / 1000) + 1;
  const xpInCurrentLevel = totalXP % 1000;
  const xpProgress = (xpInCurrentLevel / 1000) * 100;
  const xpToNextLevel = 1000 - xpInCurrentLevel;

  let rank = "Seeker";
  if (level > 50) rank = "Zen Sage";
  else if (level > 40) rank = "Grandmaster";
  else if (level > 30) rank = "Master";
  else if (level > 20) rank = "Architect";
  else if (level > 10) rank = "Scholar";

  return { totalXP, level, rank, xpToNextLevel, xpProgress };
}

function clampElapsedSeconds(session: StudySession | undefined, elapsedSeconds: number) {
  if (!session) return Math.max(0, elapsedSeconds);
  const hardCap = Math.max(session.plannedMinutes * 60, 0);
  if (hardCap <= 0) return Math.max(0, elapsedSeconds);
  return Math.max(0, Math.min(elapsedSeconds, hardCap));
}

export const useAppStore = create<AppState>()((set: any, get: any) => ({
  subjects: [],
  sessions: [],
  timer: defaultTimer,
  loading: true,
  pomodoroMode: false,
  strictFocusMode: false,
  autoPauseOnHidden: true,
  dailyGoalHours: 4,
  weeklyTargetHours: 20,
  focusMusicEnabled: false,
  notificationsEnabled: true,
  keyboardShortcutsEnabled: true,
  theme: "default",
  achievements: getInitialAchievements(),
  dailyGoalHitStreak: 0,
  totalXP: 0,
  level: 1,
  rank: "Seeker",
  xpToNextLevel: 1000,
  xpProgress: 0,

  initApp: async () => {
    const [subjects, sessions, timerSetting, pomodoroSetting, goalSetting, strictFocusSetting, weeklyTargetSetting, focusMusicSetting, notificationsSetting, keyboardShortcutsSetting, themeSetting, achievementsSetting, dailyGoalHitStreakSetting, autoPauseOnHiddenSetting] = await Promise.all([
      db.subjects.toArray(),
      db.sessions.toArray(),
      db.settings.get("timer"),
      db.settings.get("pomodoroMode"),
      db.settings.get("dailyGoalHours"),
      db.settings.get("strictFocusMode"),
      db.settings.get("weeklyTargetHours"),
      db.settings.get("focusMusicEnabled"),
      db.settings.get("notificationsEnabled"),
      db.settings.get("keyboardShortcutsEnabled"),
      db.settings.get("theme"),
      db.settings.get("achievements"),
      db.settings.get("dailyGoalHitStreak"),
      db.settings.get("autoPauseOnHidden"),
    ]);

    if (subjects.length === 0 && sessions.length === 0) {
      const seedSubjects = createMockSubjects();
      const seedSessions = createMockSessions();
      await db.subjects.bulkPut(seedSubjects);
      await db.sessions.bulkPut(seedSessions);
      set({ 
        subjects: seedSubjects, 
        sessions: sortSessions(seedSessions), 
        loading: false,
        ...calculateGamificationStats(seedSessions)
      });
      return;
    }

    const themeValue = (themeSetting?.value ?? "default") as ThemeName;
    applyTheme(getThemeColors(themeValue));

    const parsedTimer = timerSetting ? (JSON.parse(timerSetting.value) as Partial<TimerSnapshot>) : null;
    const safeTimer: TimerSnapshot = {
      ...defaultTimer,
      ...parsedTimer,
      lastInteractionAtMs: parsedTimer?.lastInteractionAtMs ?? parsedTimer?.startedAtMs ?? null,
    };

    const unlockedIds: AchievementType[] = achievementsSetting ? JSON.parse(achievementsSetting.value) : [];
    const dailyStreak = calculateDailyStreak(sessions);
    const dailyGoalHitStreakVal = Number(dailyGoalHitStreakSetting?.value ?? 0);
    const achievements = calculateAchievements(sessions, subjects, dailyStreak, unlockedIds, dailyGoalHitStreakVal);

    set({
      subjects,
      sessions: sortSessions(sessions),
      timer: safeTimer,
      ...calculateGamificationStats(sessions),
      pomodoroMode: pomodoroSetting?.value === "true",
      strictFocusMode: strictFocusSetting?.value === "true",
      autoPauseOnHidden: autoPauseOnHiddenSetting?.value === "true",
      dailyGoalHours: Number(goalSetting?.value ?? 4),
      weeklyTargetHours: Number(weeklyTargetSetting?.value ?? 20),
      focusMusicEnabled: focusMusicSetting?.value === "true",
      notificationsEnabled: notificationsSetting?.value === "true",
      keyboardShortcutsEnabled: keyboardShortcutsSetting?.value === "true",
      theme: themeValue,
      achievements,
      dailyGoalHitStreak: dailyGoalHitStreakVal,
      loading: false,
    });
  },

  createSubject: async (name: string, color: string, emoji?: string, weeklyGoalMinutes?: number) => {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name,
      color,
      emoji,
      weeklyGoalMinutes,
      createdAt: new Date().toISOString(),
    };
    await db.subjects.add(newSubject);
    set((state: AppState) => ({ subjects: [...state.subjects, newSubject] }));
  },

  updateSubject: async (id: string, name: string, color: string, emoji?: string, weeklyGoalMinutes?: number) => {
    await db.subjects.update(id, { name, color, emoji, weeklyGoalMinutes });
    set((state: AppState) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, name, color, emoji, weeklyGoalMinutes } : s)),
      sessions: state.sessions.map((session) => (session.subjectId === id ? { ...session, colorTag: color } : session)),
    }));
  },

  deleteSubject: async (id: string) => {
    await db.subjects.delete(id);
    await db.sessions.where("subjectId").equals(id).delete();
    const timer = get().timer;
    if (timer.activeSessionId) {
      const activeSession = get().sessions.find((session: StudySession) => session.id === timer.activeSessionId);
      if (activeSession?.subjectId === id) {
        await saveTimer(defaultTimer);
        set({ timer: defaultTimer });
      }
    }
      set((state: AppState) => {
        const newSessions = state.sessions.filter((session) => session.subjectId !== id);
        return {
          subjects: state.subjects.filter((subject) => subject.id !== id),
          sessions: sortSessions(newSessions),
          ...calculateGamificationStats(newSessions)
        };
      });
  },

  createSession: async (input: CreateSessionInput) => {
    const plannedMinutes = calcPlannedMinutes(input.startTime, input.endTime);
    const session: StudySession = {
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      startTime: input.startTime,
      endTime: input.endTime,
      plannedMinutes,
      actualSeconds: 0,
      colorTag: input.colorTag,
      notes: input.notes,
      tags: input.tags,
      status: "planned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manualEntry: false,
    };
    await db.sessions.add(session);
    set((state: AppState) => {
      const newSessions = [session, ...state.sessions];
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  updateSession: async (session: StudySession) => {
    const updated = { ...session, updatedAt: new Date().toISOString() };
    await db.sessions.put(updated);

    const timer = get().timer;
    if (timer.activeSessionId === updated.id) {
      const nextTimer: TimerSnapshot = {
        ...timer,
        accumulatedSeconds: clampElapsedSeconds(updated, updated.actualSeconds),
        startedAtMs: timer.isPaused ? null : Date.now(),
        lastInteractionAtMs: timer.lastInteractionAtMs ?? Date.now(),
      };
      await saveTimer(nextTimer);
      set((state: AppState) => {
        const newSessions = state.sessions.map((item: StudySession) => (item.id === updated.id ? { ...updated, actualSeconds: nextTimer.accumulatedSeconds } : item));
        return {
          timer: nextTimer,
          sessions: sortSessions(newSessions),
          ...calculateGamificationStats(newSessions)
        };
      });
      return;
    }

    set((state: AppState) => {
      const newSessions = state.sessions.map((item: StudySession) => (item.id === updated.id ? updated : item));
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  deleteSession: async (id: string) => {
    await db.sessions.delete(id);
    const timer = get().timer;
    if (timer.activeSessionId === id) {
      await saveTimer(defaultTimer);
      set((state: AppState) => {
        const newSessions = state.sessions.filter((item: StudySession) => item.id !== id);
        return {
          timer: defaultTimer,
          sessions: sortSessions(newSessions),
          ...calculateGamificationStats(newSessions)
        };
      });
      return;
    }
    set((state: AppState) => {
      const newSessions = state.sessions.filter((item: StudySession) => item.id !== id);
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  importAll: async (subjects: Subject[], sessions: StudySession[]) => {
    await (db as any).transaction("rw", [db.subjects, db.sessions], async () => {
      await db.subjects.clear();
      await db.sessions.clear();
      await db.subjects.bulkAdd(subjects);
      await db.sessions.bulkAdd(sessions);
    });
    set({ 
      subjects, 
      sessions: sortSessions(sessions),
      ...calculateGamificationStats(sessions)
    });
  },

  addManualEntry: async (input: { subjectId: string; date: string; hours: number; notes?: string; tags?: string[] }) => {
    const plannedMinutes = input.hours * 60;
    const session: StudySession = {
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      startTime: input.date,
      endTime: input.date,
      plannedMinutes,
      actualSeconds: plannedMinutes * 60,
      colorTag: get().subjects.find((s: Subject) => s.id === input.subjectId)?.color ?? "#ccc",
      notes: input.notes ?? "",
      tags: input.tags ?? [],
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manualEntry: true,
    };
    await db.sessions.add(session);
    set((state: AppState) => {
      const newSessions = [session, ...state.sessions];
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  startSession: async (sessionId: string) => {
    const session = get().sessions.find((item: StudySession) => item.id === sessionId);
    if (!session) return;

    const currentTimer = get().timer;
    if (currentTimer.activeSessionId && currentTimer.activeSessionId !== sessionId) {
      await get().stopSession();
    }

    const now = Date.now();
    const timer: TimerSnapshot = {
      activeSessionId: session.id,
      startedAtMs: now,
      accumulatedSeconds: clampElapsedSeconds(session, session.actualSeconds),
      pausedAtMs: null,
      isPaused: false,
      hiddenAtMs: null,
      lastInteractionAtMs: now,
    };
    await saveTimer(timer);
    await db.sessions.update(session.id, { status: "in_progress", updatedAt: new Date().toISOString() });
      set((state: AppState) => {
        const newSessions: StudySession[] = state.sessions.map((item: StudySession) => (item.id === session.id ? { ...item, status: "in_progress" as SessionStatus, updatedAt: new Date().toISOString() } : item));
        return {
          timer,
          sessions: sortSessions(newSessions),
          ...calculateGamificationStats(newSessions)
        };
      });
  },

  pauseSession: async () => {
    const timer = get().timer;
    if (!timer.activeSessionId || timer.isPaused || !timer.startedAtMs) return;
    const activeSession = get().sessions.find((session: StudySession) => session.id === timer.activeSessionId);
    const elapsedSinceStart = Math.floor((Date.now() - timer.startedAtMs) / 1000);
    const nextAccumulated = clampElapsedSeconds(activeSession, timer.accumulatedSeconds + elapsedSinceStart);
    const nextTimer: TimerSnapshot = {
      ...timer,
      accumulatedSeconds: nextAccumulated,
      isPaused: true,
      pausedAtMs: Date.now(),
      startedAtMs: null,
      hiddenAtMs: null,
    };
    await saveTimer(nextTimer);
    await db.sessions.update(timer.activeSessionId, {
      status: "paused",
      actualSeconds: nextAccumulated,
      updatedAt: new Date().toISOString(),
    });
    set((state: AppState) => {
      const newSessions: StudySession[] = state.sessions.map((session: StudySession) =>
        session.id === timer.activeSessionId
          ? { ...session, status: "paused" as SessionStatus, actualSeconds: nextAccumulated, updatedAt: new Date().toISOString() }
          : session
      );
      return {
        timer: nextTimer,
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  resumeSession: async () => {
    const timer = get().timer;
    if (!timer.activeSessionId || !timer.isPaused) return;
    const now = Date.now();
    const nextTimer: TimerSnapshot = {
      ...timer,
      startedAtMs: now,
      isPaused: false,
      pausedAtMs: null,
      hiddenAtMs: null,
      lastInteractionAtMs: now,
    };
    await saveTimer(nextTimer);
    await db.sessions.update(timer.activeSessionId, { status: "in_progress", updatedAt: new Date().toISOString() });
    set((state: AppState) => {
      const newSessions: StudySession[] = state.sessions.map((session: StudySession) =>
        session.id === timer.activeSessionId ? { ...session, status: "in_progress" as SessionStatus, updatedAt: new Date().toISOString() } : session
      );
      return {
        timer: nextTimer,
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  stopSession: async () => {
    const timer = get().timer;
    if (!timer.activeSessionId) return;
    const activeSession = get().sessions.find((session: StudySession) => session.id === timer.activeSessionId);
    const elapsed = clampElapsedSeconds(activeSession, get().getActiveElapsed(Date.now()));
    await db.sessions.update(timer.activeSessionId, {
      status: "completed",
      actualSeconds: elapsed,
      updatedAt: new Date().toISOString(),
    });
    await saveTimer(defaultTimer);
    set((state: AppState) => {
      const newSessions: StudySession[] = state.sessions.map((session: StudySession) =>
        session.id === timer.activeSessionId
          ? { ...session, actualSeconds: elapsed, status: "completed" as SessionStatus, updatedAt: new Date().toISOString() }
          : session
      );
      return {
        timer: defaultTimer,
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  setHiddenAt: async (ms: number | null) => {
    const nextTimer = { ...get().timer, hiddenAtMs: ms };
    await saveTimer(nextTimer);
    set({ timer: nextTimer });
  },

  markTimerInteraction: async (ms?: number) => {
    const timer = get().timer;
    if (!timer.activeSessionId) return;
    const nextTimer = { ...timer, lastInteractionAtMs: ms ?? Date.now() };
    await saveTimer(nextTimer);
    set({ timer: nextTimer });
  },

  getActiveElapsed: (nowMs: number) => {
    const timer = get().timer;
    if (!timer.activeSessionId) return 0;

    const activeSession = get().sessions.find((session: StudySession) => session.id === timer.activeSessionId);
    if (!activeSession) return timer.accumulatedSeconds;
    if (timer.isPaused || !timer.startedAtMs) return clampElapsedSeconds(activeSession, timer.accumulatedSeconds);

    const strictFocusMode = get().strictFocusMode;
    const autoPauseOnHidden = get().autoPauseOnHidden;
    const rawDeltaMs = Math.max(0, nowMs - timer.startedAtMs);

    if (!strictFocusMode && !autoPauseOnHidden) {
      return clampElapsedSeconds(activeSession, timer.accumulatedSeconds + Math.floor(rawDeltaMs / 1000));
    }

    const hiddenAtMs = timer.hiddenAtMs;
    const lastInteractionAtMs = timer.lastInteractionAtMs ?? timer.startedAtMs;
    const interactionExpiryMs = lastInteractionAtMs + STRICT_INACTIVITY_LIMIT_MS;

    let cutoffMs = nowMs;
    if (strictFocusMode) {
      cutoffMs = Math.min(cutoffMs, interactionExpiryMs);
    }
    if (autoPauseOnHidden && hiddenAtMs !== null) {
      cutoffMs = Math.min(cutoffMs, hiddenAtMs);
    }

    const approvedDeltaMs = Math.max(0, cutoffMs - timer.startedAtMs);

    return clampElapsedSeconds(activeSession, timer.accumulatedSeconds + Math.floor(approvedDeltaMs / 1000));
  },

  syncActiveSession: async (nowMs?: number) => {
    const timer = get().timer;
    if (!timer.activeSessionId) return;
    
    const activeSession = get().sessions.find((s: StudySession) => s.id === timer.activeSessionId);
    if (!activeSession) return;

    if (timer.isPaused || !timer.startedAtMs) return;

    const currentMs = nowMs ?? Date.now();
    const elapsed = get().getActiveElapsed(currentMs);
    const clampedElapsed = clampElapsedSeconds(activeSession, elapsed);

    await db.sessions.update(timer.activeSessionId, { 
      actualSeconds: clampedElapsed,
      updatedAt: new Date().toISOString()
    });
    
    set((state: AppState) => {
      const newSessions: StudySession[] = state.sessions.map((session: StudySession) =>
        session.id === timer.activeSessionId ? { ...session, actualSeconds: clampedElapsed, updatedAt: new Date().toISOString() } : session
      );
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  setPomodoroMode: (enabled: boolean) => {
    void db.settings.put({ key: "pomodoroMode", value: String(enabled) });
    set({ pomodoroMode: enabled });
  },

  setStrictFocusMode: (enabled: boolean) => {
    void db.settings.put({ key: "strictFocusMode", value: String(enabled) });
    set({ strictFocusMode: enabled });
  },

  setAutoPauseOnHidden: (enabled: boolean) => {
    void db.settings.put({ key: "autoPauseOnHidden", value: String(enabled) });
    set({ autoPauseOnHidden: enabled });
  },

  setDailyGoalHours: (hours: number) => {
    void db.settings.put({ key: "dailyGoalHours", value: String(hours) });
    set({ dailyGoalHours: hours });
  },

  setWeeklyTargetHours: (hours: number) => {
    void db.settings.put({ key: "weeklyTargetHours", value: String(hours) });
    set({ weeklyTargetHours: hours });
  },

  setFocusMusicEnabled: (enabled: boolean) => {
    void db.settings.put({ key: "focusMusicEnabled", value: String(enabled) });
    set({ focusMusicEnabled: enabled });
  },

  setNotificationsEnabled: (enabled: boolean) => {
    void db.settings.put({ key: "notificationsEnabled", value: String(enabled) });
    set({ notificationsEnabled: enabled });
  },

  setKeyboardShortcutsEnabled: (enabled: boolean) => {
    void db.settings.put({ key: "keyboardShortcutsEnabled", value: String(enabled) });
    set({ keyboardShortcutsEnabled: enabled });
  },

  setTheme: (theme: ThemeName) => {
    void db.settings.put({ key: "theme", value: theme });
    applyTheme(getThemeColors(theme));
    set({ theme });
  },

  recalculateAchievements: () => {
    const { sessions, subjects, dailyGoalHitStreak } = get();
    const dailyStreak = calculateDailyStreak(sessions);
    const achievements = calculateAchievements(sessions, subjects, dailyStreak, [], dailyGoalHitStreak);
    set({ achievements });
  },

  setDailyGoalHitStreak: (streak: number) => {
    void db.settings.put({ key: "dailyGoalHitStreak", value: String(streak) });
    set({ dailyGoalHitStreak: streak });
  },

  cloneSession: async (sessionId: string, targetDate: string) => {
    const session = get().sessions.find((s: StudySession) => s.id === sessionId);
    if (!session) return;

    const originalStart = new Date(session.startTime);
    const originalEnd = new Date(session.endTime);
    const targetDateObj = new Date(targetDate);

    // Keep same time, change date
    const newStart = new Date(targetDateObj);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

    const newEnd = new Date(targetDateObj);
    newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);

    // Handle overnight sessions
    if (newEnd <= newStart) {
      newEnd.setDate(newEnd.getDate() + 1);
    }

    const clonedSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      plannedMinutes: calcPlannedMinutes(newStart.toISOString(), newEnd.toISOString()),
      actualSeconds: 0,
      status: "planned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manualEntry: false,
      parentSessionId: session.id,
    };

    await db.sessions.add(clonedSession);
    set((state: AppState) => {
      const newSessions = [clonedSession, ...state.sessions];
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },

  rescheduleSession: async (sessionId: string, targetDate: string) => {
    const session = get().sessions.find((s: StudySession) => s.id === sessionId);
    if (!session) return;

    const originalStart = new Date(session.startTime);
    const originalEnd = new Date(session.endTime);
    const targetDateObj = new Date(targetDate);

    // Keep same time, change date
    const newStart = new Date(targetDateObj);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

    const newEnd = new Date(targetDateObj);
    newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);

    // Handle overnight sessions
    if (newEnd <= newStart) {
      newEnd.setDate(newEnd.getDate() + 1);
    }

    const updated: StudySession = {
      ...session,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      plannedMinutes: calcPlannedMinutes(newStart.toISOString(), newEnd.toISOString()),
      updatedAt: new Date().toISOString(),
    };

    await db.sessions.put(updated);
    set((state: AppState) => {
      const newSessions = state.sessions.map((s: StudySession) => (s.id === sessionId ? updated : s));
      return {
        sessions: sortSessions(newSessions),
        ...calculateGamificationStats(newSessions)
      };
    });
  },


  moveSessionToNextDay: async (sessionId: string) => {
    const session = get().sessions.find((s: StudySession) => s.id === sessionId);
    if (!session) return;

    const currentStart = new Date(session.startTime);
    const nextDay = new Date(currentStart);
    nextDay.setDate(nextDay.getDate() + 1);

    await get().rescheduleSession(sessionId, nextDay.toISOString().split("T")[0]);
  },

  createRecurringSessions: async (sessionId: string, config: RecurrenceConfig) => {
    const session = get().sessions.find((s: StudySession) => s.id === sessionId);
    if (!session || config.type === "none") return;

    const seriesId = crypto.randomUUID();
    const originalStart = new Date(session.startTime);
    const originalEnd = new Date(session.endTime);
    const maxOccurrences = config.occurrences ?? 30;
    const endDate = config.endDate ? new Date(config.endDate) : null;

    const newSessions: StudySession[] = [];
    let currentDate = new Date(originalStart);

    for (let i = 0; i < maxOccurrences; i++) {
      // Skip first (original session)
      if (i === 0) {
        // Update original with series info
        const updated = { ...session, seriesId, recurrence: config, updatedAt: new Date().toISOString() };
        await db.sessions.put(updated);
        set((state: AppState) => {
        const newSessions = state.sessions.map((s) => (s.id === sessionId ? updated : s));
        return {
          sessions: sortSessions(newSessions),
          ...calculateGamificationStats(newSessions)
        };
      });
        // Move to next occurrence
        currentDate = getNextOccurrence(currentDate, config);
        continue;
      }

      // Check end date
      if (endDate && currentDate > endDate) break;

      const newStart = new Date(currentDate);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

      const newEnd = new Date(currentDate);
      newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);

      if (newEnd <= newStart) {
        newEnd.setDate(newEnd.getDate() + 1);
      }

      const recurring: StudySession = {
        id: crypto.randomUUID(),
        subjectId: session.subjectId,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        plannedMinutes: session.plannedMinutes,
        actualSeconds: 0,
        colorTag: session.colorTag,
        notes: session.notes,
        tags: session.tags,
        status: "planned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualEntry: false,
        seriesId,
        parentSessionId: session.id,
        recurrence: config,
      };

      newSessions.push(recurring);
      currentDate = getNextOccurrence(currentDate, config);
    }

    if (newSessions.length > 0) {
      await db.sessions.bulkAdd(newSessions);
      set((state: AppState) => ({ sessions: sortSessions([...newSessions, ...state.sessions]) }));
    }
  },

  bulkReschedule: async (sessionIds: string[], offsetDays: number) => {
    const updates: StudySession[] = [];

    for (const id of sessionIds) {
      const session = get().sessions.find((s: StudySession) => s.id === id);
      if (!session) continue;

      const newStart = new Date(session.startTime);
      newStart.setDate(newStart.getDate() + offsetDays);

      const newEnd = new Date(session.endTime);
      newEnd.setDate(newEnd.getDate() + offsetDays);

      const updated: StudySession = {
        ...session,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updates.push(updated);
      await db.sessions.put(updated);
    }

    set((state: AppState) => ({
      sessions: sortSessions(
        state.sessions.map((s: StudySession) => {
          const update = updates.find((u: StudySession) => u.id === s.id);
          return update ?? s;
        })
      ),
    }));
  },
}));

// Helper to calculate next occurrence based on recurrence config
function getNextOccurrence(current: Date, config: RecurrenceConfig): Date {
  const next = new Date(current);
  const interval = config.interval || 1;

  switch (config.type) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = next.getDay();
        const sortedDays = [...config.daysOfWeek].sort((a, b) => a - b);
        const nextDay = sortedDays.find((d) => d > currentDay);
        if (nextDay !== undefined) {
          next.setDate(next.getDate() + (nextDay - currentDay));
        } else {
          // Go to next week's first day
          next.setDate(next.getDate() + (7 - currentDay + sortedDays[0]) + (interval - 1) * 7);
        }
      } else {
        next.setDate(next.getDate() + 7 * interval);
      }
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "custom":
      next.setDate(next.getDate() + interval);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}
