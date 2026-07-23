// import { Users, Plus, MessageSquare } from "lucide-react";
// import { cn } from "../../utils/cn";

// export const GroupSidebar = ({
//   groups,
//   activeGroup,
//   onGroupSelect,
//   isAdmin,
//   onOpenCreateModal,
// }) => {
//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();
//   };

//   const hideScrollbar =
//     "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

//   return (
//     <div className="w-full md:w-[320px] lg:w-[380px] border-r border-slate-200/80 flex flex-col bg-white shrink-0">
//       <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
//         <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
//           <Users size={22} className="text-indigo-600" />
//           Team Groups
//         </h2>
//         {isAdmin && (
//           <button
//             onClick={onOpenCreateModal}
//             className="h-9 w-9 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors border border-slate-200/60 shadow-sm"
//             title="Create New Group"
//           >
//             <Plus size={18} />
//           </button>
//         )}
//       </div>

//       <div className={`flex-1 overflow-y-auto ${hideScrollbar}`}>
//         {groups.length === 0 ? (
//           <div className="p-10 text-center text-slate-400 flex flex-col items-center">
//             <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
//               <MessageSquare size={28} className="text-slate-300" />
//             </div>
//             <p className="text-sm font-medium">You aren't in any groups yet.</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-slate-100/60 p-2">
//             {groups.map((group) => (
//               <button
//                 key={group.id}
//                 onClick={() => onGroupSelect(group)}
//                 className={cn(
//                   "w-full flex items-center gap-3.5 p-3 text-left rounded-xl transition-all duration-200",
//                   activeGroup?.id === group.id
//                     ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-500/20"
//                     : "hover:bg-slate-50",
//                 )}
//               >
//                 <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm border border-white/20">
//                   {getInitials(group.name)}
//                 </div>
//                 <div className="flex-1 min-w-0 flex justify-between items-center">
//                   <div className="min-w-0 pr-3">
//                     <h3
//                       className={cn(
//                         "font-bold truncate text-[15px]",
//                         activeGroup?.id === group.id
//                           ? "text-indigo-900"
//                           : "text-slate-800",
//                       )}
//                     >
//                       {group.name}
//                     </h3>
//                     <p
//                       className={cn(
//                         "text-xs truncate mt-0.5 font-medium",
//                         activeGroup?.id === group.id
//                           ? "text-indigo-600/70"
//                           : "text-slate-500",
//                       )}
//                     >
//                       {group.description || "Tap to view messages"}
//                     </p>
//                   </div>
//                   {Number(group.unread_count) > 0 && (
//                     <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm animate-in zoom-in duration-200">
//                       {group.unread_count}
//                     </span>
//                   )}
//                 </div>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
import { Users, Plus, MessageSquare, Loader2 } from "lucide-react"; // 🟢 Imported Loader2
import { cn } from "../../utils/cn";

export const GroupSidebar = ({
  groups,
  activeGroup,
  onGroupSelect,
  isAdmin,
  onOpenCreateModal,
  isLoadingGroups, // 🟢 Added Prop
}) => {
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const hideScrollbar =
    "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] border-r border-slate-200/80 flex flex-col bg-white shrink-0">
      <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <Users size={22} className="text-indigo-600" />
          Team Groups
        </h2>
        {isAdmin && (
          <button
            onClick={onOpenCreateModal}
            className="h-9 w-9 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors border border-slate-200/60 shadow-sm"
            title="Create New Group"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${hideScrollbar}`}>
        {/* 🟢 NEW: Display Loader when fetching groups */}
        {isLoadingGroups ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading groups...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center mt-10">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
              <MessageSquare size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium">You aren't in any groups yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60 p-2">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onGroupSelect(group)}
                className={cn(
                  "w-full flex items-center gap-3.5 p-3 text-left rounded-xl transition-all duration-200",
                  activeGroup?.id === group.id
                    ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-500/20"
                    : "hover:bg-slate-50",
                )}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm border border-white/20">
                  {getInitials(group.name)}
                </div>
                <div className="flex-1 min-w-0 flex justify-between items-center">
                  <div className="min-w-0 pr-3">
                    <h3
                      className={cn(
                        "font-bold truncate text-[15px]",
                        activeGroup?.id === group.id
                          ? "text-indigo-900"
                          : "text-slate-800",
                      )}
                    >
                      {group.name}
                    </h3>
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5 font-medium",
                        activeGroup?.id === group.id
                          ? "text-indigo-600/70"
                          : "text-slate-500",
                      )}
                    >
                      {group.description || "Tap to view messages"}
                    </p>
                  </div>
                  {Number(group.unread_count) > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm animate-in zoom-in duration-200">
                      {group.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
