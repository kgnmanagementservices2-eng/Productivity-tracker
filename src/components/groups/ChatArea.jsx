// import { useState, useRef } from "react";
// import {
//   Users,
//   UserPlus,
//   MoreVertical,
//   ShieldAlert,
//   Loader2,
//   File,
//   Check,
//   X,
//   Paperclip,
//   Send,
// } from "lucide-react";

// export const ChatArea = ({
//   activeGroup,
//   messages,
//   currentUserId,
//   isLoadingMore,
//   onScroll,
//   onSendMessage,
//   onOpenInfo,
//   onAddMembers,
//   isAdmin,
//   chatContainerRef,
//   messagesEndRef,
// }) => {
//   const [newMessage, setNewMessage] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isSending, setIsSending] = useState(false);
//   const fileInputRef = useRef(null);

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();
//   };

//   const formatRole = (role) =>
//     role
//       ? role
//           .replace(/_/g, " ")
//           .toLowerCase()
//           .replace(/\b\w/g, (l) => l.toUpperCase())
//       : "";

//   const formatTime = (dateString) =>
//     new Intl.DateTimeFormat("en-US", {
//       hour: "numeric",
//       minute: "numeric",
//       hour12: true,
//       timeZone: "America/Chicago",
//     }).format(new Date(dateString));

//   const hideScrollbar =
//     "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if ((!newMessage.trim() && !selectedFile) || !activeGroup || isSending)
//       return;
//     setIsSending(true);
//     await onSendMessage(newMessage, selectedFile);
//     setNewMessage("");
//     setSelectedFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//     setIsSending(false);
//   };

//   if (!activeGroup) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
//         <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200/60">
//           <Users size={32} className="text-slate-300" />
//         </div>
//         <h2 className="text-xl font-bold text-slate-500 tracking-tight">
//           Select a group to start messaging
//         </h2>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 bg-slate-50/30 flex flex-col relative min-w-0 transition-all duration-300">
//       {/* Chat Header */}
//       <div
//         className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 cursor-pointer hover:bg-slate-50/80 transition-colors"
//         onClick={onOpenInfo}
//       >
//         <div className="flex items-center min-w-0">
//           <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold mr-4 shadow-sm border border-white/20">
//             {getInitials(activeGroup.name)}
//           </div>
//           <div className="min-w-0">
//             <h2 className="font-extrabold text-slate-900 truncate tracking-tight">
//               {activeGroup.name}
//             </h2>
//             <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-wider">
//               Tap here for group info
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           {isAdmin && (
//             <>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onAddMembers();
//                 }}
//                 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                 title="Add Members"
//               >
//                 <UserPlus size={18} />
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onOpenInfo();
//                 }}
//                 className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
//                 title="More Options"
//               >
//                 <MoreVertical size={18} />
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Messages */}
//       <div
//         ref={chatContainerRef}
//         onScroll={onScroll}
//         className={`flex-1 p-6 min-h-0 overflow-y-auto ${hideScrollbar} flex flex-col gap-5`}
//       >
//         <div className="text-center mb-6">
//           <span className="bg-slate-100/80 border border-slate-200 text-slate-500 text-xs font-medium py-1.5 px-4 rounded-full shadow-sm inline-flex items-center gap-2">
//             <ShieldAlert size={12} className="text-slate-400" /> Messages are
//             secured within your tenant environment.
//           </span>
//         </div>

//         {isLoadingMore && (
//           <div className="flex justify-center py-2">
//             <Loader2 className="animate-spin text-indigo-500" size={20} />
//           </div>
//         )}

//         {messages.length === 0 && !isLoadingMore ? (
//           <div className="text-center mt-10 text-slate-500 font-medium text-sm">
//             Be the first to send a message to the group!
//           </div>
//         ) : (
//           messages.map((msg) => {
//             const isMe = String(msg.sender_id) === currentUserId;
//             return (
//               <div
//                 key={msg.id}
//                 className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
//               >
//                 {!isMe && (
//                   <span className="text-[11px] font-bold text-slate-500 ml-1.5 mb-1.5 flex items-center gap-1.5">
//                     {msg.sender_name}
//                     <span className="font-medium text-slate-400">
//                       ({formatRole(msg.sender_role)})
//                     </span>
//                   </span>
//                 )}
//                 <div
//                   className={`relative px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMe ? "bg-indigo-600 text-white rounded-tr-sm shadow-[0_4px_14px_rgba(79,70,229,0.15)]" : "bg-white text-slate-800 rounded-tl-sm border border-slate-200/60"}`}
//                 >
//                   {msg.attachment_url && (
//                     <a
//                       href={msg.attachment_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className={`block group ${!msg.message ? "mb-0" : "mb-3"}`}
//                     >
//                       {msg.attachment_name?.match(
//                         /\.(jpeg|jpg|gif|png|webp|avif)$/i,
//                       ) ||
//                       msg.attachment_url?.match(
//                         /\.(jpeg|jpg|gif|png|webp|avif)(\?.*)?$/i,
//                       ) ? (
//                         <img
//                           src={msg.attachment_url}
//                           alt="attachment"
//                           className="rounded-xl max-h-64 max-w-full object-cover border border-black/5 shadow-sm group-hover:opacity-95 transition-opacity"
//                         />
//                       ) : (
//                         <div
//                           className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMe ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"}`}
//                         >
//                           <File
//                             size={18}
//                             className={
//                               isMe ? "text-indigo-200" : "text-indigo-500"
//                             }
//                           />
//                           <span className="truncate text-sm font-semibold max-w-[200px]">
//                             {msg.attachment_name || "Attachment"}
//                           </span>
//                         </div>
//                       )}
//                     </a>
//                   )}
//                   {msg.message && (
//                     <p className="whitespace-pre-wrap">{msg.message}</p>
//                   )}
//                   <div
//                     className={`text-[10px] mt-1.5 flex justify-end items-center gap-1 font-medium ${isMe ? "text-indigo-200" : "text-slate-400"}`}
//                   >
//                     {formatTime(msg.created_at)}
//                     {isMe && <Check size={12} />}
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Chat Input */}
//       <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 flex flex-col shrink-0 px-4 py-3">
//         {selectedFile && (
//           <div className="mb-3 flex items-center">
//             <div className="flex items-center gap-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 shadow-sm w-fit">
//               <File size={16} className="text-indigo-500" />
//               <span className="text-xs text-slate-700 truncate max-w-[200px] font-semibold">
//                 {selectedFile.name}
//               </span>
//               <button
//                 type="button"
//                 onClick={() => setSelectedFile(null)}
//                 className="text-slate-400 hover:text-red-500 p-1 bg-white hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
//               >
//                 <X size={12} />
//               </button>
//             </div>
//           </div>
//         )}
//         <form
//           onSubmit={handleSend}
//           className="flex items-end gap-3 shrink-0 relative"
//         >
//           <input
//             type="file"
//             ref={fileInputRef}
//             onChange={(e) => setSelectedFile(e.target.files[0])}
//             className="hidden"
//           />
//           <button
//             type="button"
//             onClick={() => fileInputRef.current?.click()}
//             disabled={isSending}
//             className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50 shrink-0"
//           >
//             <Paperclip size={20} />
//           </button>
//           <textarea
//             placeholder="Type a message..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             disabled={isSending}
//             className="flex-1 max-h-32 min-h-[48px] bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm disabled:bg-slate-100 min-w-0 resize-none custom-scrollbar"
//             rows={1}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSend(e);
//               }
//             }}
//           />
//           <button
//             type="submit"
//             disabled={(!newMessage.trim() && !selectedFile) || isSending}
//             className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 shrink-0 shadow-sm transition-all"
//           >
//             {isSending ? (
//               <Loader2 size={18} className="animate-spin" />
//             ) : (
//               <Send size={18} className="ml-0.5" />
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };
import { useState, useRef } from "react";
import {
  Users,
  UserPlus,
  MoreVertical,
  ShieldAlert,
  Loader2,
  File,
  Check,
  X,
  Paperclip,
  Send,
} from "lucide-react";

export const ChatArea = ({
  activeGroup,
  messages,
  currentUserId,
  isLoadingMore,
  isLoadingInitialMessages, // 🟢 Added Prop
  onScroll,
  onSendMessage,
  onOpenInfo,
  onAddMembers,
  isAdmin,
  chatContainerRef,
  messagesEndRef,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

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

  const formatTime = (dateString) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "America/Chicago",
    }).format(new Date(dateString));

  const hideScrollbar =
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeGroup || isSending)
      return;
    setIsSending(true);
    await onSendMessage(newMessage, selectedFile);
    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSending(false);
  };

  if (!activeGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200/60">
          <Users size={32} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-500 tracking-tight">
          Select a group to start messaging
        </h2>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/30 flex flex-col relative min-w-0 transition-all duration-300">
      {/* Chat Header */}
      <div
        className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 cursor-pointer hover:bg-slate-50/80 transition-colors"
        onClick={onOpenInfo}
      >
        <div className="flex items-center min-w-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold mr-4 shadow-sm border border-white/20">
            {getInitials(activeGroup.name)}
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-slate-900 truncate tracking-tight">
              {activeGroup.name}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-wider">
              Tap here for group info
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddMembers();
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add Members"
              >
                <UserPlus size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInfo();
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="More Options"
              >
                <MoreVertical size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={onScroll}
        className={`flex-1 p-6 min-h-0 overflow-y-auto ${hideScrollbar} flex flex-col gap-5`}
      >
        <div className="text-center mb-6">
          <span className="bg-slate-100/80 border border-slate-200 text-slate-500 text-xs font-medium py-1.5 px-4 rounded-full shadow-sm inline-flex items-center gap-2">
            <ShieldAlert size={12} className="text-slate-400" /> Messages are
            secured within your tenant environment.
          </span>
        </div>

        {/* 🟢 NEW: Display Loader when fetching initial messages */}
        {isLoadingInitialMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading messages...</span>
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="animate-spin text-indigo-500" size={20} />
              </div>
            )}

            {messages.length === 0 && !isLoadingMore ? (
              <div className="text-center mt-10 text-slate-500 font-medium text-sm">
                Be the first to send a message to the group!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = String(msg.sender_id) === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-bold text-slate-500 ml-1.5 mb-1.5 flex items-center gap-1.5">
                        {msg.sender_name}
                        <span className="font-medium text-slate-400">
                          ({formatRole(msg.sender_role)})
                        </span>
                      </span>
                    )}
                    <div
                      className={`relative px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMe ? "bg-indigo-600 text-white rounded-tr-sm shadow-[0_4px_14px_rgba(79,70,229,0.15)]" : "bg-white text-slate-800 rounded-tl-sm border border-slate-200/60"}`}
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
                              className="rounded-xl max-h-64 max-w-full object-cover border border-black/5 shadow-sm group-hover:opacity-95 transition-opacity"
                            />
                          ) : (
                            <div
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMe ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"}`}
                            >
                              <File
                                size={18}
                                className={
                                  isMe ? "text-indigo-200" : "text-indigo-500"
                                }
                              />
                              <span className="truncate text-sm font-semibold max-w-[200px]">
                                {msg.attachment_name || "Attachment"}
                              </span>
                            </div>
                          )}
                        </a>
                      )}
                      {msg.message && (
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      )}
                      <div
                        className={`text-[10px] mt-1.5 flex justify-end items-center gap-1 font-medium ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                      >
                        {formatTime(msg.created_at)}
                        {isMe && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 flex flex-col shrink-0 px-4 py-3">
        {selectedFile && (
          <div className="mb-3 flex items-center">
            <div className="flex items-center gap-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 shadow-sm w-fit">
              <File size={16} className="text-indigo-500" />
              <span className="text-xs text-slate-700 truncate max-w-[200px] font-semibold">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-red-500 p-1 bg-white hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-3 shrink-0 relative"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            <Paperclip size={20} />
          </button>
          <textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 max-h-32 min-h-[48px] bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm disabled:bg-slate-100 min-w-0 resize-none custom-scrollbar"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
            className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 shrink-0 shadow-sm transition-all"
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
