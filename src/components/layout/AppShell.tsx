import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/useAppStore";

const links = [
  { to: "/dashboard", label: "🏠 Dashboard", icon: "🏠" },
  { to: "/timer", label: "⏱️ Timer", icon: "⏱️" },
  { to: "/calendar", label: "📅 Calendar", icon: "📅" },
  { to: "/analytics", label: "📊 Analytics", icon: "📊" },
  { to: "/achievements", label: "🏆 Achievements", icon: "🏆" },
  { to: "/history", label: "📜 History", icon: "📜" },
  { to: "/guide", label: "📖 Guide", icon: "📖" },
  { to: "/subjects", label: "📚 Subjects", icon: "📚" },
  { to: "/settings", label: "⚙️ Settings", icon: "⚙️" },
];

export function AppShell() {
  const location = useLocation();
  const theme = useAppStore((state: AppState) => state.theme);
  const current = links.find((link) => link.to === location.pathname)?.label ?? "🏠 Dashboard";

  const getGradientClass = () => {
    switch (theme) {
      case "ocean": return "from-sky-500 to-teal-400";
      case "forest": return "from-green-500 to-lime-400";
      case "sunset": return "from-orange-500 to-rose-500";
      case "galaxy": return "from-purple-500 to-pink-500";
      case "cyber": return "from-yellow-400 to-rose-500";
      default: return "from-indigo-500 to-cyan-500";
    }
  };

  return (
    <div className="grid-bg min-h-screen px-4 py-4 md:px-8 md:py-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-5 flex w-full max-w-7xl flex-col gap-4"
      >
        <div className="glass rounded-3xl px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-2xl shadow-lg ring-1 ring-white/20">
                  🚀
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-black tracking-tighter text-white">Flow<span className="text-cyan-400">Track</span></span>
                  <div className="flex items-center gap-1.5 mt-[-2px]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">100% Local & Private</span>
                  </div>
                </div>
              </Link>
              <h1 className="text-xl font-semibold text-white md:text-2xl">Smart Study Tracker</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                Plan sessions, track actual study time accurately, and review progress with beautiful analytics.
              </p>
            </div>
            <div className={`soft-card rounded-2xl bg-gradient-to-r ${getGradientClass()} p-[2px]`}>
              <div className="rounded-2xl bg-slate-900/95 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current page</p>
                <p className="mt-1 text-lg font-medium text-white">{current}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="glass pretty-scrollbar flex gap-2 overflow-x-auto rounded-2xl p-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? `bg-gradient-to-r ${getGradientClass()} text-white shadow-lg`
                    : "text-slate-200 hover:bg-white/8 hover:text-white"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </motion.header>
      <main className="mx-auto w-full max-w-7xl pb-10">
        <Outlet />
      </main>
    </div>
  );
}
