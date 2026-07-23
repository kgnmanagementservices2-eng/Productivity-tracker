import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, UserPlus, AlertTriangle } from "lucide-react";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";

// 🟢 ADDED isEscalation prop
export const ReassignTicketModal = ({ isOpen, onClose, ticket, onSuccess, isEscalation }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/admin/workload")
        .then(res => setTeamMembers(res.data.data))
        .catch(() => toast.error("Failed to load team members"));
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return toast.error("Please select a user");

    try {
      setIsSubmitting(true);
      await api.put(`/tickets/${ticket.id}/reassign`, {
        oldAssigneeId: ticket.assignee_id,
        newAssigneeId: selectedUserId
      });
      
      toast.success(isEscalation ? "Ticket escalated to Manager!" : "Ticket reassigned successfully!");
      onSuccess(); 
      onClose();   
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to route ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 SMART FILTER: If escalating, only show Managers. If reassigning, only show Members.
  const availableUsers = teamMembers.filter(member => 
    isEscalation ? member.role === "BACK_OFFICE_MANAGER" : member.role === "BACK_OFFICE_MEMBER"
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isEscalation ? "text-orange-600" : "text-[var(--tenant-primary)]"}`}>
            {isEscalation ? <AlertTriangle size={20} /> : <UserPlus size={20} />} 
            {isEscalation ? "Escalate Ticket" : "Reassign Ticket"}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {isEscalation 
              ? `Escalate Ticket #${ticket.id.substring(0,8)} to your Department Manager.` 
              : `Select a team member to take over Ticket #${ticket.id.substring(0,8)}.`}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReassign} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {isEscalation ? "Available Managers" : "Available Team Members"}
              </label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">{isEscalation ? "-- Select a Manager --" : "-- Select a new assignee --"}</option>
                {availableUsers.map(member => (
                  <option key={member.id} value={member.id} disabled={member.id === ticket.assignee_id}>
                    {member.name} (Active Tickets: {member.active_ticket_count}) 
                    {member.id === ticket.assignee_id ? " - Current Assignee" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !selectedUserId} variant={isEscalation ? "danger" : "primary"}>
                {isSubmitting ? "Processing..." : isEscalation ? "Escalate Now" : "Confirm Reassignment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};