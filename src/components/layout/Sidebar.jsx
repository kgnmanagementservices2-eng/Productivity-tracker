/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  Ticket,
  Settings,
  Users,
  TrendingUp,
  LayoutTemplate,
  MessageSquare,
  FolderTree,
  LogOut,
  Hexagon,
  Clock,
  BookOpen, // Newly imported for the Manual
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();

  // ==========================================
  // 🟢 TRUE CST LIVE CLOCK LOGIC
  // ==========================================
  const [time, setTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    const fetchTrueTime = async () => {
      try {
        const response = await fetch(
          "https://worldtimeapi.org/api/timezone/America/Chicago",
        );
        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();
        const localTime = Date.now();
        const drift = serverTime - localTime;
        setTimeOffset(drift);
      } catch (error) {
        console.error(
          "Failed to sync with time server. Falling back to local clock.",
        );
      }
    };
    fetchTrueTime();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date(Date.now() + timeOffset));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeOffset]);

  const formattedTime = time.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // ==========================================
  // NAVIGATION CONFIGURATION
  // ==========================================
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      group: "Overview",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
    {
      name: "My Tickets",
      path: "/tickets",
      icon: Ticket,
      group: "Overview",
      allowedRoles: [
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
      ],
    },
    {
      name: "Task Templates",
      path: "/task",
      icon: LayoutTemplate,
      group: "Overview",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
    {
      name: "Performance",
      path: "/performance",
      icon: TrendingUp,
      group: "Overview",
      allowedRoles: ["CEO", "GLOBAL_ADMIN", "BACK_OFFICE_MANAGER"],
    },
    {
      name: "Team Groups",
      path: "/groups",
      icon: MessageSquare,
      group: "Overview",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
    {
      name: "Team Workload",
      path: "/workload",
      icon: Users,
      group: "Administration",
      allowedRoles: ["BACK_OFFICE_MANAGER", "GLOBAL_ADMIN", "CEO"],
    },
    {
      name: "Category Routing",
      path: "/categories",
      icon: FolderTree,
      group: "Administration",
      allowedRoles: ["GLOBAL_ADMIN", "BACK_OFFICE_MANAGER", "CEO"],
    },
    {
      name: "Company Setup",
      path: "/admin",
      icon: Settings,
      group: "Administration",
      allowedRoles: ["CEO", "GLOBAL_ADMIN"],
    },
    {
      name: "User Manual",
      path: "/manual",
      icon: BookOpen,
      group: "Resources",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
  ];

  const visibleLinks = navItems.filter((item) =>
    item.allowedRoles.includes(user?.role),
  );

  const groupedLinks = visibleLinks.reduce((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 bg-[var(--tenant-primary,#020617)] border-r border-white/5 z-50 shadow-2xl">
      {/* Brand Logo Area */}
      <div className="h-18 flex items-center px-6 border-b border-white/5 shrink-0 bg-black/10">
        <img
          src={logo}
          alt="Productivity Tracker"
          className="h-[4.5rem] w-auto object-contain drop-shadow-md"
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
        {Object.entries(groupedLinks).map(([groupName, links]) => (
          <div key={groupName} className="space-y-2">
            {/* Polished Group Header */}
            <h4 className="px-3 text-[10px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600 uppercase tracking-widest mb-3">
              {groupName}
            </h4>

            {/* Group Links */}
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/20 to-transparent text-white shadow-sm ring-1 ring-indigo-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Premium Active Indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                      )}

                      <Icon
                        size={18}
                        className={cn(
                          "transition-colors duration-300",
                          isActive
                            ? "text-indigo-400"
                            : "text-slate-500 group-hover:text-slate-300",
                        )}
                      />
                      {link.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 🟢 True CST Live Clock Widget */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 shadow-inner">
          <div className="text-indigo-400/80 bg-indigo-500/10 p-1.5 rounded-lg shrink-0 ring-1 ring-indigo-500/20">
            <Clock size={16} className="animate-pulse" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-mono font-bold text-slate-200 tabular-nums leading-tight tracking-tight truncate">
              {formattedTime} CST
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight truncate mt-0.5">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/5 shrink-0 bg-black/10">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all duration-300 group cursor-pointer">
          {/* Avatar Initials */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0 shadow-inner">
            {(user?.name || "U")[0].toUpperCase()}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
              {user?.name || "System User"}
            </span>
            <span className="text-[10px] font-medium text-slate-500 truncate uppercase tracking-wider">
              {user?.role?.replace(/_/g, " ") || "UNASSIGNED"}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-red-500/50 outline-none"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
