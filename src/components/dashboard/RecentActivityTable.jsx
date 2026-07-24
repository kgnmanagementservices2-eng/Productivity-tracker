import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../common/Button";
import { cn } from "../../utils/cn";

export const RecentActivityTable = ({ tickets }) => {
  const navigate = useNavigate();

  // Replaced simple icons with premium Status Badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <div className="flex items-center gap-2 font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">OPEN</span>
          </div>
        );
      case "IN_PROGRESS":
        return (
          <div className="flex items-center gap-2 font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 w-fit">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            <span className="text-xs font-bold tracking-wide">IN PROGRESS</span>
          </div>
        );
      case "RESOLVED":
        return (
          <div className="flex items-center gap-2 font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 w-fit">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            <span className="text-xs font-bold tracking-wide">RESOLVED</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Enriched priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "EMERGENCY":
        return "bg-red-50 text-red-700 border-red-100";
      case "IMPORTANT":
        return "bg-orange-50 text-orange-700 border-orange-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/75 overflow-hidden">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Recent Ticket Activity
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/tickets")}
          className="text-[var(--tenant-primary,#4f46e5)] hover:bg-indigo-50 font-semibold"
        >
          View All <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-4">Ticket ID</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created On</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!tickets || tickets.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 text-slate-500 font-medium"
                >
                  No recent activity found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">
                    {ticket.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {ticket.category_level_1}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold border",
                        getPriorityColor(ticket.priority),
                      )}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      timeZone: "America/Chicago", // Forces the UI to evaluate and print strictly in Central Time
                    }).format(new Date(ticket.created_at))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-semibold"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
