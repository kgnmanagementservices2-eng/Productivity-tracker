import { useState } from "react";
import {
  X,
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  Check,
  ArrowRight,
  Users,
  Plus,
} from "lucide-react";

export const GroupActionModal = ({
  isOpen,
  onClose,
  mode,
  availableUsers,
  onSubmit,
}) => {
  const [creationStep, setCreationStep] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatRole = (role) =>
    role
      ? role
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "";

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const availableRoles = [
    ...new Set(availableUsers.map((u) => u.role).filter(Boolean)),
  ];
  const filteredUsers = availableUsers.filter((u) => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch =
      (u.name?.toLowerCase() || "").includes(searchStr) ||
      (u.role?.toLowerCase() || "").includes(searchStr);
    const matchesRole = roleFilter === "" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isAllSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = filteredUsers.map((u) => u.id);
      setSelectedUserIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    } else {
      const newIds = filteredUsers.map((u) => u.id);
      setSelectedUserIds((prev) => [...new Set([...prev, ...newIds])]);
    }
  };

  const selectedUsersData = availableUsers.filter((u) =>
    selectedUserIds.includes(u.id),
  );

  const handleFinalSubmit = () => {
    if (mode === "CREATE") {
      onSubmit({
        name: groupName,
        description: groupDescription,
        memberIds: selectedUserIds,
      });
    } else {
      onSubmit({ memberIds: selectedUserIds });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 w-full max-w-lg overflow-hidden flex flex-col h-[700px] animate-in zoom-in-95 duration-200">
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 shrink-0 z-10">
          <button
            onClick={() => {
              if (mode === "CREATE" && creationStep === 2) setCreationStep(1);
              else onClose();
            }}
            className="hover:bg-slate-100 text-slate-500 p-2 rounded-full transition-colors"
          >
            {mode === "CREATE" && creationStep === 2 ? (
              <ArrowLeft size={20} />
            ) : (
              <X size={20} />
            )}
          </button>
          <div>
            <h2 className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">
              {mode === "CREATE"
                ? creationStep === 1
                  ? "Add Members"
                  : "Group Details"
                : "Add Members to Group"}
            </h2>
            {creationStep === 1 && (
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
                {selectedUserIds.length} of {availableUsers.length} selected
              </p>
            )}
          </div>
        </div>

        {creationStep === 1 && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {selectedUserIds.length > 0 && (
              <div className="flex overflow-x-auto px-6 py-4 gap-4 border-b border-slate-100 shrink-0 bg-slate-50/50 custom-scrollbar">
                {selectedUsersData.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col items-center gap-2 w-14 shrink-0 group relative animate-in zoom-in duration-200"
                  >
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold ring-1 ring-inset ring-indigo-500/20">
                        {getInitials(u.name)}
                      </div>
                      <button
                        onClick={() => toggleUserSelection(u.id)}
                        className="absolute -bottom-1 -right-1 bg-slate-400 text-white rounded-full p-0.5 border-2 border-white hover:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-600 truncate w-full text-center font-bold">
                      {u.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 text-sm font-medium rounded-lg py-2 px-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                >
                  <option value="">All Roles</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {formatRole(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {filteredUsers.length} Users Found
              </span>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors ring-1 ring-inset ring-transparent hover:ring-indigo-500/20"
              >
                {isAllSelected ? (
                  <CheckSquare size={14} />
                ) : (
                  <Square size={14} />
                )}
                {isAllSelected ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  No users found matching your filters.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "border-slate-300 text-transparent"}`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-[15px]">
                          {u.name}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 truncate uppercase tracking-wider mt-0.5">
                          {formatRole(u.role)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedUserIds.length > 0 && (
              <div className="absolute bottom-6 right-6 animate-in zoom-in">
                <button
                  onClick={() => {
                    if (mode === "CREATE") setCreationStep(2);
                    else handleFinalSubmit();
                  }}
                  className="h-14 w-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(99,102,241,0.4)] hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                  {mode === "CREATE" ? (
                    <ArrowRight size={24} />
                  ) : (
                    <Check size={28} />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {creationStep === 2 && mode === "CREATE" && (
          <div className="flex-1 flex flex-col bg-slate-50/50">
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="h-28 w-28 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-indigo-300 relative group cursor-pointer">
                <Users size={48} />
                <div className="absolute inset-0 bg-slate-900/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus size={24} className="text-indigo-600" />
                </div>
              </div>
              <div className="w-full space-y-5 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Group Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Marketing Campaign"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Description{" "}
                    <span className="normal-case font-medium">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="What is this group for?"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 animate-in zoom-in">
              <button
                onClick={handleFinalSubmit}
                disabled={!groupName.trim()}
                className="h-14 w-14 bg-indigo-600 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(99,102,241,0.4)] disabled:shadow-none hover:scale-105 transition-all"
              >
                <Check size={28} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
