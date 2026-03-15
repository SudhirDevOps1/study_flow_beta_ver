import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AppGuide } from "@/components/common/AppGuide";
import { useAppStore, type AppState } from "@/store/useAppStore";
import { DashboardPage } from "@/pages/DashboardPage";
import { TimerPage } from "@/pages/TimerPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SubjectsPage } from "@/pages/SubjectsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { AchievementsPage } from "@/pages/AchievementsPage";
import { GuidePage } from "@/pages/GuidePage";

export function App() {
  const initApp = useAppStore((state: AppState) => state.initApp);
  const loading = useAppStore((state: AppState) => state.loading);

  useEffect(() => {
    void initApp();
  }, [initApp]);

  if (loading) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center px-6 text-center">
        <div className="glass rounded-3xl border border-white/10 px-8 py-10">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">FlowTrack</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Loading your study workspace</h1>
          <p className="mt-2 text-sm text-slate-300">Preparing sessions, analytics, subjects, and offline data.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <AppGuide />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <DashboardPage />
              </motion.div>
            }
          />
          <Route
            path="/timer"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <TimerPage />
              </motion.div>
            }
          />
          <Route
            path="/analytics"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <AnalyticsPage />
              </motion.div>
            }
          />
          <Route
            path="/history"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <HistoryPage />
              </motion.div>
            }
          />
          <Route
            path="/subjects"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <SubjectsPage />
              </motion.div>
            }
          />
          <Route
            path="/settings"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <SettingsPage />
              </motion.div>
            }
          />
          <Route
            path="/calendar"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <CalendarPage />
              </motion.div>
            }
          />
          <Route
            path="/achievements"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <AchievementsPage />
              </motion.div>
            }
          />
          <Route
            path="/guide"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="w-full"
              >
                <GuidePage />
              </motion.div>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
