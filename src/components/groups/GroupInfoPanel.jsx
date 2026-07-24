/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Search, Loader2, Trash2, ShieldAlert, User, X } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function GroupInfoPanel({ group, onClose, onChatCleared }) {
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const MEMBERS_PER_PAGE = 10;
  const isAdmin =
    currentUser?.role === "GLOBAL_ADMIN" ||
    currentUser?.role === "BACK_OFFICE_MANAGER";

  const fetchMembers = async (currentPage, currentSearch, append = false) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/groups/${group.id}/members`, {
        params: {
          page: currentPage,
          limit: MEMBERS_PER_PAGE,
          search: currentSearch,
        },
      });

      const newMembers = res.data.data;
      setMembers((prev) => (append ? [...prev, ...newMembers] : newMembers));
      setHasMore(res.data.pagination?.hasMore || false);
    } catch (error) {
      toast.error("Failed to load group members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMembers(1, search, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, group.id]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMembers(nextPage, search, true);
  };

  const handleClearChat = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete ALL messages in this group? This cannot be undone.",
    );
    if (!confirmDelete) return;

    setIsClearingChat(true);
    try {
      await api.delete(`/groups/${group.id}/messages`);
      toast.success("Group chat history has been cleared.");
      if (onChatCleared) onChatCleared();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear chat");
    } finally {
      setIsClearingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-hidden w-80 shrink-0 shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 truncate pr-2">
            {group.name}
          </h2>
          <p className="text-xs text-slate-500">Group Information</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 xl:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {isAdmin && (
        <div className="p-4 border-b border-slate-100 bg-red-50/50">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldAlert size={14} /> Admin Controls
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={isClearingChat}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
          >
            {isClearingChat ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {isClearingChat ? "Clearing Chat..." : "Clear Chat History"}
          </Button>
        </div>
      )}

      <div className="p-4 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Members
        </p>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs focus:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {members.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center">
            <User size={24} className="mb-2 opacity-50" />
            No members found.
          </div>
        ) : (
          <ul className="space-y-1">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="font-semibold text-slate-800 text-xs truncate">
                    {member.name} {member.id === currentUser?.id ? "(You)" : ""}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {member.email}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div className="p-2 text-center mt-2 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs h-8"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}

        {isLoading && members.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
