
import { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Activity,
  AlertCircle,
  Clock,
  Trophy,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import api from "../../services/api";
import { Card } from "../common/Card";
import { cn } from "../../utils/cn";
import toast from "react-hot-toast";

const MONTHLY_THEMES = [
  {
    gradient: "from-blue-500 to-cyan-400",
    borderHover: "hover:border-blue-300",
  }, // Jan
  {
    gradient: "from-indigo-500 to-purple-500",
    borderHover: "hover:border-indigo-300",
  }, // Feb
  {
    gradient: "from-emerald-500 to-teal-400",
    borderHover: "hover:border-emerald-300",
  }, // Mar
  {
    gradient: "from-rose-500 to-pink-500",
    borderHover: "hover:border-rose-300",
  }, // Apr
  {
    gradient: "from-amber-500 to-orange-400",
    borderHover: "hover:border-amber-300",
  }, // May
  {
    gradient: "from-fuchsia-500 to-pink-500",
    borderHover: "hover:border-fuchsia-300",
  }, // Jun
  {
    gradient: "from-cyan-500 to-blue-500",
    borderHover: "hover:border-cyan-300",
  }, // Jul
  {
    gradient: "from-violet-500 to-purple-500",
    borderHover: "hover:border-violet-300",
  }, // Aug
  {
    gradient: "from-teal-500 to-emerald-400",
    borderHover: "hover:border-teal-300",
  }, // Sep
  {
    gradient: "from-orange-500 to-red-400",
    borderHover: "hover:border-orange-300",
  }, // Oct
  {
    gradient: "from-pink-500 to-rose-400",
    borderHover: "hover:border-pink-300",
  }, // Nov
  {
    gradient: "from-sky-500 to-indigo-400",
    borderHover: "hover:border-sky-300",
  }, // Dec
];

// 1. Upgraded: Premium Donut Chart with SVG Gradients
const TicketDonutChart = ({ total = 0, breached = 0, label }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(total, 1);
  const breachedPercent = (breached / safeTotal) * 100;
  const strokeDashoffset =
    circumference - (breachedPercent / 100) * circumference;

  // Generate a unique ID for the SVG gradient so they don't clash
  const gradientId = `gradient-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" /> {/* rose-500 */}
              <stop offset="100%" stopColor="#ef4444" /> {/* red-500 */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-100"
          />

          {/* Progress Indicator with Gradient */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
            filter={breached > 0 ? "url(#glow)" : ""}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            {total}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Total
          </span>
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <span className="text-sm font-bold text-slate-700 block">{label}</span>
        <div className="inline-flex items-center gap-1.5 bg-red-50/80 px-2.5 py-1 rounded-md border border-red-100/80 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold text-red-600">
            {breached} Breached
          </span>
        </div>
      </div>
    </div>
  );
};

// 2. Upgraded: Trend Chart with Gradient Bars and Dotted Gridlines
const MonthlyTrendChart = ({ data }) => {
  const maxVal = Math.max(
    ...data.map((d) =>
      Math.max(d.total - d.open - d.inProcess, d.tatBreached, 1),
    ),
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
          <BarChart3 size={18} className="text-indigo-500" />
          Closed vs Breached Trend
        </h3>
        <div className="flex items-center gap-5 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm"></span>{" "}
            Closed
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-rose-500 to-red-400 shadow-sm"></span>{" "}
            Breached
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full flex items-end justify-between gap-2 px-2">
        {/* Background Dotted Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full border-t border-slate-200/60 border-dashed"
            ></div>
          ))}
        </div>

        {data.map((d, i) => {
          const closed = d.total - d.open - d.inProcess;
          const breached = d.tatBreached;
          const closedHeight = (closed / maxVal) * 100;
          const breachedHeight = (breached / maxVal) * 100;

          return (
            <div
              key={i}
              className="flex flex-col items-center flex-1 gap-3 group z-10"
            >
              <div className="flex items-end justify-center gap-1.5 w-full h-40 relative">
                {/* Closed Bar with Gradient */}
                <div
                  style={{ height: `${closedHeight}%` }}
                  className="w-full max-w-[14px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-500 relative hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {closed} Closed
                  </div>
                </div>

                {/* Breached Bar with Gradient */}
                <div
                  style={{ height: `${breachedHeight}%` }}
                  className="w-full max-w-[14px] bg-gradient-to-t from-rose-500 to-red-400 rounded-t-md transition-all duration-500 relative hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {breached} Breached
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {d.month.substring(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const UserPerformanceModal = ({ isOpen, onClose, user }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchUserStats = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/admin/performance/user/${user.id}`, {
          params: { year: selectedYear },
        });
        setStats(response.data.data);
      } catch (error) {
        toast.error("Failed to load user performance details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [isOpen, user, selectedYear]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-6xl shadow-2xl relative max-h-[95vh] overflow-hidden bg-[#F8FAFC] rounded-2xl flex flex-col border-0">
        {/* HEADER */}
        {/* <div className="relative  bg-gradient-to-r from-gray-900 via-slate-800 to-slate-900 px-8 py-10 shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjI1Ii8+PC9zdmc+')]"></div>

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative shrink-0 group">
              {user.profile_url ? (
                <img
                  src={user.profile_url}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white border-4 border-white/10 shadow-2xl">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[10px] font-black tracking-wider px-3 py-1 rounded-full border-4 border-slate-900 shadow-md">
                ACTIVE
              </div>
            </div>

            <div className="text-center md:text-left flex-1 space-y-3">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {user.name}
                </h2>
                <p className="text-slate-300 font-semibold mt-1 text-sm flex items-center justify-center md:justify-start gap-2">
                  <span className="bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-0.5 rounded-md text-indigo-100">
                    {user.role
                      ? user.role.replace(/_/g, " ")
                      : "SOFTWARE ENGINEER"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-indigo-200">
                    {user.department_name || "Engineering"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg backdrop-blur-sm shadow-sm">
                  <Trophy size={16} className="text-amber-400 drop-shadow-sm" />
                  <span className="text-sm font-bold text-amber-100">
                    Overall Score:{" "}
                    <span className="text-amber-400 font-black text-base">
                      {stats?.yearly?.rating || "0.0"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-inner shrink-0 hover:bg-white/20 transition-colors">
              <Calendar size={18} className="text-indigo-200" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-black text-sm outline-none cursor-pointer appearance-none pr-4"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year} className="text-slate-900">
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div> */}
        <div className="relative bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 px-8 py-10 shrink-0 overflow-hidden shadow-inner">
          {/* Subtle noise overlay for texture */}
          <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjI1Ii8+PC9zdmc+')]"></div>

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2.5 text-slate-200 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative shrink-0 group">
              {user.profile_url ? (
                <img
                  src={user.profile_url}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-400 to-slate-300 flex items-center justify-center text-3xl font-black text-white border-4 border-white/20 shadow-xl">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              {/* Border matches the mid-tone background to look seamlessly cut out */}
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[10px] font-black tracking-wider px-3 py-1 rounded-full border-4 border-slate-500 shadow-sm">
                ACTIVE
              </div>
            </div>

            <div className="text-center md:text-left flex-1 space-y-3">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                  {user.name}
                </h2>
                <p className="text-slate-100 font-medium mt-1.5 text-sm flex items-center justify-center md:justify-start gap-2.5">
                  <span className="bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-md text-white shadow-sm">
                    {user.role
                      ? user.role.replace(/_/g, " ")
                      : "SOFTWARE ENGINEER"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-slate-50">
                    {user.department_name || "Engineering"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-lg backdrop-blur-sm shadow-sm hover:bg-white/15 transition-colors">
                  <Trophy size={16} className="text-amber-300 drop-shadow-sm" />
                  <span className="text-sm font-semibold text-slate-50">
                    Overall Score:{" "}
                    <span className="text-amber-300 font-black text-base ml-1">
                      {stats?.yearly?.rating || "0.0"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm shrink-0 hover:bg-white/20 transition-colors">
              <Calendar size={18} className="text-slate-100" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none pr-4"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option
                      key={year}
                      value={year}
                      className="text-slate-900 font-medium"
                    >
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-indigo-500">
              <Activity className="animate-spin mb-4" size={32} />
              <span className="font-bold text-sm tracking-wide text-slate-500">
                Aggregating Metrics...
              </span>
            </div>
          ) : !stats ? null : (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Top Row: KPIs and Chart */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* RADIAL GRAPHS */}
                <div className="xl:col-span-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                    <Activity size={18} className="text-indigo-500" />
                    Tickets to Breaches Over Time
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm h-[calc(100%-2.5rem)]">
                    <TicketDonutChart
                      total={stats.rolling1M?.total || 0}
                      breached={stats.rolling1M?.breached || 0}
                      label="30 Days"
                    />
                    <TicketDonutChart
                      total={stats.rolling3M?.total || 0}
                      breached={stats.rolling3M?.breached || 0}
                      label="3 Months"
                    />
                    <TicketDonutChart
                      total={stats.rolling6M?.total || 0}
                      breached={stats.rolling6M?.breached || 0}
                      label="6 Months"
                    />
                    <TicketDonutChart
                      total={stats.yearly?.total || 0}
                      breached={stats.yearly?.breached || 0}
                      label="Yearly"
                    />
                  </div>
                </div>

                {/* TREND GRAPH */}
                <div className="xl:col-span-7 space-y-4">
                  <MonthlyTrendChart data={stats.monthlyBreakdown} />
                </div>
              </div>

              {/* MONTH-WISE BREAKDOWN CARDS */}
              {/* 3. MONTH-WISE BREAKDOWN CARDS */}
              {/* 3. MONTH-WISE BREAKDOWN CARDS */}
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <Calendar size={18} className="text-slate-400" />{" "}
                  {selectedYear} Monthly Detail Grid{" "}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {stats.monthlyBreakdown.map((row, idx) => {
                    const closed = row.total - row.open - row.inProcess;
                    const hasBreach = row.tatBreached > 0;
                    // Assign a unique theme based on the month's index
                    const theme = MONTHLY_THEMES[idx % 12];

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col group relative overflow-hidden backdrop-blur-sm",
                          "bg-gradient-to-br from-white/90 to-slate-50/50", // Base clean light gradient
                          theme.borderHover,
                        )}
                      >
                        {/* Dynamic background gradient blend on hover */}
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-[0.12] transition-opacity duration-300 pointer-events-none",
                            theme.gradient,
                          )}
                        ></div>

                        {/* Dynamic top gradient accent bar on hover */}
                        <div
                          className={cn(
                            "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                            theme.gradient,
                          )}
                        ></div>

                        <div className="flex justify-between items-center mb-5 relative z-10">
                          <span className="font-bold text-slate-900 text-lg">
                            {row.month}
                          </span>
                          <span className="text-xs font-semibold bg-slate-100/80 text-slate-600 px-2.5 py-1 rounded-md uppercase tracking-wider backdrop-blur-xs">
                            {row.total} Tickets{" "}
                          </span>
                        </div>

                        <div className="space-y-4 flex-1 text-sm relative z-10">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">
                                {" "}
                                Closed{" "}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {" "}
                                {closed}{" "}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">
                                {" "}
                                In Process{" "}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {" "}
                                {row.inProcess}{" "}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">
                                {" "}
                                Open{" "}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {" "}
                                {row.open}{" "}
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 mt-auto border-t border-slate-200/60 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                <AlertCircle
                                  size={14}
                                  className={
                                    hasBreach
                                      ? "text-red-500"
                                      : "text-slate-300"
                                  }
                                />{" "}
                                SLA Breached
                              </span>
                              <span
                                className={cn(
                                  "font-bold px-2 py-0.5 rounded-md text-xs",
                                  hasBreach
                                    ? "bg-red-50 text-red-600"
                                    : "text-slate-400 bg-slate-50",
                                )}
                              >
                                {row.tatBreached}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" />{" "}
                                Avg Resolution
                              </span>
                              <span className="font-semibold text-slate-900">
                                {row.avgTime > 0 ? `${row.avgTime}h` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
