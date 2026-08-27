/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  Plus,
  CopyPlus,
  Edit2,
  Trash2,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { CreateTicketModal } from "../components/tickets/CreateTicketModal";
import { ManageTemplateModal } from "../components/tickets/ManageTemplateModal";

export default function TaskTemplates() {
  const { user } = useAuth();

  // The templates array is now pre-filtered safely by the backend
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // States
  const [ticketPrefillData, setTicketPrefillData] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [departments, setDepartments] = useState([]);

  // ROLE DEFINITIONS
  const isAdmin = ["GLOBAL_ADMIN", "CEO"].includes(user?.role);
  const isManager = ["GLOBAL_ADMIN", "CEO", "BACK_OFFICE_MANAGER"].includes(
    user?.role,
  );

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/ticket-templates");
      setTemplates(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load task templates");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/tickets/departments");
      setDepartments(res.data.data || []);
    } catch (error) {
      console.error("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchTemplates();
    if (isManager) fetchDepartments();
  }, [isManager]);

  const handleGenerateTicket = (tpl) => {
    let calculatedTat = "";
    if (tpl.tat_hours) {
      const targetDate = new Date(Date.now() + tpl.tat_hours * 60 * 60 * 1000);
      targetDate.setMinutes(
        targetDate.getMinutes() - targetDate.getTimezoneOffset(),
      );
      calculatedTat = targetDate.toISOString().slice(0, 16);
    }

    setTicketPrefillData({
      departmentId: tpl.department_id,
      categoryLevel1: tpl.category_level_1,
      categoryLevel2: tpl.category_level_2,
      priority: tpl.priority,
      userComments: tpl.user_comments,
      tat: calculatedTat,
      marketId: tpl.market_id,
      storeId: tpl.store_id,
    });
    setIsTicketModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this template?",
      )
    )
      return;
    try {
      await api.delete(`/ticket-templates/${id}`);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const openManageModal = (template = null) => {
    setEditingTemplate(template);
    setIsManageModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Standard Operations
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Accelerate daily workflows by generating pre-configured,
            standardized tickets instantly.
          </p>
        </div>

        {/* Only Admins and Back Office Managers can create templates */}
        {isManager && (
          <button
            onClick={() => openManageModal()}
            className="bg-[#0F172A] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> Craft Blueprint
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-32 text-slate-400 font-bold flex flex-col items-center gap-3">
          <Clock className="animate-spin text-indigo-500" size={32} /> Loading
          archives...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <FileText size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold text-lg">
            {!isAdmin
              ? "Your department currently has no operational blueprints."
              : "The operational archive is currently empty."}
          </p>
          {isManager && (
            <p className="text-slate-400 text-sm mt-1">
              Create a blueprint to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-900 text-lg leading-tight pr-4">
                  {tpl.template_name}
                </h3>

                {/* Only Admins and Back Office Managers see Edit/Delete buttons */}
                {isManager && (
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openManageModal(tpl)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-6 line-clamp-3 min-h-[48px] leading-relaxed">
                {tpl.template_description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider truncate max-w-[140px]">
                  {tpl.department_name || "Any Dept"}
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} /> {tpl.tat_hours}H
                </span>
              </div>

              {/* Everyone on this page can Execute the workflow */}
              <button
                onClick={() => handleGenerateTicket(tpl)}
                className="mt-auto w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors flex items-center justify-between px-4 group/btn shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <CopyPlus size={16} /> Execute Workflow
                </span>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all text-indigo-400"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {isManageModalOpen && (
        <ManageTemplateModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          onSuccess={() => {
            setIsManageModalOpen(false);
            fetchTemplates();
          }}
          editingTemplate={editingTemplate}
          departments={departments}
        />
      )}

      {isTicketModalOpen && (
        <CreateTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          onSuccess={() => setIsTicketModalOpen(false)}
          prefillData={ticketPrefillData}
        />
      )}
    </div>
  );
}
