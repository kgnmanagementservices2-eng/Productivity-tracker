/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  AlertTriangle,
  FilterX,
  Copy,
  Shield,
  Star,
  Eye,
  CalendarClock,
  Building2, // 🟢 Added Icon
  Users, // 🟢 Added Icon
  ChevronDown, // 🟢 Added Icon
} from "lucide-react";
import toast from "react-hot-toast";

import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card, CardContent } from "../components/common/Card";
import { cn } from "../utils/cn";
import { CreateTicketModal } from "../components/tickets/CreateTicketModal";
import { ReassignTicketModal } from "../components/tickets/ReassignTicketModal";

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Top Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [departmentsList, setDepartmentsList] = useState([]);
  const [allMembersList, setAllMembersList] = useState([]); // Store all members

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ticketToReassign, setTicketToReassign] = useState(null);
  const [isEscalation, setIsEscalation] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // 🟢 1. Initialize Default Settings for Managers
  useEffect(() => {
    if (user?.role === "BACK_OFFICE_MANAGER" && user?.department_id) {
      setDepartmentFilter(user.department_id); // Default to their own department
    }
  }, [user]);

  // Fetch Dropdown Data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        if (user?.role === "GLOBAL_ADMIN" || user?.role === "CEO") {
          const deptRes = await api
            .get("/tickets/departments")
            .catch(() => null);
          if (deptRes?.data?.data) {
            setDepartmentsList(deptRes.data.data);
          }
        }

        if (
          ["GLOBAL_ADMIN", "CEO", "BACK_OFFICE_MANAGER"].includes(user?.role)
        ) {
          const usersRes = await api.get("/groups/users").catch(() => null);
          if (usersRes?.data?.data) {
            const backOfficeStaff = usersRes.data.data.filter(
              (u) =>
                u.role === "BACK_OFFICE_MEMBER" ||
                u.role === "BACK_OFFICE_MANAGER",
            );
            setAllMembersList(backOfficeStaff);
          }
        }
      } catch (error) {
        console.error("Failed to load filter dropdowns", error);
      }
    };

    if (user) fetchDropdownData();
  }, [user]);

  // Fetch Tickets
  const fetchTickets = async (currentPage = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (departmentFilter) params.append("departmentId", departmentFilter);
      if (assigneeFilter) params.append("assigneeId", assigneeFilter);

      const response = await api.get(`/tickets?${params.toString()}`);

      if (response.data.meta) {
        setTickets(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      } else {
        const allData = response.data.data;
        setTotalPages(Math.ceil(allData.length / limit));
        setTickets(
          allData.slice((currentPage - 1) * limit, currentPage * limit),
        );
      }
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(page);
  }, [page, statusFilter, priorityFilter, departmentFilter, assigneeFilter]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;
    const handleNewTicket = () => fetchTickets(page);
    socket.on("new_ticket_assigned", handleNewTicket);
    socket.on("ticket_reassigned_to_you", handleNewTicket);
    return () => {
      socket.off("new_ticket_assigned", handleNewTicket);
      socket.off("ticket_reassigned_to_you", handleNewTicket);
    };
  }, [socket, page]);

  // Client-Side Search Filter
  const filteredTickets = tickets.filter(
    (t) =>
      t.category_level_1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category_level_2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.includes(searchTerm),
  );

  // 🟢 FIX: Strictly enforce department matching
  const availableMembers = allMembersList.filter((m) => {
    // If no department is selected, show everyone
    if (!departmentFilter) return true;

    // Otherwise, strictly mandate that their department matches the filter
    return String(m.department_id) === String(departmentFilter);
  });

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    // Only clear department if they are an admin
    if (["GLOBAL_ADMIN", "CEO"].includes(user?.role)) {
      setDepartmentFilter("");
    }
    setAssigneeFilter("");
    setSearchTerm("");
    setPage(1);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("ID Copied", { id: "copy-toast", duration: 2000 });
  };

  const renderAvatar = (name) => {
    if (!name) {
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-400">
            UN
          </div>
          <span className="text-sm font-medium text-slate-400 italic">
            Unassigned
          </span>
        </div>
      );
    }
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    return (
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 shrink-0 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-sm"
          title={name}
        >
          {initials}
        </div>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
          {name}
        </span>
      </div>
    );
  };

  const renderStatus = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <div className="flex items-center gap-2 font-bold text-slate-800 tracking-wide text-xs">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
            </span>
            OPEN
          </div>
        );
      case "IN_PROGRESS":
        return (
          <div className="flex items-center gap-2 font-bold text-slate-800 tracking-wide text-xs">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            IN PROGRESS
          </div>
        );
      case "RESOLVED":
      case "CLOSED":
        return (
          <div className="flex items-center gap-2 font-bold text-slate-800 tracking-wide text-xs">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            {status}
          </div>
        );
      default:
        return status;
    }
  };

  const renderPriority = (priority) => {
    if (priority === "EMERGENCY") {
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 text-red-600">
            <Shield fill="currentColor" size={16} className="drop-shadow-sm" />
            <div className="flex gap-0.5">
              <Star fill="currentColor" size={12} />
              <Star fill="currentColor" size={12} />
              <Star fill="currentColor" size={12} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider">
            EMERGENCY
          </span>
        </div>
      );
    }
    if (priority === "IMPORTANT") {
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Shield fill="currentColor" size={16} className="drop-shadow-sm" />
            <div className="flex gap-0.5">
              <Star fill="currentColor" size={12} />
              <Star fill="currentColor" size={12} />
              <Star size={12} className="text-slate-300" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider">
            IMPORTANT
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Shield
            fill="currentColor"
            size={16}
            className="drop-shadow-sm text-slate-300"
          />
          <div className="flex gap-0.5">
            <Star fill="currentColor" size={12} className="text-slate-400" />
            <Star size={12} className="text-slate-300" />
            <Star size={12} className="text-slate-300" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-500 tracking-wider">
          STANDARD
        </span>
      </div>
    );
  };

  const renderTicketAge = (ticket) => {
    const start = new Date(ticket.created_at);
    const end =
      ticket.status === "CLOSED" || ticket.status === "RESOLVED"
        ? new Date(ticket.updated_at || new Date())
        : new Date();

    const diffMs = end - start;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const displayHrs = Math.floor(diffHrs);
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeText = "";
    if (displayHrs > 24)
      timeText = `${Math.floor(displayHrs / 24)}d ${displayHrs % 24}h`;
    else if (displayHrs > 0) timeText = `${displayHrs}h ${diffMins}m`;
    else timeText = `${diffMins}m`;

    const targetHours = 12;
    const progressPercent = Math.min((diffHrs / targetHours) * 100, 100);

    let barColor = "bg-indigo-400";
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED")
      barColor = "bg-emerald-400";
    else if (diffHrs >= 12) barColor = "bg-red-500";
    else if (diffHrs >= 6) barColor = "bg-amber-400";

    return (
      <div className="flex flex-col gap-1.5 w-24">
        <span className="font-bold text-slate-800 text-sm">{timeText}</span>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderTAT = (ticket) => {
    if (!ticket.tat) {
      return (
        <span className="text-slate-400 italic text-xs font-medium">
          Reactive (N/A)
        </span>
      );
    }

    const tatDate = new Date(ticket.tat);
    const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
    const isOverdue = !isClosed && new Date() > tatDate;

    return (
      <div className="flex flex-col">
        <div
          className={cn(
            "flex items-center gap-1.5 font-bold text-sm",
            isOverdue ? "text-red-600" : "text-slate-700",
          )}
        >
          <CalendarClock
            size={14}
            className={isOverdue ? "text-red-500" : "text-slate-400"}
          />
          <span>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "America/Chicago",
            }).format(tatDate)}
          </span>
        </div>
        <div
          className={cn(
            "text-xs font-medium ml-5",
            isOverdue ? "text-red-500" : "text-slate-500",
          )}
        >
          {new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
            timeZone: "America/Chicago",
          }).format(tatDate)}
        </div>
        {isOverdue && (
          <span className="text-[9px] uppercase font-bold tracking-wider text-red-500 ml-5 mt-0.5">
            OVERDUE
          </span>
        )}
      </div>
    );
  };

  const getRowStyle = (ticket) => {
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED")
      return "border-l-4 border-l-transparent";
    const hoursOpen =
      (new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60);
    if (hoursOpen >= 12) return "border-l-4 border-l-red-500";
    if (hoursOpen >= 6) return "border-l-4 border-l-amber-400";
    return "border-l-4 border-l-indigo-500";
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Ticket Queue
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Manage and track support requests
          </p>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-6 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-red-600">
              <Shield fill="currentColor" size={14} />
              <div className="flex">
                <Star fill="currentColor" size={10} />
                <Star fill="currentColor" size={10} />
                <Star fill="currentColor" size={10} />
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500">
              EMERGENCY
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-amber-500">
              <Shield fill="currentColor" size={14} />
              <div className="flex">
                <Star fill="currentColor" size={10} />
                <Star fill="currentColor" size={10} />
                <Star size={10} className="text-slate-300" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500">
              IMPORTANT
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Shield
                fill="currentColor"
                size={14}
                className="text-slate-300"
              />
              <div className="flex">
                <Star fill="currentColor" size={10} />
                <Star size={10} className="text-slate-300" />
                <Star size={10} className="text-slate-300" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500">
              STANDARD
            </span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
        <CardContent className="p-0 flex flex-col min-h-[500px]">
          {/* FILTER BAR */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full max-w-sm shrink-0">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                placeholder="Search categories or IDs..."
                className="pl-10 bg-white border-slate-300/80 shadow-sm h-11 text-sm rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex w-full md:w-auto gap-3 items-center overflow-x-auto pb-1 md:pb-0">
              {[
                "EMPLOYEE",
                "MARKET_MANAGER",
                "GLOBAL_ADMIN",
                "CEO",
                "BACK_OFFICE_MANAGER",
              ].includes(user?.role) && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-11 px-5 shadow-sm rounded-lg whitespace-nowrap bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shrink-0"
                >
                  <Plus size={16} className="mr-2 text-slate-400" />
                  {["GLOBAL_ADMIN", "CEO", "BACK_OFFICE_MANAGER"].includes(
                    user?.role,
                  )
                    ? "Assign Task"
                    : "New Ticket"}
                </Button>
              )}

              {/* 🟢 3. NEW: Icon-Based Department Filter (Global Admins & CEO Only) */}
              {["GLOBAL_ADMIN", "CEO"].includes(user?.role) && (
                <div className="relative shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-slate-400" />
                  </div>
                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setAssigneeFilter(""); // Reset assignee when dept changes
                      setPage(1);
                    }}
                    className="h-11 w-44 appearance-none pl-9 pr-8 rounded-lg border border-slate-300/80 bg-white text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                  >
                    <option value="">All Departments</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              )}

              {/* 🟢 4. NEW: Icon-Based Assignee Filter */}
              {/* 🟢 Icon-Based Assignee Filter */}
              {["GLOBAL_ADMIN", "CEO", "BACK_OFFICE_MANAGER"].includes(
                user?.role,
              ) && (
                <div className="relative shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users
                      size={16}
                      className={
                        !departmentFilter &&
                        ["GLOBAL_ADMIN", "CEO"].includes(user?.role)
                          ? "text-slate-300"
                          : "text-slate-400"
                      }
                    />
                  </div>
                  <select
                    value={assigneeFilter}
                    onChange={handleFilterChange(setAssigneeFilter)}
                    disabled={
                      !departmentFilter &&
                      ["GLOBAL_ADMIN", "CEO"].includes(user?.role)
                    }
                    className="h-11 w-44 appearance-none pl-9 pr-8 rounded-lg border border-slate-300/80 bg-white text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 truncate"
                  >
                    <option value="">
                      {!departmentFilter &&
                      ["GLOBAL_ADMIN", "CEO"].includes(user?.role)
                        ? "Select Dept..."
                        : "All Members"}
                    </option>

                    {/* 🟢 FIX 2: Added crucial filter to find tickets with no owner */}
                    <option value="UNASSIGNED">Unassigned (Queue)</option>

                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              )}
              <select
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                className="h-11 w-36 rounded-lg border border-slate-300/80 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 cursor-pointer"
              >
                <option value="">◉ All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {(statusFilter ||
                priorityFilter ||
                (["GLOBAL_ADMIN", "CEO"].includes(user?.role) &&
                  departmentFilter) ||
                assigneeFilter ||
                searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="h-11 px-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <FilterX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE DATA */}
          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-700 text-xs font-extrabold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Ticket Age</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">TAT (Deadline)</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-16 text-slate-500 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock
                          className="animate-spin text-indigo-500"
                          size={24}
                        />
                        Loading queue...
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-16 text-slate-500 font-medium"
                    >
                      No tickets match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={cn(
                        "bg-white hover:bg-slate-50/80 transition-colors cursor-default group",
                        getRowStyle(ticket),
                      )}
                    >
                      <td className="px-6 py-5 align-middle">
                        {renderStatus(ticket.status)}
                      </td>
                      <td className="px-6 py-5 align-middle font-mono text-slate-600 font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {ticket.id.substring(0, 8)}
                          <button
                            onClick={() => copyToClipboard(ticket.id)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors focus:outline-none"
                            title="Copy ID"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="font-bold text-slate-800 text-sm mb-0.5">
                          {ticket.category_level_1}
                        </div>
                        <div className="text-slate-400 text-xs font-medium">
                          {ticket.category_level_2}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        {renderPriority(ticket.priority)}
                      </td>
                      <td className="px-6 py-5 align-middle">
                        {renderTicketAge(ticket)}
                      </td>
                      <td className="px-6 py-5 align-middle text-slate-600 font-medium text-xs">
                        <div className="flex flex-col">
                          <span>
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "America/Chicago",
                            }).format(new Date(ticket.created_at))}
                          </span>
                          <span className="text-slate-400">
                            {new Intl.DateTimeFormat("en-US", {
                              hour: "numeric",
                              minute: "numeric",
                              timeZone: "America/Chicago",
                            }).format(new Date(ticket.created_at))}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        {renderTAT(ticket)}
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-2">
                          {renderAvatar(ticket.assignee_name)}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle text-right">
                        <div className="flex justify-end items-center gap-3">
                          {user?.role === "BACK_OFFICE_MEMBER" &&
                            ticket.status !== "CLOSED" &&
                            ticket.status !== "RESOLVED" && (
                              <button
                                onClick={() => {
                                  setTicketToReassign(ticket);
                                  setIsEscalation(true);
                                }}
                                className="text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-md transition-colors"
                                title="Escalate to Manager"
                              >
                                <AlertTriangle size={16} />
                              </button>
                            )}
                          {user?.role === "BACK_OFFICE_MANAGER" &&
                            ticket.status !== "CLOSED" &&
                            ticket.status !== "RESOLVED" && (
                              <button
                                onClick={() => {
                                  setTicketToReassign(ticket);
                                  setIsEscalation(false);
                                }}
                                className="text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition-colors"
                                title="Reassign to Team Member"
                              >
                                <UserPlus size={16} />
                              </button>
                            )}
                          <button
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 font-bold px-4 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-xs tracking-wide"
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white rounded-b-xl">
            <span className="text-sm text-slate-500 font-medium">
              Showing Page {page} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm rounded-lg"
                disabled={page === 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} className="mr-1" /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm rounded-lg"
                disabled={page === totalPages || totalPages === 0 || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchTickets(1);
        }}
      />
      <ReassignTicketModal
        isOpen={!!ticketToReassign}
        ticket={ticketToReassign}
        isEscalation={isEscalation}
        onClose={() => setTicketToReassign(null)}
        onSuccess={() => fetchTickets(page)}
      />
    </div>
  );
}
