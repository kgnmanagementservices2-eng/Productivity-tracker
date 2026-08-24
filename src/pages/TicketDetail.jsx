/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import TicketHeader from "../components/tickets/detail/TicketHeader";
import TicketInfoSection from "../components/tickets/detail/TicketInfoSection";
import SupportChat from "../components/tickets/detail/SupportChat";
import TicketSidebar from "../components/tickets/detail/TicketSidebar";
import ResolutionCard from "../components/tickets/detail/ResolutionCard";
import { AlertOctagon, Lock } from "lucide-react";
import { Button } from "../components/common/Button";

// Dynamic cinematic gradients based on ticket status
const getBackgroundTheme = (status, isIssue) => {
  if (isIssue) return "bg-gradient-to-br from-red-50 via-white to-rose-50";
  switch (status) {
    case "OPEN":
      return "bg-gradient-to-br from-indigo-50 via-white to-blue-50";
    case "IN_PROGRESS":
      return "bg-gradient-to-br from-amber-50 via-white to-orange-50";
    case "RESOLVED":
      return "bg-gradient-to-br from-emerald-50 via-white to-teal-50";
    case "CLOSED":
      return "bg-gradient-to-br from-slate-100 via-white to-slate-50";
    default:
      return "bg-slate-50";
  }
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTicketData = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.data);
    } catch (error) {
      toast.error("Failed to load ticket details");
      navigate("/tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [id, navigate]);

  const handleToggleIssue = async (isIssue, reason = "") => {
    try {
      await api.put(`/tickets/${id}/issue`, { isIssue, issueReason: reason });
      toast.success(
        isIssue ? "Ticket flagged as an issue!" : "Issue flag removed.",
      );
      fetchTicketData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update issue status.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!ticket) return null;
  const isAdmin = ["GLOBAL_ADMIN", "CEO", "BACK_OFFICE_MANAGER"].includes(
    user?.role,
  );
  const bgTheme = getBackgroundTheme(ticket.status, ticket.is_issue);

  return (
    <div
      className={`min-h-screen ${bgTheme} transition-colors duration-500 -m-6 p-6`}
    >
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 font-sans">
        <TicketHeader ticket={ticket} onBack={() => navigate("/tickets")} />

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6 flex flex-col">
            {/* Issue Banner */}
            {ticket.is_issue && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 mt-0.5">
                    <AlertOctagon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider">
                      Flagged as Critical Issue
                    </h3>
                    <p className="text-sm text-red-700 font-medium mt-1">
                      "{ticket.issue_reason}"
                    </p>
                    <span className="text-[11px] font-semibold text-red-500 mt-2 block">
                      Marked by {ticket.issue_marked_by_name || "Manager"} •
                      Cannot be resolved until cleared.
                    </span>
                  </div>
                </div>
                {isAdmin ? (
                  <Button
                    onClick={() => handleToggleIssue(false)}
                    className="bg-white border border-red-300 text-red-700 hover:bg-red-100 font-bold text-xs shrink-0 rounded-lg shadow-sm"
                  >
                    Remove Issue Flag
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-100/60 px-3 py-1.5 rounded-lg shrink-0">
                    <Lock size={12} /> Admin Authorization Required to Clear
                  </div>
                )}
              </div>
            )}

            <TicketInfoSection ticket={ticket} />
            <SupportChat
              ticketId={id}
              currentUserId={user?.id || user?.userId}
              ticketStatus={ticket.status}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 flex flex-col">
            <ResolutionCard
              ticket={ticket}
              user={user}
              onUpdateSuccess={fetchTicketData}
            />
            <TicketSidebar
              ticket={ticket}
              user={user}
              onToggleIssue={handleToggleIssue}
              isAdmin={isAdmin}
              refreshData={fetchTicketData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
