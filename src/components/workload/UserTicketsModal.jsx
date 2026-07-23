/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ticket,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";
import { cn } from "../../utils/cn";

export const UserTicketsModal = ({ isOpen, onClose, user }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      // 🟢 FIX: Appended '&status=OPEN,IN_PROGRESS' to ensure only active tickets load
      api
        .get(`/tickets?assigneeId=${user.id}&status=OPEN,IN_PROGRESS&limit=50`)
        .then((res) => setTickets(res.data.data || []))
        .catch(() => toast.error("Failed to load user tickets"))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Upgraded Status Indicator Logic (Linear/Vercel aesthetic)
  const getStatusTheme = (status) => {
    switch (status) {
      case "OPEN":
        return {
          bg: "bg-amber-50 text-amber-700 ring-amber-600/20",
          icon: <AlertCircle size={14} className="text-amber-500" />,
          label: "Open",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
          icon: <Clock size={14} className="text-indigo-500" />,
          label: "In Progress",
        };
      case "RESOLVED":
        return {
          bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
          icon: <CheckCircle2 size={14} className="text-emerald-500" />,
          label: "Resolved",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 ring-slate-600/20",
          icon: <Ticket size={14} className="text-slate-500" />,
          label: status.replace("_", " "),
        };
    }
  };

  // Upgraded Priority Indicators (Soft backgrounds, crisp borders)
  const getPriorityTheme = (priority) => {
    switch (priority) {
      case "EMERGENCY":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "IMPORTANT":
        return "bg-orange-50 text-orange-700 ring-orange-600/20";
      default:
        return "bg-slate-50 text-slate-600 ring-slate-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Smooth Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container with entry animation */}
      <Card className="w-full max-w-5xl shadow-2xl relative max-h-[90vh] flex flex-col bg-white rounded-2xl border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200 ease-out z-10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors z-20"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <CardHeader className="border-b border-slate-200/60 pb-5 pt-6 px-6 bg-slate-50/50 shrink-0">
          <CardTitle className="flex items-center gap-3 text-xl tracking-tight text-slate-900">
            <div className="p-2 bg-indigo-100/50 rounded-lg border border-indigo-100">
              <Ticket className="text-indigo-600" size={20} />
            </div>
            {user.name}'s Active Queue
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1.5 font-medium pl-11">
            Viewing all open and in-progress tickets currently assigned to this
            team member.
          </p>
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white/80 backdrop-blur-md text-slate-500 font-semibold sticky top-0 z-10 shadow-sm shadow-slate-200/20">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200/60">
                  Status
                </th>
                <th className="px-6 py-4 border-b border-slate-200/60">
                  Ticket ID
                </th>
                <th className="px-6 py-4 border-b border-slate-200/60">
                  Category
                </th>
                <th className="px-6 py-4 border-b border-slate-200/60">
                  Priority
                </th>
                <th className="px-6 py-4 border-b border-slate-200/60 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                // Skeleton Loader Grid
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-7 w-28 bg-slate-100 rounded-md"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 bg-slate-100 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-slate-100 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <div className="h-8 w-24 bg-slate-100 rounded-md"></div>
                    </td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                // Modern Empty State
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                        <Inbox className="text-slate-400" size={24} />
                      </div>
                      <h4 className="text-slate-900 font-medium mb-1">
                        Queue is empty
                      </h4>
                      <p className="text-slate-500 text-sm">
                        This team member currently has no active tickets
                        assigned to them.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const theme = getStatusTheme(ticket.status);
                  return (
                    <tr
                      key={ticket.id}
                      className="group hover:bg-slate-50/80 transition-colors duration-200 ease-in-out"
                    >
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset",
                            theme.bg,
                          )}
                        >
                          {theme.icon}
                          {theme.label}
                        </div>
                      </td>

                      {/* Ticket ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100/80 px-2 py-1 rounded border border-slate-200/50">
                          #{ticket.id.substring(0, 8)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 tracking-tight">
                          {ticket.category_level_1}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span>
                          {ticket.category_level_2}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ring-1 ring-inset",
                            getPriorityTheme(ticket.priority),
                          )}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => {
                            onClose(); // Optional: close modal before navigating
                            navigate(`/tickets/${ticket.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
