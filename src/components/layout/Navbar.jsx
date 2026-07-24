/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
// 🟢 NEW: Import the socket context
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import {
  LogOut,
  User,
  Building,
  Shield,
  Key,
  Hash,
  Bell,
  Check,
} from "lucide-react";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";
import { cn } from "../../utils/cn";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // 🟢 NEW: Initialize socket
  const socket = useSocket();

  // UI Controls
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // 🟢 UPDATED: Moved fetch function outside so it can be reused by the socket listener
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data && res.data.data) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.length);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  // Fetch Notifications on Mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // 🟢 NEW: Live Socket Listener for Notifications & Sounds
  useEffect(() => {
    if (!socket) return;

    const handleLiveAlert = () => {
      // 1. Play the ring sound (Ensure you have notification.mp3 in your public folder)
      const audio = new Audio("/notification.mp3");
      audio.play().catch((error) => {
        console.log("Browser auto-play blocked the notification sound:", error);
      });

      // 2. Fetch the latest notifications to update the Bell icon live
      fetchNotifications();
    };

    // Listen for all system events that generate notifications
    socket.on("new_ticket_assigned", handleLiveAlert);
    socket.on("ticket_reassigned_to_you", handleLiveAlert);
    socket.on("new_ticket_message", handleLiveAlert);

    // Cleanup listeners on unmount
    return () => {
      socket.off("new_ticket_assigned", handleLiveAlert);
      socket.off("ticket_reassigned_to_you", handleLiveAlert);
      socket.off("new_ticket_message", handleLiveAlert);
    };
  }, [socket]);

  // Handle Marking a Notification as Read
  const handleMarkAsRead = async (id, referenceId) => {
    try {
      await api.put(`/notifications/${id}/read`);

      // Update local state instantly so the UI feels fast
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // If it's a ticket notification, navigate the user straight to it!
      if (referenceId) {
        setIsNotifOpen(false);
        navigate(`/tickets/${referenceId}`);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  // Handle Clearing All Notifications Instantly
  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    // 1. Save current state just in case it fails
    const currentNotifs = [...notifications];

    // 2. Optimistically clear UI instantly for a snappy feel
    setNotifications([]);
    setUnreadCount(0);

    try {
      // 3. One single blazing fast API call!
      await api.put(`/notifications/read-all`);
    } catch (error) {
      console.error("Failed to clear all notifications", error);
      // Revert UI if the network request fails
      setNotifications(currentNotifs);
      setUnreadCount(currentNotifs.length);
    }
  };

  const formatRole = (role) => {
    if (!role) return "System User";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Glassmorphic Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-200">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZone: "America/Chicago", // Forces the UI to evaluate and print strictly in Central Time
              }).format(new Date())}
            </p>
          </div>
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* NOTIFICATION BELL AREA */}
          <div className="relative flex items-center" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className={cn(
                "p-2 rounded-full transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                isNotifOpen
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80",
              )}
            >
              <Bell
                size={18}
                className={isNotifOpen ? "fill-indigo-100" : ""}
              />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Premium Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/80 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                  <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-sm">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider ring-1 ring-inset ring-indigo-500/20">
                        {unreadCount} New
                      </span>
                    )}
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                  {notifications.length === 0 ? (
                    <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                      <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-emerald-100">
                        <Check size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-1">
                        You're all caught up
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        No new notifications at the moment.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3.5 group bg-white"
                          onClick={() =>
                            handleMarkAsRead(notif.id, notif.reference_id)
                          }
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors pr-2">
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                              {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                timeZone: "America/Chicago", // Forces the UI to evaluate and print strictly in Central Time
                              }).format(new Date(notif.created_at))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-200/80 hidden sm:block"></div>

          {/* PROFILE AREA */}
          <div className="relative flex items-center" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full border border-transparent hover:bg-slate-100/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <div className="flex-col text-left hidden md:flex">
                <span className="text-xs font-bold text-slate-800 leading-none">
                  {user?.name || "System User"}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 font-medium leading-none">
                  {formatRole(user?.role)}
                </span>
              </div>
            </button>

            {/* Premium Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/80 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
                {/* Profile Header */}
                <div className="p-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">
                      {user?.name || "System User"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {user?.email || "No email provided"}
                    </p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
                    <Shield size={14} className="text-slate-400 mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Role
                    </p>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {formatRole(user?.role)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
                    <Building size={14} className="text-slate-400 mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Tenant
                    </p>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {user?.tenant_id?.substring(0, 8) || "Global"}
                    </p>
                  </div>

                  <div className="col-span-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1 items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        System ID
                      </p>
                      <p className="text-xs font-mono font-medium text-slate-600 mt-0.5">
                        {user?.id}
                      </p>
                    </div>
                    <Hash size={14} className="text-slate-300" />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-200/50 hover:text-slate-900 transition-colors"
                  >
                    <Key size={16} className="text-slate-400" /> Change Password
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (logout) logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="text-red-400" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};
