import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../common/Card";
import { Button } from "../../common/Button";
import {
  AlertOctagon,
  UserPlus,
  AlertTriangle,
  Phone,
  Route,
  Activity,
  Clock,
  PhoneMissed,
  PhoneOutgoing,
  PhoneIncoming,
  Lock,
} from "lucide-react";
import { ReassignTicketModal } from "../ReassignTicketModal";

export default function TicketSidebar({
  ticket,
  user,
  onToggleIssue,
  isAdmin,
  refreshData,
}) {
  const [issueReason, setIssueReason] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEscalation, setIsEscalation] = useState(false);

  const canMarkIssue = isAdmin || user?.role === "BACK_OFFICE_MANAGER";
  const isAgent =
    user?.role === "BACK_OFFICE_MEMBER" || user?.role === "BACK_OFFICE_MANAGER";
  const canRoute =
    isAgent && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
  const currentUserId = String(user?.id || user?.userId);
  const isAssignee =
    ticket?.assignee_id && String(ticket.assignee_id) === currentUserId;
  const handleFlagIssue = async () => {
    if (!issueReason || issueReason.trim().length < 5) {
      return toast.error(
        "Please enter a clear reason for marking this as an issue.",
      );
    }
    setIsSubmittingIssue(true);
    await onToggleIssue(true, issueReason);
    setIssueReason("");
    setIsSubmittingIssue(false);
  };

  return (
    <>
      {canMarkIssue && !ticket.is_issue && (
        <Card className="shadow-sm border-red-200 rounded-xl bg-red-50/30 overflow-hidden">
          <CardHeader className="bg-red-50/80 border-b border-red-100 pb-3 pt-4 px-5">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-red-800 uppercase tracking-wider">
              <AlertOctagon size={16} className="text-red-600" /> Flag as Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <textarea
              value={issueReason}
              onChange={(e) => setIssueReason(e.target.value)}
              placeholder="State the reason why this ticket is being flagged as a critical issue..."
              className="w-full min-h-[70px] rounded-lg border border-red-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none shadow-sm resize-none"
            />
            <Button
              onClick={handleFlagIssue}
              disabled={isSubmittingIssue}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm text-xs py-2"
            >
              Mark as Issue
            </Button>
          </CardContent>
        </Card>
      )}

      {canRoute && (
        <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 pt-4 px-5">
            <CardTitle className="text-xs font-semibold flex items-center justify-between text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <UserPlus size={14} className="text-slate-400" /> Assignment
              </span>
              {/* 🟢 SECURITY INDICATOR: Show lock if the agent is not the assignee */}
              {user?.role === "BACK_OFFICE_MEMBER" && !isAssignee && (
                <span className="flex items-center gap-1 text-[9px] bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full">
                  <Lock size={10} /> View Only
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Assignee
              </span>
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shadow-sm">
                  {(ticket.assignee_name || "U")[0].toUpperCase()}
                </div>
                {ticket.assignee_name || "Unassigned"}
              </div>
            </div>

            {user?.role === "BACK_OFFICE_MANAGER" ? (
              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium shadow-sm rounded-lg text-sm transition-colors"
                onClick={() => {
                  setIsEscalation(false);
                  setIsModalOpen(true);
                }}
              >
                <UserPlus size={16} /> Reassign Ticket
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={!isAssignee} // 🟢 STRICT SECURITY: Lock escalation if not assignee
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium shadow-sm rounded-lg text-sm transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
                onClick={() => {
                  setIsEscalation(true);
                  setIsModalOpen(true);
                }}
              >
                <AlertTriangle size={16} />
                {isAssignee ? "Escalate Issue" : "Cannot Escalate"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 pt-4 px-5">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
            <Route size={14} className="text-slate-400" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!ticket.journey || ticket.journey.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              No activity yet.
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-2 space-y-5 pb-1 mt-1">
              {ticket.journey.map((step, index) => {
                let icon = <Activity size={10} />;
                let bgColor = "bg-slate-100 text-slate-500 ring-slate-200";
                if (step.action === "CREATED")
                  bgColor = "bg-indigo-50 text-indigo-600 ring-indigo-200";
                else if (step.action === "AUTO_ASSIGNED")
                  bgColor = "bg-blue-50 text-blue-600 ring-blue-200";
                else if (
                  step.action === "ASSIGNED" ||
                  step.action === "REASSIGNED"
                )
                  bgColor = "bg-emerald-50 text-emerald-600 ring-emerald-200";
                else if (step.action === "ESCALATED")
                  bgColor = "bg-orange-50 text-orange-600 ring-orange-200";

                return (
                  <div key={step.id || index} className="relative pl-5">
                    <div
                      className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-2 ring-white flex items-center justify-center shadow-sm ${bgColor}`}
                    >
                      {icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 tracking-tight">
                        {step.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {step.details ||
                          (step.action === "CREATED"
                            ? "Ticket submitted."
                            : step.action === "AUTO_ASSIGNED"
                              ? "Routed by system."
                              : step.action === "ESCALATED"
                                ? "Escalated to management."
                                : step.action === "REASSIGNED"
                                  ? "Routed to agent."
                                  : "")}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(step.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        {step.actor_name && ` • ${step.actor_name}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 pt-4 px-5">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
            <Clock size={14} className="text-slate-400" /> Huddle Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {!ticket.call_history || ticket.call_history.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              No calls recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {ticket.call_history.map((log) => {
                const isCurrentlyActive = log.ended_at === null;
                const isMissed =
                  !isCurrentlyActive && log.is_answered === false;
                const isOutgoing =
                  log.initiator_id === (user?.id || user?.userId);

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-md ${isMissed ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600"}`}
                      >
                        {isMissed ? (
                          <PhoneMissed size={12} />
                        ) : isOutgoing ? (
                          <PhoneOutgoing size={12} />
                        ) : (
                          <PhoneIncoming size={12} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-900">
                          {log.initiator_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {log.started_at
                            ? new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                              }).format(new Date(log.started_at))
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCurrentlyActive ? (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-emerald-500/20 uppercase tracking-wider animate-pulse">
                          Active
                        </span>
                      ) : isMissed ? (
                        <span className="text-[10px] font-medium text-red-500">
                          Missed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          {Math.floor(log.duration_seconds / 60)}m{" "}
                          {log.duration_seconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ReassignTicketModal
        isOpen={isModalOpen}
        ticket={ticket}
        isEscalation={isEscalation}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshData}
      />
    </>
  );
}
