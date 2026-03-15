import { useRef, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Panel } from "@/components/common/Panel";
import { useAppStore } from "@/store/useAppStore";
import type { AppState } from "@/store/useAppStore";
import { usePomodoro } from "@/hooks/usePomodoro";
import { exportData, importBackup } from "@/utils/exportImport";

import type { ThemeName } from "@/types/models";

function PomodoroSettingsPanel() {
  const pomodoro = usePomodoro();
  const { settings, saveSettings } = pomodoro;

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <label className="block text-sm text-slate-300">Focus Minutes</label>
        <input
          type="number"
          min={5}
          max={90}
          value={settings.workMinutes}
          onChange={(e) => updateSetting('workMinutes', parseInt(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-slate-300">Short Break Minutes</label>
        <input
          type="number"
          min={1}
          max={30}
          value={settings.shortBreakMinutes}
          onChange={(e) => updateSetting('shortBreakMinutes', parseInt(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-slate-300">Long Break Minutes</label>
        <input
          type="number"
          min={5}
          max={45}
          value={settings.longBreakMinutes}
          onChange={(e) => updateSetting('longBreakMinutes', parseInt(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-slate-300">Cycles Before Long Break</label>
        <input
          type="number"
          min={1}
          max={10}
          value={settings.cyclesBeforeLongBreak}
          onChange={(e) => updateSetting('cyclesBeforeLongBreak', parseInt(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.autoStartBreaks}
            onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-800"
          />
          Auto‑start breaks
        </label>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.autoStartWork}
            onChange={(e) => updateSetting('autoStartWork', e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-800"
          />
          Auto‑start focus
        </label>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.desktopNotifications}
            onChange={(e) => updateSetting('desktopNotifications', e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-800"
          />
          Desktop notifications
        </label>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => {
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
              Notification.requestPermission();
            }
          }}
          className="w-full rounded-2xl border border-white/15 px-4 py-3 text-white hover:bg-white/8"
        >
          Request Notification Permission
        </button>
      </div>
    </div>
  );
}

const themeOptions: { name: ThemeName; label: string; emoji: string; colors: string[] }[] = [
  { name: "default", label: "Default", emoji: "💜", colors: ["#6366f1", "#22d3ee", "#a78bfa"] },
  { name: "ocean", label: "Ocean", emoji: "🌊", colors: ["#0ea5e9", "#06b6d4", "#38bdf8"] },
  { name: "forest", label: "Forest", emoji: "🌲", colors: ["#22c55e", "#84cc16", "#4ade80"] },
  { name: "sunset", label: "Sunset", emoji: "🌅", colors: ["#f97316", "#f43f5e", "#fb923c"] },
  { name: "galaxy", label: "Galaxy", emoji: "🌌", colors: ["#a855f7", "#ec4899", "#c084fc"] },
  { name: "neon", label: "Neon Night", emoji: "🧪", colors: ["#00ffc3", "#ff00e5", "#00d4ff"] } as const,
  { name: "paper", label: "Paper White", emoji: "📄", colors: ["#fefefe", "#e2e8f0", "#94a3b8"] } as const,
];

export function SettingsPage() {
  const subjects = useAppStore((state: AppState) => state.subjects);
  const sessions = useAppStore((state: AppState) => state.sessions);
  const importAll = useAppStore((state: AppState) => state.importAll);
  const addManualEntry = useAppStore((state: AppState) => state.addManualEntry);
  const setDailyGoalHours = useAppStore((state: AppState) => state.setDailyGoalHours);
  const dailyGoalHours = useAppStore((state: AppState) => state.dailyGoalHours);
  const weeklyTargetHours = useAppStore((state: AppState) => state.weeklyTargetHours);
  const focusMusicEnabled = useAppStore((state: AppState) => state.focusMusicEnabled);
  const notificationsEnabled = useAppStore((state: AppState) => state.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((state: AppState) => state.setNotificationsEnabled);
  const keyboardShortcutsEnabled = useAppStore((state: AppState) => state.keyboardShortcutsEnabled);
  const strictFocusMode = useAppStore((state: AppState) => state.strictFocusMode);
  const setWeeklyTargetHours = useAppStore((state: AppState) => state.setWeeklyTargetHours);
  const setFocusMusicEnabled = useAppStore((state: AppState) => state.setFocusMusicEnabled);
  const setKeyboardShortcutsEnabled = useAppStore((state: AppState) => state.setKeyboardShortcutsEnabled);
  const setStrictFocusMode = useAppStore((state: AppState) => state.setStrictFocusMode);
  const autoPauseOnHidden = useAppStore((state: AppState) => state.autoPauseOnHidden);
  const setAutoPauseOnHidden = useAppStore((state: AppState) => state.setAutoPauseOnHidden);
  const theme = useAppStore((state: AppState) => state.theme);
  const setTheme = useAppStore((state: AppState) => state.setTheme);
  const [manualHours, setManualHours] = useState(1);
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualDate, setManualDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [manualTime, setManualTime] = useState("08:00");
  const [manualNotes, setManualNotes] = useState("Manual time entry");
  const [manualTags, setManualTags] = useState("manual");
  const [statusMessage, setStatusMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      {/* Theme Customization */}
      <Panel>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white">🎨 Theme Customization</h3>
          <p className="mt-1 text-sm text-slate-400">Choose a color theme that matches your style.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {themeOptions.map((opt) => (
            <motion.button
              key={opt.name}
              onClick={() => setTheme(opt.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-2xl border-2 p-4 transition-all ${
                theme === opt.name
                  ? "border-white shadow-lg"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="mb-3 text-3xl">{opt.emoji}</div>
              <p className="font-medium text-white">{opt.label}</p>
              <div className="mt-2 flex justify-center gap-1">
                {opt.colors.map((color, i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {theme === opt.name && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Backup */}
        <Panel className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white">💾 Backup</h3>
            <p className="mt-1 text-sm text-slate-400">Export or restore all subjects and study sessions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                exportData({
                  app: "FlowTrack",
                  exportedAt: new Date().toISOString(),
                  subjects,
                  sessions,
                });
                setStatusMessage("Backup exported successfully.");
              }}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg transition-transform hover:scale-105"
            >
              📤 Export JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void importBackup(file).then((payload) => {
                  void importAll(payload.subjects, payload.sessions).then(() => {
                    setStatusMessage("Backup imported successfully.");
                    if (fileRef.current) fileRef.current.value = "";
                  });
                });
              }}
            />
            <button onClick={() => fileRef.current?.click()} className="rounded-2xl border border-white/15 px-4 py-3 text-white transition-colors hover:bg-white/8">
              📥 Import JSON
            </button>
          </div>
        </Panel>

        {/* Manual Time Entry */}
        <Panel className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white">✏️ Manual Time Entry</h3>
            <p className="mt-1 text-sm text-slate-400">Add missed study time manually.</p>
          </div>
          <select value={manualSubjectId} onChange={(event) => setManualSubjectId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="number" min={0.25} step={0.25} value={manualHours} onChange={(event) => setManualHours(Number(event.target.value))} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Hours" />
            <input type="time" value={manualTime} onChange={(event) => setManualTime(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" />
          </div>
          <input type="date" value={manualDate} onChange={(event) => setManualDate(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" />
          <input value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Notes" />
          <input value={manualTags} onChange={(event) => setManualTags(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Tags (comma separated)" />
          <button
            onClick={() => {
              if (!manualSubjectId || manualHours <= 0) {
                setStatusMessage("Please select a subject and enter a valid time.");
                return;
              }
              void addManualEntry({
                subjectId: manualSubjectId,
                date: `${manualDate}T${manualTime}:00`,
                hours: manualHours,
                notes: manualNotes,
                tags: manualTags
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }).then(() => {
                setStatusMessage("Manual study time added successfully.");
                setManualHours(1);
                setManualNotes("Manual time entry");
                setManualTags("manual");
              });
            }}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white shadow-lg transition-transform hover:scale-105"
          >
            ➕ Add Manual Time
          </button>
        </Panel>
      </div>

      {/* Goals and Notifications */}
      <Panel className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">🎯 Goals and Notifications</h3>
          <p className="mt-1 text-sm text-slate-400">Set your daily & weekly targets and enable productivity features.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Daily Goal (hours)</label>
            <input
              id="goal"
              type="number"
              min={1}
              max={12}
              value={dailyGoalHours}
              onChange={(event) => setDailyGoalHours(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Weekly Target (hours)</label>
            <input
              type="number"
              min={1}
              max={80}
              value={weeklyTargetHours}
              onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Productivity Tools</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={strictFocusMode}
                  onChange={(e) => setStrictFocusMode(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-800"
                />
                🔒 Strict Focus
              </label>
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                Strict mode only counts verified active study time. Hidden or inactive periods stop contributing after a short grace window, while PiP heartbeat keeps intentional floating study valid.
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={focusMusicEnabled}
                  onChange={(e) => setFocusMusicEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-800"
                />
                🎵 Focus Music
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={autoPauseOnHidden}
                  onChange={(e) => setAutoPauseOnHidden(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-800"
                />
                ⏸️ Auto‑pause on Tab Hide
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Notifications & Shortcuts</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-800"
                />
                🔔 Desktop Notifications
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={keyboardShortcutsEnabled}
                  onChange={(e) => setKeyboardShortcutsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-800"
                />
                ⌨️ Keyboard Shortcuts
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (typeof Notification !== "undefined" && Notification.permission === "default") {
                void Notification.requestPermission();
              }
            }}
            className="rounded-2xl border border-white/15 px-4 py-2 text-white transition-colors hover:bg-white/8"
          >
            🔔 Enable Notifications
          </button>
          <p className="text-sm text-slate-400">Request browser permission for session alerts.</p>
        </div>
        {statusMessage && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300"
          >
            ✅ {statusMessage}
          </motion.p>
        )}
      </Panel>

      {/* Pomodoro Settings */}
      <Panel className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">🍅 Pomodoro Settings</h3>
          <p className="mt-1 text-sm text-slate-400">Customize your focus and break intervals.</p>
        </div>
        <PomodoroSettingsPanel />
      </Panel>

      {/* App Info */}
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">📱 FlowTrack PWA</h3>
            <p className="mt-1 text-sm text-slate-400">
              This app works offline! Install it on your device for the best experience.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <p className="text-lg font-bold text-cyan-400">{sessions.length}</p>
              <p className="text-xs text-slate-400">Sessions</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{subjects.length}</p>
              <p className="text-xs text-slate-400">Subjects</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <p className="text-lg font-bold text-purple-400">v1.0</p>
              <p className="text-xs text-slate-400">Version</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
