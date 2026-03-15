import { useMemo } from "react";
import { isSameDay, subDays, format, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { LevelSystem } from "@/components/gamification/LevelSystem";
import { useAppStore, type AppState } from "@/store/useAppStore";
import type { StudySession, Subject } from "@/types/models";
import { useStreak } from "@/hooks/useStreak";
import { toDurationLabel, formatTime12Hour } from "@/utils/time";

// Progress Ring Component
function ProgressRing({ progress, size = 180, strokeWidth = 12, color = "cyan", children }: { progress: number; size?: number; strokeWidth?: number; color?: string; children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const gradientId = `progressGradient-${color}-${Math.random()}`;
  const gradientColors: Record<string, string[]> = {
    cyan: ["#6366f1", "#a855f7", "#22d3ee"],
    emerald: ["#10b981", "#34d399", "#6ee7b7"],
    orange: ["#f97316", "#fb923c", "#fbbf24"],
    purple: ["#a855f7", "#c084fc", "#e879f9"],
  };

  const colors = gradientColors[color] || gradientColors.cyan;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const sessions = useAppStore((state: AppState) => state.sessions);
  const subjects = useAppStore((state: AppState) => state.subjects);
  const dailyGoalHours = useAppStore((state: AppState) => state.dailyGoalHours);
  const weeklyTargetHours = useAppStore((state: AppState) => state.weeklyTargetHours);
  const achievements = useAppStore((state: AppState) => state.achievements);
  const theme = useAppStore((state: AppState) => state.theme);
  const streakData = useStreak();

  const today = useMemo(() => sessions.filter((session: StudySession) => isSameDay(new Date(session.startTime), new Date())), [sessions]);
  const actualTodayMinutes = Math.round(today.reduce((sum, session) => sum + session.actualSeconds, 0) / 60);
  const dailyGoalProgress = Math.min(100, (actualTodayMinutes / (dailyGoalHours * 60)) * 100);

  // Weekly progress (standard calendar week)
  const thisWeekSessions = useMemo(() => {
    const start = startOfWeek(new Date());
    return sessions.filter((s: StudySession) => new Date(s.startTime) >= start);
  }, [sessions]);
  const weeklyActualMinutes = Math.round(thisWeekSessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);
  const weeklyProgress = Math.min(100, (weeklyActualMinutes / (weeklyTargetHours * 60)) * 100);

  // Monthly progress
  const monthlyProgress = Math.min(100, (streakData.currentMonthHours / 50) * 100); 

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt).length;
  const totalHours = Math.round(sessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 3600);

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((s: StudySession) => s.status === "planned" && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [sessions]);

  const recentSessions = useMemo(() => {
    return sessions
      .filter((s: StudySession) => s.status === "completed")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  }, [sessions]);

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  const getThemeGradient = () => {
    switch (theme) {
      case "ocean": return "from-sky-500 to-teal-400";
      case "forest": return "from-green-500 to-lime-400";
      case "sunset": return "from-orange-500 to-rose-500";
      case "galaxy": return "from-purple-500 to-pink-500";
      case "cyber": return "from-yellow-400 to-rose-500";
      default: return "from-indigo-500 to-cyan-500";
    }
  };

  const weekChange = streakData.currentWeekHours - streakData.lastWeekHours;
  const weekChangeText = weekChange >= 0 ? `+${weekChange.toFixed(1)}h` : `${weekChange.toFixed(1)}h`;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Section with Progress Rings */}
      <Panel>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 xl:flex-row xl:items-center">
          {/* Progress Rings */}
          <div className="flex flex-wrap justify-center gap-6 xl:justify-start">
            <div className="text-center">
              <ProgressRing progress={dailyGoalProgress} size={140} strokeWidth={10} color="cyan">
                <p className="text-2xl font-bold text-white">{Math.round(dailyGoalProgress)}%</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Daily</p>
              </ProgressRing>
              <p className="mt-2 text-xs font-semibold text-slate-400">{toDurationLabel(actualTodayMinutes)} / {dailyGoalHours}h</p>
            </div>

            <div className="text-center">
              <ProgressRing progress={weeklyProgress} size={140} strokeWidth={10} color="emerald">
                <p className="text-2xl font-bold text-white">{Math.round(weeklyProgress)}%</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Weekly</p>
              </ProgressRing>
              <p className="mt-2 text-xs font-semibold text-slate-400">{toDurationLabel(weeklyActualMinutes)} / {weeklyTargetHours}h</p>
            </div>

            <div className="text-center max-md:hidden">
              <ProgressRing progress={monthlyProgress} size={140} strokeWidth={10} color="purple">
                <p className="text-2xl font-bold text-white">{Math.round(monthlyProgress)}%</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Monthly</p>
              </ProgressRing>
              <p className="mt-2 text-xs font-semibold text-slate-400">{streakData.currentMonthHours}h / 50h</p>
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-5">
            <div>
              <p className="text-xs uppercase font-bold tracking-[0.2em] text-cyan-400/80">📅 {format(new Date(), "EEEE, MMMM d")}</p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl leading-tight">
                {actualTodayMinutes > 0 
                  ? `You've crushed ${toDurationLabel(actualTodayMinutes)} today!` 
                  : "Time to lock in and focus."}
              </h2>
            </div>

            {/* Gamification Header */}
      <LevelSystem />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Today", value: toDurationLabel(actualTodayMinutes), grad: getThemeGradient() },
                { label: "Streak", value: `${streakData.daily}d`, grad: "from-emerald-500 to-teal-500" },
                { label: "All Time", value: `${totalHours}h`, grad: "from-purple-500 to-pink-500" },
                { label: "Badges", value: unlockedAchievements, grad: "from-amber-500 to-orange-500" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`rounded-2xl bg-gradient-to-br ${stat.grad} p-[1px] shadow-lg`}
                >
                  <div className="rounded-2xl bg-slate-900/40 p-3 text-center backdrop-blur-sm">
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400/80">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Upcoming */}
        <Panel className="lg:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">📅 Upcoming</h3>
            <Link to="/timer" className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors">Schedule →</Link>
          </div>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((session, i) => {
                const sub = getSubject(session.subjectId);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {sub?.emoji || "📚"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{sub?.name || "Deleted Subject"}</p>
                      <p className="text-[10px] text-slate-400">{formatTime12Hour(session.startTime)} • {format(new Date(session.startTime), "MMM d")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-cyan-400">{toDurationLabel(session.plannedMinutes)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-sm text-slate-400">Clear for now!</p>
            </div>
          )}
        </Panel>

        {/* Subjects Overview */}
        <Panel className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">📚 Subject Progress (Weekly)</h3>
            <Link to="/subjects" className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors">Manage →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => {
              const weeklySubjectSeconds = thisWeekSessions
                .filter((s: StudySession) => s.subjectId === subject.id)
                .reduce((sum, s) => sum + s.actualSeconds, 0);
              const weeklyHours = (weeklySubjectSeconds / 3600).toFixed(1);
              const goalHours = (subject.weeklyGoalMinutes || 0) / 60;
              const progress = goalHours > 0 ? Math.min(100, (parseFloat(weeklyHours) / goalHours) * 100) : 0;

              return (
                <div 
                  key={subject.id} 
                  className="relative group rounded-2xl border border-white/5 bg-slate-900/30 p-4 transition-all hover:bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-inner"
                      style={{ backgroundColor: `${subject.color}15`, border: `1px solid ${subject.color}30` }}
                    >
                      {subject.emoji || "📚"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-white">{subject.name}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{weeklyHours}h {goalHours > 0 ? `/ ${goalHours}h goal` : 'total'}</span>
                        {goalHours > 0 && <span>{Math.round(progress)}%</span>}
                      </div>
                      {goalHours > 0 && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: subject.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Heatmap Section */}
      <Panel>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">🔥 Focus Heatmap</h3>
          <p className="text-sm text-slate-400">Consistency is the key to mastery. Track your daily flow.</p>
        </div>
        <div className="pretty-scrollbar overflow-x-auto pb-4">
          <div className="flex gap-1.5 min-w-max">
            {streakData.heatmap.map((item, i) => (
              <motion.div
                key={item.day}
                title={`${format(new Date(item.day), "MMM d")}: ${toDurationLabel(item.minutes)}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.003 }}
                whileHover={{ scale: 1.3, zIndex: 10 }}
                className="h-4 w-4 rounded-sm"
                style={{
                  backgroundColor: item.minutes === 0 
                    ? "rgba(255,255,255,0.05)" 
                    : `rgba(34, 211, 238, ${Math.max(0.2, Math.min(1, item.minutes / 180))})`,
                  boxShadow: item.minutes > 0 ? '0 0 8px rgba(34, 211, 238, 0.2)' : 'none'
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
             <span>Less</span>
             <div className="flex gap-1">
               {[0.05, 0.25, 0.5, 0.75, 1].map((o, i) => (
                 <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(34, 211, 238, ${o})` }} />
               ))}
             </div>
             <span>More</span>
          </div>
          <p className="text-xs text-slate-400">Showing last 90 days activity</p>
        </div>
      </Panel>
    </div>
  );
}
