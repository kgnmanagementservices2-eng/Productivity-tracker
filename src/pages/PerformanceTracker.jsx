/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Calendar as CalendarIcon,
  Activity,
  AlertCircle,
  Building2,
  ChevronRight,
  ArrowLeft,
  Clock,
  Star,
  StarHalf,
  Crown,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Card, CardHeader, CardContent } from "../components/common/Card";
import { cn } from "../utils/cn";
import { UserPerformanceModal } from "../components/workload/UserPerformanceModal";
import { useOnlineUsers } from "../context/SocketContext";

// Premium gradient themes for Department Cards
const DEPARTMENT_THEMES = [
  {
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    textHover: "group-hover:text-indigo-600",
    shadow: "hover:shadow-indigo-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    textHover: "group-hover:text-blue-600",
    shadow: "hover:shadow-blue-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
    textHover: "group-hover:text-emerald-600",
    shadow: "hover:shadow-emerald-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    textHover: "group-hover:text-rose-600",
    shadow: "hover:shadow-rose-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    textHover: "group-hover:text-amber-600",
    shadow: "hover:shadow-amber-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
    textHover: "group-hover:text-violet-600",
    shadow: "hover:shadow-violet-500/20",
  },
];
// Ultra-light gradients for individual member cards
const LIGHT_CARD_THEMES = [
  "bg-gradient-to-br from-indigo-50/80 via-white to-white hover:from-indigo-100/50",
  "bg-gradient-to-br from-blue-50/80 via-white to-white hover:from-blue-100/50",
  "bg-gradient-to-br from-emerald-50/80 via-white to-white hover:from-emerald-100/50",
  "bg-gradient-to-br from-rose-50/80 via-white to-white hover:from-rose-100/50",
  "bg-gradient-to-br from-violet-50/80 via-white to-white hover:from-violet-100/50",
];
export default function PerformanceTracker() {
  const { user } = useAuth();
  const onlineUsers = useOnlineUsers() || {};

  // Date Range State (Defaults to 1st of current month to today)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  const isAdmin = user?.role === "GLOBAL_ADMIN" || user?.role === "CEO";

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/performance", {
        params: { fromDate, toDate },
      });
      setPerformanceData(response.data.data);
    } catch (error) {
      toast.error("Failed to load performance metrics.");
      setPerformanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-deps
  }, []);

  // Group data by department for Admin view
  const groupedDepartments = useMemo(() => {
    if (!isAdmin) return {};
    const groups = {};

    performanceData.forEach((member) => {
      const dept = member.department_name || "Unassigned";
      if (!groups[dept]) {
        groups[dept] = {
          members: [],
          totalTickets: 0,
          totalOpen: 0,
          totalInProgress: 0,
          totalTatBreached: 0,
          avgCloseTime: 0,
          rating: 0,
        };
      }
      groups[dept].members.push(member);
      groups[dept].totalTickets += Number(member.total_tickets || 0);
      groups[dept].totalOpen += Number(member.open_tickets || 0);
      groups[dept].totalInProgress += Number(member.in_progress_tickets || 0);
      groups[dept].totalTatBreached += Number(member.tat_breached || 0);
    });

    // Calculate department averages
    Object.keys(groups).forEach((key) => {
      const members = groups[key].members;

      const totalAvg = members.reduce(
        (sum, m) => sum + Number(m.avg_close_time_hrs || 0),
        0,
      );
      groups[key].avgCloseTime =
        members.length > 0 ? (totalAvg / members.length).toFixed(1) : 0;

      const avgRating = members.reduce(
        (sum, m) => sum + Number(m.rating || 0),
        0,
      );
      groups[key].rating =
        members.length > 0 ? (avgRating / members.length).toFixed(1) : 0;
    });

    // Sort departments and prioritize managers at the top of the member list
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        acc[key].members.sort((a, b) => {
          if (a.role === "BACK_OFFICE_MANAGER") return -1;
          if (b.role === "BACK_OFFICE_MANAGER") return 1;
          return Number(b.total_tickets) - Number(a.total_tickets);
        });
        return acc;
      }, {});
  }, [performanceData, isAdmin]);

  // Helper to render the 5-star ranking system
  const renderStars = (rating) => {
    const stars = [];
    const numRating = Number(rating);
    for (let i = 1; i <= 5; i++) {
      if (numRating >= i) {
        stars.push(
          <Star
            key={i}
            size={14}
            className="fill-amber-400 text-amber-400 drop-shadow-sm"
          />,
        );
      } else if (numRating >= i - 0.5) {
        stars.push(
          <StarHalf
            key={i}
            size={14}
            className="fill-amber-400 text-amber-400 drop-shadow-sm"
          />,
        );
      } else {
        stars.push(<Star key={i} size={14} className="text-slate-200" />);
      }
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  const renderMembers = (members) => {
    if (members.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-slate-200/60 border-dashed animate-in fade-in zoom-in-95 duration-500">
          <Activity className="text-slate-300 mb-4" size={48} />
          <h3 className="text-slate-900 font-bold text-lg mb-1">
            No performance data found
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            Try adjusting your date range.
          </p>
        </div>
      );
    }

    return members.map((member, index) => {
      const isManager = member.role === "BACK_OFFICE_MANAGER";
      const status = onlineUsers[String(member.id)] || "offline";

      // Cycle through the light themes based on the card's index
      const lightTheme = LIGHT_CARD_THEMES[index % LIGHT_CARD_THEMES.length];

      return (
        <Card
          key={member.id}
          onClick={() => setSelectedUserForModal(member)}
          style={{ animationDelay: `${index * 80}ms` }}
          className={cn(
            "group relative overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl flex flex-col cursor-pointer",
            isManager
              ? "border-[2px] border-amber-400 shadow-[0_4px_15px_rgb(251,191,36,0.15)] bg-gradient-to-br from-amber-100/60 via-amber-50/10 to-white hover:from-amber-100/80"
              : cn("border border-slate-200/80", lightTheme),
          )}
        >
          {/* 👑 The Manager Tag */}
          {isManager && (
            <div className="absolute top-0 right-0 bg-amber-400 text-white text-[11px] font-black px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 z-10 uppercase tracking-widest shadow-sm">
              <Crown size={15} strokeWidth={2.5} />
              MANAGER
            </div>
          )}

          <CardHeader className="pb-4 pt-7 px-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3.5">
                {/* Profile Image Renderer */}
                {member.profile_url ? (
                  <img
                    src={member.profile_url}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-indigo-600 font-black border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105 text-lg">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col gap-1 pr-2">
                  {/* Name & Online Status */}
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 tracking-tight text-lg group-hover:text-indigo-600 transition-colors truncate">
                      {member.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shadow-sm transition-all whitespace-nowrap bg-white/80",
                        status === "online"
                          ? "text-emerald-700 border-emerald-200"
                          : status === "away"
                            ? "text-amber-700 border-amber-200"
                            : "text-slate-500 border-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          status === "online"
                            ? "bg-emerald-500 shadow-[0_0_4px_#10b981]"
                            : status === "away"
                              ? "bg-amber-400"
                              : "bg-slate-300",
                        )}
                      ></span>
                      {status === "online"
                        ? "Online"
                        : status === "away"
                          ? "Away"
                          : "Offline"}
                    </span>
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderStars(member.rating)}
                    <span className="text-xs font-bold text-slate-500">
                      ({member.rating})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none mt-1">
                  {member.total_tickets}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Total
                </span>
              </div>
            </div>
          </CardHeader>

          {/* Changed background from bg-slate-50/80 to bg-white/40 to let the gradient bleed through */}
          <CardContent className="px-5 py-6 bg-white/40 flex-grow border-t border-slate-100 backdrop-blur-[2px]">
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Subtle Vertical Divider */}
              <div className="absolute left-1/2 top-1 bottom-1 w-px bg-slate-200/60 -translate-x-1/2"></div>

              {/* Left Column: Active Queue */}
              <div className="flex flex-col gap-4 pr-3">
                <div className="flex items-center justify-between group">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-20"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 ring-4 ring-amber-400/10"></span>
                    </span>
                    Open
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {member.open_tickets}
                  </span>
                </div>

                <div className="flex items-center justify-between group">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 ring-4 ring-blue-500/10"></span>
                    In Process
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {member.in_progress_tickets}
                  </span>
                </div>
              </div>

              {/* Right Column: Performance Metrics */}
              <div className="flex flex-col gap-3 pl-3">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                      member.tat_breached > 0
                        ? "text-red-500"
                        : "text-slate-500",
                    )}
                  >
                    <AlertCircle
                      size={14}
                      className={
                        member.tat_breached > 0
                          ? "text-red-500"
                          : "text-slate-400"
                      }
                    />
                    Breached
                  </span>
                  <span
                    className={cn(
                      "font-black text-xs px-2 py-1 rounded-md border transition-colors",
                      member.tat_breached > 0
                        ? "text-red-700 bg-red-50 border-red-200 shadow-sm"
                        : "text-slate-500 bg-white/60 border-transparent",
                    )}
                  >
                    {member.tat_breached}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" />
                    Avg Time
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-md border border-indigo-100/50 text-xs shadow-sm">
                    {member.avg_close_time_hrs}h
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-8 pb-12 pt-6 bg-[#F8FAFC] min-h-screen">
      {/* Pop-in animation style */}
      <style>{`
        @keyframes pop-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          50% { opacity: 1; transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-pop-in {
          opacity: 0;
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] tracking-tight flex items-center gap-3">
            <TrendingUp className="text-indigo-600" size={32} />
            {isAdmin && selectedDepartment
              ? `${selectedDepartment} Performance`
              : "Performance Tracker"}
          </h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium max-w-2xl">
            Evaluate team efficiency, TAT adherence, and average resolution
            speeds over a specific timeframe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {isAdmin && selectedDepartment && (
            <Button
              variant="secondary"
              onClick={() => setSelectedDepartment(null)}
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm hover:-translate-x-1 transition-all font-bold h-11 px-5 rounded-xl mr-auto sm:mr-4"
            >
              <ArrowLeft size={18} className="mr-2" /> All Departments
            </Button>
          )}

          {/* Date Range Picker */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 px-2">
              <CalendarIcon size={16} className="text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-sm font-medium text-slate-700 outline-none bg-transparent cursor-pointer"
              />
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2 px-2">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-sm font-medium text-slate-700 outline-none bg-transparent cursor-pointer"
              />
            </div>
            <Button
              onClick={fetchPerformanceData}
              disabled={isLoading}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold ml-2 transition-all active:scale-95"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isAdmin && !selectedDepartment ? (
          Object.keys(groupedDepartments).length === 0 ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-slate-200/60 border-dashed">
              <Building2 className="text-slate-300 mb-4" size={48} />
              <h3 className="text-slate-900 font-bold text-xl mb-1">
                No departments found
              </h3>
              <p className="text-slate-500 text-base font-medium mt-1">
                There is no data for the selected date range.
              </p>
            </div>
          ) : (
            Object.entries(groupedDepartments).map(
              ([deptName, deptData], index) => {
                const theme =
                  DEPARTMENT_THEMES[index % DEPARTMENT_THEMES.length];

                return (
                  <Card
                    key={deptName}
                    onClick={() => setSelectedDepartment(deptName)}
                    style={{ animationDelay: `${index * 80}ms` }}
                    className={cn(
                      "group animate-pop-in cursor-pointer bg-white border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:border-transparent",
                      theme.shadow,
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "p-4 text-white rounded-xl shadow-inner",
                              theme.gradient,
                            )}
                          >
                            <Building2 size={24} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <h3
                              className={cn(
                                "text-lg font-extrabold text-slate-900 transition-colors uppercase tracking-tight",
                                theme.textHover,
                              )}
                            >
                              {deptName}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {renderStars(deptData.rating)}
                              <span className="text-[10px] font-bold text-slate-400">
                                ({deptData.rating})
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          size={24}
                          className="text-slate-300 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-1"
                        />
                      </div>

                      {/* Department Metrics Summary */}
                      <div className="bg-slate-50/50 p-5 grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-500 mb-1">
                            Total Tickets
                          </span>
                          <span className="font-bold text-slate-800">
                            {deptData.totalTickets}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-500 mb-1">
                            Avg Close Time
                          </span>
                          <span className="font-bold text-indigo-600 flex items-center gap-1">
                            <Clock size={12} /> {deptData.avgCloseTime}h
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-500 mb-1">
                            Active / Process
                          </span>
                          <span className="font-bold text-slate-700">
                            {deptData.totalOpen} / {deptData.totalInProgress}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-500 mb-1">
                            TAT Breaches
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              deptData.totalTatBreached > 0
                                ? "text-red-500"
                                : "text-emerald-500",
                            )}
                          >
                            {deptData.totalTatBreached}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )
          )
        ) : (
          /* View 2: Specific Department Members or Standard Member View */
          renderMembers(
            isAdmin
              ? groupedDepartments[selectedDepartment].members
              : performanceData,
          )
        )}
      </div>

      <UserPerformanceModal
        isOpen={!!selectedUserForModal}
        user={selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
      />
    </div>
  );
}
