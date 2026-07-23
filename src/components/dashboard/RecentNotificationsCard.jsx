import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ArrowRight } from "lucide-react";
import api from "../../services/api";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";

export const RecentNotificationsCard = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (res.data && res.data.data) {
          // Only grab the 4 most recent notifications
          setNotifications(res.data.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, referenceId) => {
    try {
      // Optimistically remove from UI for a snappy feel
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await api.put(`/notifications/${id}/read`);

      if (referenceId) {
        navigate(`/tickets/${referenceId}`);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const formatTime = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <Card className="h-full flex flex-col bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 tracking-tight">
            <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
              <Bell size={18} />
            </div>
            Recent Alerts
          </div>
          {notifications.length > 0 && (
            <span className="bg-indigo-50 text-indigo-600 text-[10px] py-1 px-2.5 rounded-full font-bold uppercase tracking-wider ring-1 ring-inset ring-indigo-500/20">
              {notifications.length} New
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden bg-slate-50/30">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-emerald-100">
              <Check size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              You're all caught up
            </p>
            <p className="text-xs text-slate-500 font-medium">
              No pending alerts at the moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.reference_id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group bg-white"
              >
                <div className="mt-1 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                    <span className="truncate pr-4">{notif.title}</span>
                    <ArrowRight
                      size={14}
                      className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    />
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium mb-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {formatTime(notif.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
