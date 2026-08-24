/* eslint-disable no-unused-vars */
import { Mail, CalendarClock, Clock, Paperclip } from "lucide-react";
import { Card, CardContent } from "../../common/Card";
import { cn } from "../../../utils/cn";

export default function TicketInfoSection({ ticket }) {
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
  const tatDate = ticket.tat ? new Date(ticket.tat) : null;
  const isOverdue = tatDate && !isClosed && new Date() > tatDate;

  let attachments = [];
  if (ticket.attachments) {
    if (Array.isArray(ticket.attachments)) attachments = ticket.attachments;
    else if (typeof ticket.attachments === "string") {
      try {
        if (
          ticket.attachments.startsWith("{") &&
          ticket.attachments.endsWith("}")
        ) {
          const cleanString = ticket.attachments.slice(1, -1);
          attachments = cleanString
            ? cleanString.split(",").map((s) => s.trim().replace(/^"|"$/g, ""))
            : [];
        } else {
          attachments = JSON.parse(ticket.attachments);
        }
      } catch (e) {
        if (ticket.attachments.startsWith("http"))
          attachments = [ticket.attachments];
      }
    }
  }

  const cleanMessage = (text) => {
    if (!text) return "";
    return text
      .replace(/TICKET SUBMISSION:[\s\S]*?Priority:.*(\n|$)/i, "")
      .trim();
  };
  const message =
    cleanMessage(
      ticket.description ||
        ticket.reason ||
        ticket.user_comments ||
        ticket.generated_email_body,
    ) || "No additional comments or details were provided.";

  return (
    <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md overflow-hidden shrink-0">
      <div className="border-b border-slate-100 p-6 sm:p-8 bg-slate-50/40">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm shrink-0">
              <Mail size={22} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Issue with {ticket.category_level_2}
            </h1>
          </div>
          <div className="shrink-0">
            <span className="text-sm font-medium text-slate-600 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(ticket.created_at))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100/80 shadow-sm flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider mb-1 uppercase">
              Routed To
            </span>
            <span className="text-[15px] font-bold text-slate-900">
              {ticket.department_name || "Unassigned"} Department
            </span>
          </div>
          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/80 shadow-sm flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider mb-1 uppercase">
              Submitted By
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 truncate">
                  {ticket.creator_name || "Employee"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ticket.ticket_type !== "PROACTIVE" && (
                  <span className="text-[9px] font-bold bg-indigo-50/80 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100/50">
                    {ticket.store_name || "No Store Selected"}
                  </span>
                )}
                <span className="text-[9px] font-bold bg-emerald-50/80 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100/50">
                  {ticket.market_name || "Global HQ"}
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl border shadow-sm flex flex-col justify-center transition-colors",
              !tatDate
                ? "bg-slate-50/60 border-slate-200/80"
                : isOverdue
                  ? "bg-red-50/80 border-red-200 text-red-800"
                  : "bg-amber-50/60 border-amber-200/80 text-amber-800",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-bold tracking-wider mb-1 uppercase flex items-center gap-1.5",
                !tatDate
                  ? "text-slate-500"
                  : isOverdue
                    ? "text-red-500"
                    : "text-amber-600",
              )}
            >
              {tatDate ? <CalendarClock size={12} /> : <Clock size={12} />}
              {tatDate
                ? isOverdue
                  ? "Overdue Deadline"
                  : "Deadline (TAT)"
                : "Target SLA"}
            </span>
            <span className="text-[15px] font-bold">
              {tatDate
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }).format(tatDate)
                : "Standard Reactive"}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8 bg-white/90">
        <div className="text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-none space-y-6">
          <p className="font-medium">Hello Support Team,</p>

          <p className="font-medium">
            I am submitting a request regarding{" "}
            <span className="font-bold text-indigo-600">
              {ticket.category_level_2}
            </span>{" "}
            under the{" "}
            <span className="font-bold text-slate-900">
              {ticket.category_level_1}
            </span>{" "}
            category.
          </p>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5 sm:p-6 text-slate-800 whitespace-pre-wrap shadow-sm">
            {message}
          </div>

          <p className="font-medium">
            Please review the details provided above and assist accordingly.
          </p>

          <div className="pt-4 font-medium">
            <p>Thanks & Regards,</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {ticket.creator_name || "Employee"}
            </p>
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="pt-8 mt-8 border-t border-slate-100">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Paperclip size={14} /> Initial Attachments ({attachments.length})
            </h3>
            <div className="flex flex-wrap gap-4">
              {attachments.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-24 w-32 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 ease-out"
                >
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10" />
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
