/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";

import { GroupSidebar } from "../components/groups/GroupSidebar";
import { ChatArea } from "../components/groups/ChatArea";
import { GroupInfoModal } from "../components/groups/GroupInfoModal";
import { GroupActionModal } from "../components/groups/GroupActionModal";

export default function Groups() {
  const { user } = useAuth();
  const socket = useSocket();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  // 🟢 NEW: Added Loading States
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingInitialMessages, setIsLoadingInitialMessages] =
    useState(false);

  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");

  const isAdmin = user?.role === "GLOBAL_ADMIN";
  const currentUserId = String(user?.userId || user?.id);
  const MEMBERS_PER_PAGE = 10;

  const fetchMyGroups = async () => {
    setIsLoadingGroups(true); // 🟢 Set loading to true
    try {
      const res = await api.get("/groups");
      setGroups(res.data.data);
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      setIsLoadingGroups(false); // 🟢 Turn off loader
    }
  };

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    const fetchInitialMessages = async () => {
      setIsLoadingInitialMessages(true); // 🟢 Set loading to true
      try {
        const res = await api.get(
          `/groups/${activeGroup.id}/messages?page=1&limit=50`,
        );
        setMessages(res.data.data);
        setHasMore(res.data.meta?.hasMore ?? false);
        setPage(1);
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      } catch (error) {
        toast.error("Failed to load chat history");
      } finally {
        setIsLoadingInitialMessages(false); // 🟢 Turn off loader
      }
    };

    setMessages([]);
    fetchInitialMessages();
    setIsGroupInfoOpen(false);
    setMemberSearchQuery("");
  }, [activeGroup]);

  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight } = e.target;
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      const previousScrollHeight = scrollHeight;
      try {
        const nextPage = page + 1;
        // 🟢 Pass Cursor here if you implemented cursor pagination in the backend
        const res = await api.get(
          `/groups/${activeGroup.id}/messages?page=${nextPage}&limit=50`,
        );
        setMessages((prev) => [...res.data.data, ...prev]);
        setHasMore(res.data.meta?.hasMore ?? false);
        setPage(nextPage);
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - previousScrollHeight;
          }
        });
      } catch (error) {
        toast.error("Failed to load older messages");
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const fetchGroupMembers = async (
    groupId,
    currentPage,
    currentSearch,
    append = false,
  ) => {
    setIsLoadingMembers(true);
    try {
      const res = await api.get(`/groups/${groupId}/members`, {
        params: {
          page: currentPage,
          limit: MEMBERS_PER_PAGE,
          search: currentSearch,
        },
      });
      setGroupMembers((prev) =>
        append ? [...prev, ...res.data.data] : res.data.data,
      );
      setHasMoreMembers(res.data.pagination?.hasMore || false);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeGroup && isGroupInfoOpen) {
      const timer = setTimeout(() => {
        setMemberPage(1);
        fetchGroupMembers(activeGroup.id, 1, memberSearchQuery, false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [memberSearchQuery, activeGroup, isGroupInfoOpen]);

  const handleLoadMoreMembers = () => {
    const nextPage = memberPage + 1;
    setMemberPage(nextPage);
    fetchGroupMembers(activeGroup.id, nextPage, memberSearchQuery, true);
  };

  useEffect(() => {
    if (!socket) return;

    // 🟢 1. Create a dedicated function to join the room
    const joinCurrentRoom = () => {
      if (activeGroup) {
        socket.emit("join_group", `group_${activeGroup.id}`);
        console.log(`📡 Joined group room: group_${activeGroup.id}`);
      }
    };

    // Join immediately on load
    joinCurrentRoom();

    // 🟢 2. THE FIX: If the socket silently drops and reconnects, force it to re-join!
    socket.on("connect", joinCurrentRoom);

    const handleNewMessage = (message) => {
      if (activeGroup && String(message.group_id) === String(activeGroup.id)) {
        setMessages((prev) => {
          // Prevent duplicates if the socket fires twice during a reconnect
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);

        if (String(message.sender_id) !== currentUserId) {
          api.put(`/groups/${activeGroup.id}/read`).catch(() => {});
        }
      } else {
        setGroups((prevGroups) =>
          prevGroups.map((g) =>
            String(g.id) === String(message.group_id)
              ? { ...g, unread_count: Number(g.unread_count || 0) + 1 }
              : g,
          ),
        );
      }
    };

    socket.on("new_group_message", handleNewMessage);

    return () => {
      // 🟢 3. Clean up the reconnect listener when leaving the page
      socket.off("connect", joinCurrentRoom);
      socket.off("new_group_message", handleNewMessage);
    };
  }, [socket, activeGroup, currentUserId]);

  const handleGroupSelect = async (group) => {
    setActiveGroup(group);
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === group.id ? { ...g, unread_count: 0 } : g,
      ),
    );
    try {
      await api.put(`/groups/${group.id}/read`);
    } catch (error) {}
  };

  const handleSendMessage = async (text, fileUrl, fileName) => {
    try {
      const res = await api.post(`/groups/${activeGroup.id}/messages`, {
        message: text,
        attachmentUrl: fileUrl,
        attachmentName: fileName,
      });

      const newMsg = res.data.data;

      // 🟢 FIX: Instantly append the message to the screen without waiting for reload
      setMessages((prev) => {
        // Prevent duplicate messages if the socket also delivers it
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Scroll to the bottom to see the new message
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleOpenModal = async (mode = "CREATE") => {
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === "ADD_MEMBERS") setIsGroupInfoOpen(false);

    try {
      const res = await api.get("/groups/users");
      let others = res.data.data.filter((u) => String(u.id) !== currentUserId);
      if (mode === "ADD_MEMBERS" && groupMembers.length > 0) {
        const memberIds = groupMembers.map((m) => String(m.id));
        others = others.filter((u) => !memberIds.includes(String(u.id)));
      }
      setAvailableUsers(others);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const handleSubmitModal = async (data) => {
    if (modalMode === "CREATE") {
      if (!data.name.trim()) return toast.error("Group name is required");
      try {
        await api.post("/groups", {
          name: data.name,
          description: data.description,
          memberIds: data.memberIds,
        });
        toast.success("Group created successfully!");
        setIsModalOpen(false);
        fetchMyGroups();
      } catch (error) {
        toast.error("Failed to create group");
      }
    } else if (modalMode === "ADD_MEMBERS") {
      if (data.memberIds.length === 0)
        return toast.error("Select at least one user");
      try {
        await api.post(`/groups/${activeGroup.id}/members`, {
          memberIds: data.memberIds,
        });
        toast.success("Members added!");
        setIsModalOpen(false);
        fetchGroupMembers(activeGroup.id, 1, "");
        setIsGroupInfoOpen(true);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add members");
      }
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from the group?`)) return;
    try {
      await api.delete(`/groups/${activeGroup.id}/members/${userId}`);
      toast.success(`${userName} removed`);
      setGroupMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to DELETE "${activeGroup.name}"?`,
      )
    )
      return;
    try {
      await api.delete(`/groups/${activeGroup.id}`);
      toast.success(`Group deleted`);
      setActiveGroup(null);
      setIsGroupInfoOpen(false);
      fetchMyGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  };

  const handleClearChat = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete ALL messages in this group?",
      )
    )
      return;
    setIsClearingChat(true);
    try {
      await api.delete(`/groups/${activeGroup.id}/messages`);
      toast.success("Group chat history has been cleared.");
      setMessages([]);
      setIsGroupInfoOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear chat");
    } finally {
      setIsClearingChat(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/80">
      <GroupSidebar
        groups={groups}
        activeGroup={activeGroup}
        onGroupSelect={handleGroupSelect}
        isAdmin={isAdmin}
        onOpenCreateModal={() => handleOpenModal("CREATE")}
        isLoadingGroups={isLoadingGroups} // 🟢 Passed to component
      />
      <ChatArea
        activeGroup={activeGroup}
        messages={messages}
        currentUserId={currentUserId}
        isLoadingMore={isLoadingMore}
        isLoadingInitialMessages={isLoadingInitialMessages} // 🟢 Passed to component
        onScroll={handleScroll}
        onSendMessage={handleSendMessage}
        onOpenInfo={() => setIsGroupInfoOpen(true)}
        onAddMembers={() => handleOpenModal("ADD_MEMBERS")}
        isAdmin={isAdmin}
        chatContainerRef={chatContainerRef}
        messagesEndRef={messagesEndRef}
      />
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        activeGroup={activeGroup}
        groupMembers={groupMembers}
        isLoadingMembers={isLoadingMembers}
        hasMoreMembers={hasMoreMembers}
        memberSearchQuery={memberSearchQuery}
        onSearchChange={setMemberSearchQuery}
        onLoadMore={handleLoadMoreMembers}
        isAdmin={isAdmin}
        onAddMembers={() => handleOpenModal("ADD_MEMBERS")}
        onRemoveMember={handleRemoveMember}
        onClearChat={handleClearChat}
        onDeleteGroup={handleDeleteGroup}
        isClearingChat={isClearingChat}
        currentUserId={currentUserId}
      />
      <GroupActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        availableUsers={availableUsers}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
