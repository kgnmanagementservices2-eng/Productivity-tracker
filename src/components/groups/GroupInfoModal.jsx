import {
  X,
  ShieldAlert,
  Loader2,
  Trash2,
  UserPlus,
  Search,
  User,
  UserMinus,
} from "lucide-react";

export const GroupInfoModal = ({
  isOpen,
  onClose,
  activeGroup,
  groupMembers,
  isLoadingMembers,
  hasMoreMembers,
  memberSearchQuery,
  onSearchChange,
  onLoadMore,
  isAdmin,
  onAddMembers,
  onRemoveMember,
  onClearChat,
  onDeleteGroup,
  isClearingChat,
  currentUserId,
}) => {
  if (!isOpen || !activeGroup) return null;

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

  const filteredMembers = groupMembers.filter((m) => {
    const searchStr = memberSearchQuery.toLowerCase();
    return (
      (m.name?.toLowerCase() || "").includes(searchStr) ||
      (m.role?.toLowerCase() || "").includes(searchStr)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="h-16 bg-white border-b border-slate-100 flex items-center px-5 shrink-0 justify-between">
          <h2 className="font-extrabold text-slate-900 tracking-tight flex items-center gap-2 text-lg">
            Group Info
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/30">
          <div className="text-center flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-sm border-2 border-white">
              {getInitials(activeGroup.name)}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeGroup.name}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Created {new Date(activeGroup.created_at).toLocaleDateString()}
            </p>
            {activeGroup.description && (
              <p className="text-sm font-medium text-slate-700 mt-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm w-full">
                {activeGroup.description}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Danger Zone
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={onClearChat}
                  disabled={isClearingChat}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-semibold rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                >
                  {isClearingChat ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isClearingChat ? "Clearing..." : "Clear Chat History"}
                </button>
                <button
                  onClick={onDeleteGroup}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-semibold rounded-lg transition-colors border border-red-100"
                >
                  <Trash2 size={16} /> Delete Group
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Participants ({groupMembers.length || 0})
              </h3>
              {isAdmin && (
                <button
                  onClick={onAddMembers}
                  className="text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 ring-1 ring-inset ring-indigo-500/20"
                >
                  <UserPlus size={12} /> Add
                </button>
              )}
            </div>
            <div className="p-3">
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                {isLoadingMembers && groupMembers.length === 0 ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-indigo-500" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center font-medium">
                    <User size={20} className="mb-2 opacity-50" />
                    No members found.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 ring-1 ring-inset ring-indigo-500/20">
                          {getInitials(member.name)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {member.name}{" "}
                            {String(member.id) === currentUserId && (
                              <span className="text-indigo-500 font-medium text-xs ml-1">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wider">
                            {formatRole(member.role)}
                          </p>
                        </div>
                      </div>
                      {isAdmin && String(member.id) !== currentUserId && (
                        <button
                          onClick={() => onRemoveMember(member.id, member.name)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove from group"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
                {hasMoreMembers && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={isLoadingMembers}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoadingMembers ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
