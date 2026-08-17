import { ArrowLeft, Target, ShieldAlert, AlertOctagon } from "lucide-react";
import { Button } from "../../common/Button";

export default function TicketHeader({ ticket, onBack }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 backdrop-blur-md px-5 py-4 rounded-xl shadow-sm border border-slate-200/60 gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2 h-auto hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors rounded-lg"
          aria-label="Back to tickets"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Ticket ID</span>
          <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
            #{ticket.id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {ticket.is_issue && (
          <span className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shadow-sm animate-pulse">
            <AlertOctagon size={14} /> FLAGGED ISSUE
          </span>
        )}
        {ticket.ticket_type === "PROACTIVE" ? (
          <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
            <Target size={14} /> Admin's Task
          </span>
        ) : (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
            Reactive Ticket
          </span>
        )}

        {ticket.priority === "EMERGENCY" && (
          <span className="flex items-center gap-1.5 bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
            <ShieldAlert size={14} /> Emergency
          </span>
        )}
      </div>
    </div>
  );
}
