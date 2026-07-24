import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext();
const OnlineUsersContext = createContext({});

export const useSocket = () => useContext(SocketContext);
export const useOnlineUsers = () => useContext(OnlineUsersContext);

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL.replace(/\/api$/, "");
  return window.location.origin;
};

const SOCKET_URL = getSocketUrl();

export const SocketProvider = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const navigate = useNavigate();

  // Safely extract a primitive ID so object mutations don't trigger a reconnect
  const userId = user?.id || user?.userId;

  useEffect(() => {
    if (!loading && userId) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // 🟢 ERROR LOGGING (Crucial for production debugging)
      newSocket.on("connect_error", (err) => {
        console.warn(`Socket connection error: ${err.message}`);
      });

      newSocket.on("online_users_list", (statusesObj) => {
        setUserStatuses(statusesObj);
      });

      newSocket.on(
        "user_status_change",
        ({ userId: changedUserId, status }) => {
          setUserStatuses((prev) => {
            const updatedState = { ...prev };
            if (status === "offline") {
              delete updatedState[String(changedUserId)];
            } else {
              updatedState[String(changedUserId)] = status;
            }
            return updatedState;
          });
        },
      );

      // 🟢 GUARDED VISIBILITY DETECTOR
      const handleVisibilityChange = () => {
        if (!newSocket.connected) return; // Prevent emitting if disconnected

        if (document.hidden) {
          newSocket.emit("set_status", "away");
        } else {
          newSocket.emit("set_status", "online");
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      newSocket.on("force_logout", (data) => {
        toast.error(data.message || "Session terminated from another device.", {
          duration: 5000,
        });
        if (logout) logout();
        newSocket.disconnect();
        navigate("/login");
      });

      newSocket.on("new_ticket_assigned", (data) => {
        toast.success(data.message || "New ticket assigned to you!", {
          icon: "🎫",
          duration: 6000,
        });
      });

      newSocket.on("ticket_reassigned_to_you", (data) => {
        toast.success(
          data.message || "A ticket was manually assigned to you.",
          { icon: "🔄", duration: 6000 },
        );
      });

      newSocket.on("incoming_huddle", (data) => {
        toast(
          (t) => (
            <div className="flex flex-col gap-3">
              <span className="font-bold text-slate-900">{data.message}</span>
              <p className="text-sm text-slate-500">
                A user is waiting for you in the voice huddle.
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(`/tickets/${data.ticketId}/huddle`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex-1"
                >
                  Accept Call
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex-1"
                >
                  Decline
                </button>
              </div>
            </div>
          ),
          { duration: 30000, icon: "☎️", style: { minWidth: "300px" } },
        );
      });

      newSocket.on("new_ticket_message", (data) => {
        const currentUserId = String(userId);
        const userRole = user?.role;

        if (String(data.sender_id) === currentUserId) return;

        const isCreator = currentUserId === String(data.ticket_creator_id);
        const isAssignee = currentUserId === String(data.ticket_assignee_id);
        const isAdmin =
          userRole === "GLOBAL_ADMIN" || userRole === "BACK_OFFICE_MANAGER";

        if (isCreator || isAssignee || isAdmin) {
          const currentPath = window.location.pathname;

          if (!currentPath.includes(`/tickets/${data.ticket_id}`)) {
            toast(
              (t) => (
                <div
                  className="cursor-pointer flex flex-col gap-1"
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(`/tickets/${data.ticket_id}`);
                  }}
                >
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    💬 New Message from {data.sender_name || "Support"}
                  </span>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">
                    {data.message ? data.message : "📎 Sent an attachment"}
                  </p>
                </div>
              ),
              {
                duration: 5000,
                position: "top-right",
                style: { borderLeft: "4px solid #4f46e5" },
              },
            );
          }
        }
      });

      newSocket.on("new_group_message", (data) => {
        const currentUserId = String(userId);
        if (String(data.sender_id) !== currentUserId) {
          const currentPath = window.location.pathname;
          if (!currentPath.includes("/groups")) {
            toast(
              (t) => (
                <div
                  className="cursor-pointer flex flex-col gap-1"
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(`/groups`);
                  }}
                >
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    👥 Group Message from {data.sender_name || "Team"}
                  </span>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">
                    {data.message ? data.message : "📎 Sent an attachment"}
                  </p>
                </div>
              ),
              {
                duration: 5000,
                position: "top-right",
                style: { borderLeft: "4px solid #008069" },
              },
            );
          }
        }
      });

      setSocket(newSocket);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        newSocket.disconnect();
      };
    } else {
      setSocket((prevSocket) => {
        if (prevSocket) prevSocket.disconnect();
        return null;
      });
    }

    // 🔥 Depending only on userId prevents object-mutation reconnects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading]);

  return (
    <SocketContext.Provider value={socket}>
      <OnlineUsersContext.Provider value={userStatuses}>
        {children}
      </OnlineUsersContext.Provider>
    </SocketContext.Provider>
  );
};
