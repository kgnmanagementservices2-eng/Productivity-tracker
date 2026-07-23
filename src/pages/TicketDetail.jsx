/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Paperclip,
  Phone,
  Mail,
  ShieldAlert,
  UserPlus,
  AlertTriangle,
  PhoneMissed,
  PhoneOutgoing,
  PhoneIncoming,
  Send,
  X,
  File,
  Route,
  Activity,
  MessageSquare,
  Clock,
  CalendarClock,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import { Button } from "../components/common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/common/Card";
import { ReassignTicketModal } from "../components/tickets/ReassignTicketModal";
import { cn } from "../utils/cn";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusUpdate, setStatusUpdate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEscalation, setIsEscalation] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchTicketData = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.data);
      setStatusUpdate(response.data.data.status);
      setResolutionNotes(response.data.data.resolution_notes || "");

      const msgResponse = await api.get(`/tickets/${id}/messages`);
      if (msgResponse.data && Array.isArray(msgResponse.data.data)) {
        setMessages(msgResponse.data.data);
      } else {
        setMessages([]);
      }
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

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (String(msg.ticket_id) === String(id)) {
        setMessages((prev) => (Array.isArray(prev) ? [...prev, msg] : [msg]));
      }
    };
    socket.on("new_ticket_message", handleNewMessage);
    return () => socket.off("new_ticket_message", handleNewMessage);
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        attachmentUrl = uploadRes.data.data?.url || uploadRes.data.url;
        attachmentName = selectedFile.name;
      }

      await api.post(`/tickets/${id}/messages`, {
        message: newMessage,
        attachmentUrl,
        attachmentName,
      });

      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Failed to send message.");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusUpdate) return toast.error("Please select a status");
    if (statusUpdate === "RESOLVED" && !resolutionNotes) {
      return toast.error("Resolution notes are required to close a ticket");
    }

    try {
      setIsUpdating(true);
      await api.put(`/tickets/${id}/status`, {
        status: statusUpdate,
        resolutionNotes: resolutionNotes,
      });

      toast.success("Ticket updated successfully!");
      setTicket({
        ...ticket,
        status: statusUpdate,
        resolution_notes: resolutionNotes,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
            <div className="h-96 bg-slate-100 rounded-2xl w-full"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-slate-100 rounded-2xl w-full"></div>
            <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

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

  const isAgent =
    user?.role === "BACK_OFFICE_MEMBER" || user?.role === "BACK_OFFICE_MANAGER";
  const canRoute =
    isAgent && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
  const currentUserId = user?.id || user?.userId;

  // 🟢 NEW: TAT / SLA Computation for the Metadata Card
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
  const tatDate = ticket.tat ? new Date(ticket.tat) : null;
  const isOverdue = tatDate && !isClosed && new Date() > tatDate;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/60 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/tickets")}
            className="p-2 h-auto hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors rounded-lg"
            aria-label="Back to Queue"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Ticket ID
            </span>
            <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              #{ticket.id.substring(0, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 🟢 NEW: Proactive vs Reactive Badges */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* LEFT COLUMN: Main Info & Chat */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6 flex flex-col">
          <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white overflow-hidden shrink-0">
            {/* Top Header Section with light background */}
            <div className="border-b border-slate-100 p-6 sm:p-8 bg-slate-50/40">
              {/* Title & Date Row */}
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
                      timeZone: "America/Chicago", // Forces the UI to evaluate and print strictly in Central Time
                    }).format(new Date(ticket.created_at))}
                  </span>
                </div>
              </div>

              {/* 🟢 ENHANCED: Three Side-by-Side Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Routed To Card */}
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100/80 shadow-sm flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider mb-1 uppercase">
                    Routed To
                  </span>
                  <span className="text-[15px] font-bold text-slate-900">
                    {ticket.department_name || "Unassigned"} Department
                  </span>
                </div>

                {/* 2. Submitted By Card */}
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
                    {ticket.ticket_type !== "PROACTIVE" && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold bg-indigo-50/80 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100/50">
                          {ticket.store_name || "N/A"}
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-50/80 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100/50">
                          {ticket.market_name || "Global HQ"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🟢 3. SLA / TAT Deadline Card */}
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
                    {tatDate ? (
                      <CalendarClock size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
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
                          timeZone: "America/Chicago",
                        }).format(tatDate)
                      : "Standard Reactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body Section */}
            <CardContent className="p-6 sm:p-8 bg-white">
              {(() => {
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
                      ticket.generated_email_body,
                  ) || "No additional comments or details were provided.";

                return (
                  <div className="text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-none space-y-6">
                    <p className="font-medium">Hello Support Team,</p>

                    <p className="font-medium">
                      I am facing an issue regarding{" "}
                      <span className="font-bold text-indigo-600">
                        {ticket.category_level_2}
                      </span>{" "}
                      under{" "}
                      <span className="font-bold text-slate-900">
                        {ticket.category_level_1}
                      </span>
                      .
                    </p>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5 sm:p-6 text-slate-800 whitespace-pre-wrap shadow-sm">
                      {message}
                    </div>

                    <p className="font-medium">
                      Kindly look into this issue and assist.
                    </p>

                    <div className="pt-4 font-medium">
                      <p>Thanks & Regards,</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {ticket.creator_name || "Employee"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Attachments Section */}
              {attachments.length > 0 && (
                <div className="pt-8 mt-8 border-t border-slate-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={14} /> Initial Attachments (
                    {attachments.length})
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

          {/* Secure Support Thread */}
          <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white flex flex-col flex-1 min-h-[500px]">
            <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between sticky top-0 z-10">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2 tracking-tight">
                <MessageSquare size={18} className="text-slate-400" />
                Support Thread
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {!messages || messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-200">
                    <MessageSquare size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    No messages yet. Start the conversation below.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine =
                    String(msg.sender_id) === String(currentUserId);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-baseline gap-2 mb-1.5 px-1">
                        <span className="text-xs font-semibold text-slate-600">
                          {isMine ? "You" : msg.sender_name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {msg.created_at
                            ? new Intl.DateTimeFormat("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                                timeZone: "America/Chicago",
                              }).format(new Date(msg.created_at))
                            : ""}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm rounded-2xl ${
                          isMine
                            ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm"
                            : "bg-white border border-slate-200/60 text-slate-800 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.attachment_url && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block group ${!msg.message ? "mb-0" : "mb-3"}`}
                          >
                            {msg.attachment_name?.match(
                              /\.(jpeg|jpg|gif|png|webp|avif)$/i,
                            ) ||
                            msg.attachment_url?.match(
                              /\.(jpeg|jpg|gif|png|webp|avif)(\?.*)?$/i,
                            ) ? (
                              <img
                                src={msg.attachment_url}
                                alt="attachment"
                                className="rounded-xl max-h-64 max-w-full object-cover border border-black/5 shadow-sm group-hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              <div
                                className={`flex items-center gap-3 p-3 rounded-xl border ${isMine ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-200"} transition-colors`}
                              >
                                <File
                                  size={16}
                                  className={
                                    isMine
                                      ? "text-indigo-200"
                                      : "text-slate-400"
                                  }
                                />
                                <span className="truncate text-xs font-medium max-w-[200px]">
                                  {msg.attachment_name || "Attachment"}
                                </span>
                              </div>
                            )}
                          </a>
                        )}

                        {msg.message && (
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Chat Input */}
            {ticket.status !== "CLOSED" && (
              <div className="border-t border-slate-100 bg-white p-4 rounded-b-xl">
                {selectedFile && (
                  <div className="flex items-center gap-3 mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200/60 w-fit">
                    <File size={14} className="text-indigo-500" />
                    <span className="text-xs text-slate-700 truncate max-w-[200px] font-medium">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-3 relative"
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Attach file"
                  >
                    <Paperclip size={20} />
                  </button>

                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Reply to this thread..."
                    className="flex-1 max-h-32 min-h-[44px] bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white resize-none transition-all custom-scrollbar"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />

                  <Button
                    type="submit"
                    disabled={
                      isSending || (!newMessage.trim() && !selectedFile)
                    }
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 h-[44px] w-[44px] flex items-center justify-center shadow-sm"
                  >
                    <Send
                      size={18}
                      className={isSending ? "animate-pulse" : "ml-0.5"}
                    />
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Action Cards */}
        <div className="space-y-6 flex flex-col">
          {/* Action: Ticket Routing */}
          {canRoute && (
            <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 pt-4 px-5">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                  <UserPlus size={14} className="text-slate-400" /> Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Current Assignee
                  </span>
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                      {(ticket.assignee_name || "U")[0].toUpperCase()}
                    </div>
                    {ticket.assignee_name || "Unassigned"}
                  </div>
                </div>

                {user?.role === "BACK_OFFICE_MANAGER" ? (
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium shadow-sm rounded-lg text-sm"
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
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium shadow-sm rounded-lg text-sm transition-colors"
                    onClick={() => {
                      setIsEscalation(true);
                      setIsModalOpen(true);
                    }}
                  >
                    <AlertTriangle size={16} /> Escalate Issue
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action: Voice Huddle (Dark Premium UI) */}
          {/* Action: Voice Huddle (Dark Premium UI) */}
          {ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
            <Card className="bg-slate-900 border-slate-800 shadow-md rounded-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
              <CardContent className="p-5 relative z-10">
                <h3 className="text-base font-semibold mb-1 flex items-center gap-2 tracking-tight text-white">
                  <Phone size={16} className="text-indigo-400 animate-pulse" />{" "}
                  Live Huddle
                </h3>
                <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
                  Start a secure, browser-based voice call to resolve this issue
                  faster.
                </p>
                <Button
                  onClick={() => {
                    // 🟢 UPDATED: Professional maintenance/coming soon popup
                    toast(
                      "The Voice Huddle feature is currently undergoing system upgrades and will be available soon.",
                      {
                        icon: "🛠️",
                        style: {
                          borderRadius: "10px",
                          background: "#1e293b",
                          color: "#fff",
                        },
                        duration: 4000,
                      },
                    );
                  }}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-500 font-medium shadow-sm rounded-lg text-sm border-0 transition-all"
                >
                  Join Voice Huddle
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action: Status Management */}
          <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 pt-4 px-5">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                <Activity size={14} className="text-slate-400" /> Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {/* 🟢 THE FIX: Strict Frontend Authorization Check */}
              {(String(ticket.assignee_id) === String(user.id) ||
                ["BACK_OFFICE_MANAGER", "CEO", "BACK_OFFICE_MEMBER"].includes(
                  user.role,
                )) &&
              ticket.status !== "CLOSED" ? (
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm cursor-pointer"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add resolution details..."
                      className="min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm text-sm"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Update Ticket"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Status
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ring-slate-200 bg-slate-50 text-slate-700">
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  {ticket.resolution_notes && (
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-sm">
                      <strong className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Notes
                      </strong>
                      <span className="text-slate-700">
                        {ticket.resolution_notes}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action: Ticket Journey Timeline */}
          <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white">
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
                      bgColor =
                        "bg-emerald-50 text-emerald-600 ring-emerald-200";
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
                            })}
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

          {/* Action: Call History */}
          <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white">
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
                  {Array.isArray(ticket.call_history) &&
                    ticket.call_history.map((log) => {
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
                                      timeZone: "America/Chicago",
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
        </div>
      </div>

      <ReassignTicketModal
        isOpen={isModalOpen}
        ticket={ticket}
        isEscalation={isEscalation}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchTicketData()}
      />
    </div>
  );
}
