import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  History,
  PhoneMissed,
  PhoneOutgoing,
  PhoneIncoming,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Card } from "../components/common/Card";

export default function CallHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [callHistory, setCallHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch only the Global History
        const historyRes = await api.get("/tickets/global-call-history");
        setCallHistory(historyRes.data.data);
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Failed to load call history data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds to keep the history up to date
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <History className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium tracking-wide">
            Loading call history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <History className="text-indigo-600" size={32} />
            Call History
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
            A global log of recent voice huddles and network calls.
          </p>
        </div>
      </div>

      {/* Call History List */}
      <section>
        <Card className="shadow-sm border-slate-200/60 rounded-2xl overflow-hidden bg-white">
          <div className="divide-y divide-slate-100">
            {callHistory.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                  <History size={28} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No Call History
                </h3>
                <p className="text-slate-500 mt-1 max-w-sm text-sm">
                  No voice huddles have been recorded on the network yet.
                </p>
              </div>
            ) : (
              callHistory.map((log) => {
                const isCurrentlyActive = log.ended_at === null;
                const isMissed =
                  !isCurrentlyActive && log.is_answered === false;
                const isOutgoing =
                  log.initiator_id === (user?.id || user?.userId);

                return (
                  <div
                    key={log.id}
                    className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Premium Status Icons */}
                      <div
                        className={`p-3 rounded-xl shadow-sm border ${isMissed ? "bg-red-50 text-red-500 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                      >
                        {isMissed ? (
                          <PhoneMissed size={20} />
                        ) : isOutgoing ? (
                          <PhoneOutgoing size={20} />
                        ) : (
                          <PhoneIncoming size={20} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-[15px] font-bold tracking-tight ${isMissed ? "text-red-600" : "text-slate-900"}`}
                          >
                            {log.initiator_name || "Unknown User"}
                          </p>
                          <span className="text-slate-300">•</span>
                          <span
                            onClick={() =>
                              navigate(`/tickets/${log.ticket_id}`)
                            }
                            className="text-sm font-mono font-medium text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer transition-colors bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60"
                          >
                            #{log.ticket_id?.substring(0, 8)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            timeZone: "America/Chicago", // Forces the UI to evaluate and print strictly in Central Time
                          }).format(new Date(log.started_at))}
                        </p>
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="text-right">
                      {isCurrentlyActive ? (
                        <span className="text-xs font-bold text-emerald-700 animate-pulse bg-emerald-50 px-2.5 py-1 rounded-md ring-1 ring-inset ring-emerald-600/20 uppercase tracking-wider">
                          Active
                        </span>
                      ) : isMissed ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            Missed
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1">
                            Waited {log.duration_seconds}s
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-sm">
                          {Math.floor(log.duration_seconds / 60)}m{" "}
                          {log.duration_seconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
