// import { useEffect, useState, useMemo } from "react";
// import toast from "react-hot-toast";
// import {
//   Users,
//   Briefcase,
//   Activity,
//   Mail,
//   CheckCircle2,
//   AlertCircle,
//   Building2,
//   ChevronRight,
//   ArrowLeft,
//   Crown,
// } from "lucide-react";

// import api from "../services/api";
// import { useAuth } from "../hooks/useAuth";
// import { Button } from "../components/common/Button";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from "../components/common/Card";
// import { UserTicketsModal } from "../components/workload/UserTicketsModal";
// import { cn } from "../utils/cn";

// // Pre-defined rich gradient themes for the Department Cards to make them pop
// const DEPARTMENT_THEMES = [
//   {
//     gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
//     textHover: "group-hover:text-indigo-600",
//     shadow: "hover:shadow-indigo-500/20",
//   },
//   {
//     gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
//     textHover: "group-hover:text-blue-600",
//     shadow: "hover:shadow-blue-500/20",
//   },
//   {
//     gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
//     textHover: "group-hover:text-emerald-600",
//     shadow: "hover:shadow-emerald-500/20",
//   },
//   {
//     gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
//     textHover: "group-hover:text-rose-600",
//     shadow: "hover:shadow-rose-500/20",
//   },
//   {
//     gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
//     textHover: "group-hover:text-amber-600",
//     shadow: "hover:shadow-amber-500/20",
//   },
//   {
//     gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
//     textHover: "group-hover:text-violet-600",
//     shadow: "hover:shadow-violet-500/20",
//   },
// ];

// export default function Workload() {
//   const { user } = useAuth();
//   const [workloadData, setWorkloadData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedUser, setSelectedUser] = useState(null);

//   // State to track which department the Admin is currently viewing[cite: 2]
//   const [selectedDepartment, setSelectedDepartment] = useState(null);

//   const isAdmin = user?.role === "GLOBAL_ADMIN" || user?.role === "CEO";

//   useEffect(() => {
//     const fetchWorkload = async () => {
//       try {
//         const response = await api.get("/admin/workload");
//         setWorkloadData(response.data.data);
//       } catch (error) {
//         toast.error("Failed to load team workload.");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchWorkload();
//   }, []);

//   // Group data by department for Admin view[cite: 2]
//   const groupedDepartments = useMemo(() => {
//     if (!isAdmin) return {};
//     const groups = {};

//     workloadData.forEach((member) => {
//       const dept = member.department_name || "Unassigned";
//       if (!groups[dept]) {
//         groups[dept] = { members: [], totalTickets: 0, manager: null };
//       }
//       groups[dept].members.push(member);
//       groups[dept].totalTickets += Number(member.active_ticket_count || 0);
//       if (member.role === "BACK_OFFICE_MANAGER") {
//         groups[dept].manager = member;
//       }
//     });

//     return Object.keys(groups)
//       .sort()
//       .reduce((acc, key) => {
//         acc[key] = groups[key];
//         acc[key].members.sort((a, b) => {
//           if (a.role === "BACK_OFFICE_MANAGER") return -1;
//           if (b.role === "BACK_OFFICE_MANAGER") return 1;
//           return Number(b.active_ticket_count) - Number(a.active_ticket_count);
//         });
//         return acc;
//       }, {});
//   }, [workloadData, isAdmin]);

//   const getLoadTheme = (count) => {
//     if (count >= 8)
//       return {
//         bg: "bg-red-500",
//         badge: "bg-red-50 text-red-700 ring-red-600/20",
//         icon: <AlertCircle size={14} className="text-red-500" />,
//       };
//     if (count >= 4)
//       return {
//         bg: "bg-orange-500",
//         badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
//         icon: <Activity size={14} className="text-orange-500" />,
//       };
//     return {
//       bg: "bg-emerald-500",
//       badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
//       icon: <CheckCircle2 size={14} className="text-emerald-500" />,
//     };
//   };

//   if (isLoading)
//     return (
//       <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto pt-6 px-4 sm:px-8">
//         <div className="mb-8">
//           <div className="h-10 w-64 bg-slate-200 rounded-lg mb-3"></div>
//           <div className="h-5 w-96 bg-slate-100 rounded-md"></div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[1, 2, 3, 4, 5, 6].map((i) => (
//             <div
//               key={i}
//               className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <div className="flex gap-4 items-center">
//                   <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
//                   <div className="flex flex-col gap-2">
//                     <div className="h-5 w-32 bg-slate-200 rounded"></div>
//                     <div className="h-3 w-24 bg-slate-100 rounded"></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );

//   // Helper to render the member grid[cite: 2]
//   const renderMembers = (members) => {
//     if (members.length === 0) {
//       return (
//         <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-slate-200/60 border-dashed animate-in fade-in zoom-in-95 duration-500">
//           <Activity className="text-slate-300 mb-4" size={48} />
//           <h3 className="text-slate-900 font-bold text-lg mb-1">
//             No team members found
//           </h3>
//           <p className="text-slate-500 text-sm font-medium">
//             There are currently no active members to display.
//           </p>
//         </div>
//       );
//     }

//     return members.map((member, index) => {
//       const theme = getLoadTheme(member.active_ticket_count);
//       const loadPercentage = Math.min(
//         (member.active_ticket_count / 10) * 100,
//         100,
//       );
//       const isManager = member.role === "BACK_OFFICE_MANAGER";

//       return (
//         <Card
//           key={member.id}
//           onClick={() => setSelectedUser(member)}
//           style={{ animationDelay: `${index * 80}ms` }}
//           className={cn(
//             "group relative animate-pop-in bg-white overflow-hidden border shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] cursor-pointer rounded-2xl flex flex-col",
//             isManager
//               ? "ring-2 ring-amber-400 border-transparent shadow-[0_4px_20px_rgb(251,191,36,0.12)] hover:shadow-[0_8px_30px_rgb(251,191,36,0.2)]"
//               : "border-slate-200/80 hover:border-indigo-400/50",
//           )}
//         >
//           {/* Highlight Badge for Manager[cite: 2] */}
//           {isManager && (
//             <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1.5 z-10 shadow-sm uppercase tracking-wider">
//               <Crown size={14} className="animate-bounce" /> Manager
//             </div>
//           )}

//           <CardHeader className="pb-0 pt-6 px-6">
//             <CardTitle className="text-lg flex justify-between items-start">
//               <div className="flex flex-col gap-1.5 overflow-hidden pr-3 mt-1">
//                 <span className="font-bold text-slate-900 tracking-tight truncate flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
//                   {member.name}
//                 </span>
//                 <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate">
//                   <Mail size={13} className="text-slate-400" />
//                   {member.email}
//                 </div>
//               </div>

//               {/* Workload Data Badge */}
//               <div
//                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ring-1 ring-inset ${theme.badge} mt-1 shadow-sm transition-transform duration-300 group-hover:scale-105`}
//               >
//                 {theme.icon}
//                 {member.active_ticket_count}
//               </div>
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="px-6 pb-6 pt-5 flex-grow flex flex-col justify-end">
//             <div
//               className={cn(
//                 "flex items-center gap-2 text-[13px] text-slate-600 mb-6 w-fit px-3 py-1.5 rounded-md border font-bold",
//                 isManager
//                   ? "bg-amber-50/50 border-amber-200 text-amber-800"
//                   : "bg-slate-50 border-slate-200/80",
//               )}
//             >
//               <Briefcase
//                 size={14}
//                 className={isManager ? "text-amber-500" : "text-slate-400"}
//               />
//               {member.department_name || "Unassigned"}
//             </div>

//             {/* Progress Bar */}
//             <div className="mt-auto">
//               <div className="flex justify-between items-end mb-2.5">
//                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
//                   Capacity
//                 </span>
//                 <span className="text-xs font-bold text-slate-700">
//                   {loadPercentage}%
//                 </span>
//               </div>
//               <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
//                 <div
//                   className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${theme.bg}`}
//                   style={{ width: `${loadPercentage}%` }}
//                 >
//                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       );
//     });
//   };

//   return (
//     <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-8 pb-12 pt-6 bg-[#F8FAFC] min-h-screen">
//       {/* INJECTED TOUGH SPRING ANIMATIONS */}
//       <style>{`
//         @keyframes pop-in {
//           0% { opacity: 0; transform: translateY(40px) scale(0.95); }
//           50% { opacity: 1; transform: translateY(-5px) scale(1.02); }
//           100% { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         .animate-pop-in {
//           opacity: 0;
//           animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
//         }
//       `}</style>

//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-200/80 pb-6">
//         <div>
//           <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] tracking-tight flex items-center gap-3">
//             <Users className="text-indigo-600" size={32} />
//             {isAdmin && selectedDepartment
//               ? `${selectedDepartment} Team`
//               : "Team Workload"}
//           </h1>
//           <p className="text-[#64748B] mt-2 text-sm sm:text-base font-medium max-w-2xl">
//             {isAdmin && !selectedDepartment
//               ? "Select a department to view member capacities and open tickets."
//               : "Monitor active ticket distribution and team capacity. Click any member to view their detailed queue."}
//           </p>
//         </div>

//         {/* Back Button for Admin View[cite: 2] */}
//         {isAdmin && selectedDepartment && (
//           <Button
//             variant="secondary"
//             onClick={() => setSelectedDepartment(null)}
//             className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm hover:shadow-md hover:-translate-x-1 transition-all font-bold h-11 px-5 rounded-xl active:scale-95"
//           >
//             <ArrowLeft size={18} className="mr-2" /> All Departments
//           </Button>
//         )}
//       </div>

//       {/* Main Grid Content */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//         {/* VIEW 1: Admin seeing all departments */}
//         {isAdmin && !selectedDepartment ? (
//           Object.keys(groupedDepartments).length === 0 ? (
//             <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border-2 border-slate-200/60 border-dashed animate-in fade-in duration-500">
//               <Building2 className="text-slate-300 mb-4" size={48} />
//               <h3 className="text-slate-900 font-bold text-xl mb-1">
//                 No departments found
//               </h3>
//               <p className="text-slate-500 text-base font-medium mt-1">
//                 There is no workload data to display.
//               </p>
//             </div>
//           ) : (
//             Object.entries(groupedDepartments).map(
//               ([deptName, deptData], index) => {
//                 const theme =
//                   DEPARTMENT_THEMES[index % DEPARTMENT_THEMES.length];
//                 const highTickets = deptData.totalTickets > 10;

//                 return (
//                   <Card
//                     key={deptName}
//                     onClick={() => setSelectedDepartment(deptName)}
//                     style={{ animationDelay: `${index * 80}ms` }}
//                     className={cn(
//                       "group animate-pop-in cursor-pointer bg-white border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 active:scale-[0.98] shadow-sm hover:border-transparent",
//                       theme.shadow,
//                     )}
//                   >
//                     <CardContent className="p-6 flex items-center justify-between">
//                       <div className="flex items-center gap-5">
//                         {/* Upgraded Icon Block with Dynamic Gradient */}
//                         <div
//                           className={cn(
//                             "p-4 text-white rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
//                             theme.gradient,
//                           )}
//                         >
//                           <Building2 size={26} strokeWidth={2.5} />
//                         </div>
//                         <div className="flex flex-col gap-1">
//                           <h3
//                             className={cn(
//                               "text-lg font-extrabold text-slate-900 transition-colors uppercase tracking-tight",
//                               theme.textHover,
//                             )}
//                           >
//                             {deptName}
//                           </h3>
//                           <div className="flex items-center gap-2.5 text-sm font-semibold">
//                             <span className="text-slate-500">
//                               {deptData.members.length} Members
//                             </span>
//                             <span className="h-1.5 w-1.5 bg-slate-300 rounded-full"></span>
//                             <span
//                               className={
//                                 highTickets
//                                   ? "text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60"
//                                   : "text-slate-500"
//                               }
//                             >
//                               {deptData.totalTickets} Active Tickets
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <ChevronRight
//                         size={24}
//                         className="text-slate-300 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110"
//                       />
//                     </CardContent>
//                   </Card>
//                 );
//               },
//             )
//           )
//         ) : (
//           /* VIEW 2: Admin seeing members of a specific department OR Manager seeing their own team[cite: 2] */
//           renderMembers(
//             isAdmin
//               ? groupedDepartments[selectedDepartment].members
//               : workloadData,
//           )
//         )}
//       </div>

//       {/* VIEW 3: Specific User Ticket Modal (Unchanged functionality)[cite: 2] */}
//       <UserTicketsModal
//         isOpen={!!selectedUser}
//         user={selectedUser}
//         onClose={() => setSelectedUser(null)}
//       />
//     </div>
//   );
// }
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Briefcase,
  Activity,
  Mail,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronRight,
  ArrowLeft,
  Crown,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/common/Card";
import { UserTicketsModal } from "../components/workload/UserTicketsModal";
import { cn } from "../utils/cn";
// 🟢 NEW: Import the live presence hook
import { useOnlineUsers } from "../context/SocketContext";

// Pre-defined rich gradient themes for the Department Cards to make them pop
const DEPARTMENT_THEMES = [
  {
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    textHover: "group-hover:text-indigo-600",
    shadow: "hover:shadow-indigo-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    textHover: "group-hover:text-blue-600",
    shadow: "hover:shadow-blue-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
    textHover: "group-hover:text-emerald-600",
    shadow: "hover:shadow-emerald-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    textHover: "group-hover:text-rose-600",
    shadow: "hover:shadow-rose-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    textHover: "group-hover:text-amber-600",
    shadow: "hover:shadow-amber-500/20",
  },
  {
    gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
    textHover: "group-hover:text-violet-600",
    shadow: "hover:shadow-violet-500/20",
  },
];

export default function Workload() {
  const { user } = useAuth();
  // 🟢 NEW: Fetch the live status dictionary
  const onlineUsers = useOnlineUsers() || {};

  const [workloadData, setWorkloadData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // State to track which department the Admin is currently viewing[cite: 9]
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const isAdmin = user?.role === "GLOBAL_ADMIN" || user?.role === "CEO";

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        const response = await api.get("/admin/workload");
        setWorkloadData(response.data.data);
      } catch (error) {
        toast.error("Failed to load team workload.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkload();
  }, []);

  // Group data by department for Admin view[cite: 9]
  const groupedDepartments = useMemo(() => {
    if (!isAdmin) return {};
    const groups = {};

    workloadData.forEach((member) => {
      const dept = member.department_name || "Unassigned";
      if (!groups[dept]) {
        groups[dept] = { members: [], totalTickets: 0, manager: null };
      }
      groups[dept].members.push(member);
      groups[dept].totalTickets += Number(member.active_ticket_count || 0);
      if (member.role === "BACK_OFFICE_MANAGER") {
        groups[dept].manager = member;
      }
    });

    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        // Note: We deliberately do NOT sort by online status here to prevent
        // the cards from rapidly jumping around the screen while an admin is trying to click one.
        acc[key].members.sort((a, b) => {
          if (a.role === "BACK_OFFICE_MANAGER") return -1;
          if (b.role === "BACK_OFFICE_MANAGER") return 1;
          return Number(b.active_ticket_count) - Number(a.active_ticket_count);
        });
        return acc;
      }, {});
  }, [workloadData, isAdmin]);

  const getLoadTheme = (count) => {
    if (count >= 8)
      return {
        bg: "bg-red-500",
        badge: "bg-red-50 text-red-700 ring-red-600/20",
        icon: <AlertCircle size={14} className="text-red-500" />,
      };
    if (count >= 4)
      return {
        bg: "bg-orange-500",
        badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
        icon: <Activity size={14} className="text-orange-500" />,
      };
    return {
      bg: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
    };
  };

  if (isLoading)
    return (
      <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto pt-6 px-4 sm:px-8">
        <div className="mb-8">
          <div className="h-10 w-64 bg-slate-200 rounded-lg mb-3"></div>
          <div className="h-5 w-96 bg-slate-100 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  // Helper to render the member grid[cite: 9]
  const renderMembers = (members) => {
    if (members.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-slate-200/60 border-dashed animate-in fade-in zoom-in-95 duration-500">
          <Activity className="text-slate-300 mb-4" size={48} />
          <h3 className="text-slate-900 font-bold text-lg mb-1">
            No team members found
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            There are currently no active members to display.
          </p>
        </div>
      );
    }

    return members.map((member, index) => {
      const theme = getLoadTheme(member.active_ticket_count);
      const loadPercentage = Math.min(
        (member.active_ticket_count / 10) * 100,
        100,
      );
      const isManager = member.role === "BACK_OFFICE_MANAGER";

      // 🟢 NEW: Get current status from Socket Context
      const status = onlineUsers[String(member.id)] || "offline";

      return (
        <Card
          key={member.id}
          onClick={() => setSelectedUser(member)}
          style={{ animationDelay: `${index * 80}ms` }}
          className={cn(
            "group relative animate-pop-in bg-white overflow-hidden border shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] cursor-pointer rounded-2xl flex flex-col",
            isManager
              ? "ring-2 ring-amber-400 border-transparent shadow-[0_4px_20px_rgb(251,191,36,0.12)] hover:shadow-[0_8px_30px_rgb(251,191,36,0.2)]"
              : "border-slate-200/80 hover:border-indigo-400/50",
          )}
        >
          {/* Highlight Badge for Manager[cite: 9] */}
          {isManager && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1.5 z-10 shadow-sm uppercase tracking-wider">
              <Crown size={14} className="animate-bounce" /> Manager
            </div>
          )}

          <CardHeader className="pb-0 pt-6 px-6">
            <CardTitle className="text-lg flex justify-between items-start">
              <div className="flex flex-col gap-1.5 overflow-hidden pr-3 mt-1">
                {/* 🟢 NEW: Injected Status Badge Next To Name */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                    {member.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold border flex items-center gap-1 shadow-sm transition-all",
                      status === "online"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "away"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-500 border-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        status === "online"
                          ? "bg-emerald-500 shadow-[0_0_4px_#10b981]"
                          : status === "away"
                            ? "bg-amber-400"
                            : "bg-slate-300",
                      )}
                    ></span>
                    {status === "online"
                      ? "Online"
                      : status === "away"
                        ? "Away"
                        : "Offline"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate mt-0.5">
                  <Mail size={13} className="text-slate-400" />
                  {member.email}
                </div>
              </div>

              {/* Workload Data Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ring-1 ring-inset ${theme.badge} mt-1 shadow-sm transition-transform duration-300 group-hover:scale-105`}
              >
                {theme.icon}
                {member.active_ticket_count}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-5 flex-grow flex flex-col justify-end">
            <div
              className={cn(
                "flex items-center gap-2 text-[13px] text-slate-600 mb-6 w-fit px-3 py-1.5 rounded-md border font-bold",
                isManager
                  ? "bg-amber-50/50 border-amber-200 text-amber-800"
                  : "bg-slate-50 border-slate-200/80",
              )}
            >
              <Briefcase
                size={14}
                className={isManager ? "text-amber-500" : "text-slate-400"}
              />
              {member.department_name || "Unassigned"}
            </div>

            {/* Progress Bar */}
            <div className="mt-auto">
              <div className="flex justify-between items-end mb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Capacity
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {loadPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${theme.bg}`}
                  style={{ width: `${loadPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-8 pb-12 pt-6 bg-[#F8FAFC] min-h-screen">
      {/* INJECTED TOUGH SPRING ANIMATIONS */}
      <style>{`
        @keyframes pop-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          50% { opacity: 1; transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-pop-in {
          opacity: 0;
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] tracking-tight flex items-center gap-3">
            <Users className="text-indigo-600" size={32} />
            {isAdmin && selectedDepartment
              ? `${selectedDepartment} Team`
              : "Team Workload"}
          </h1>
          <p className="text-[#64748B] mt-2 text-sm sm:text-base font-medium max-w-2xl">
            {isAdmin && !selectedDepartment
              ? "Select a department to view member capacities and open tickets."
              : "Monitor active ticket distribution and team capacity. Click any member to view their detailed queue."}
          </p>
        </div>

        {/* Back Button for Admin View[cite: 9] */}
        {isAdmin && selectedDepartment && (
          <Button
            variant="secondary"
            onClick={() => setSelectedDepartment(null)}
            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm hover:shadow-md hover:-translate-x-1 transition-all font-bold h-11 px-5 rounded-xl active:scale-95"
          >
            <ArrowLeft size={18} className="mr-2" /> All Departments
          </Button>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* VIEW 1: Admin seeing all departments */}
        {isAdmin && !selectedDepartment ? (
          Object.keys(groupedDepartments).length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border-2 border-slate-200/60 border-dashed animate-in fade-in duration-500">
              <Building2 className="text-slate-300 mb-4" size={48} />
              <h3 className="text-slate-900 font-bold text-xl mb-1">
                No departments found
              </h3>
              <p className="text-slate-500 text-base font-medium mt-1">
                There is no workload data to display.
              </p>
            </div>
          ) : (
            Object.entries(groupedDepartments).map(
              ([deptName, deptData], index) => {
                const theme =
                  DEPARTMENT_THEMES[index % DEPARTMENT_THEMES.length];
                const highTickets = deptData.totalTickets > 10;

                return (
                  <Card
                    key={deptName}
                    onClick={() => setSelectedDepartment(deptName)}
                    style={{ animationDelay: `${index * 80}ms` }}
                    className={cn(
                      "group animate-pop-in cursor-pointer bg-white border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 active:scale-[0.98] shadow-sm hover:border-transparent",
                      theme.shadow,
                    )}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {/* Upgraded Icon Block with Dynamic Gradient */}
                        <div
                          className={cn(
                            "p-4 text-white rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                            theme.gradient,
                          )}
                        >
                          <Building2 size={26} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3
                            className={cn(
                              "text-lg font-extrabold text-slate-900 transition-colors uppercase tracking-tight",
                              theme.textHover,
                            )}
                          >
                            {deptName}
                          </h3>
                          <div className="flex items-center gap-2.5 text-sm font-semibold">
                            <span className="text-slate-500">
                              {deptData.members.length} Members
                            </span>
                            <span className="h-1.5 w-1.5 bg-slate-300 rounded-full"></span>
                            <span
                              className={
                                highTickets
                                  ? "text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60"
                                  : "text-slate-500"
                              }
                            >
                              {deptData.totalTickets} Active Tickets
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={24}
                        className="text-slate-300 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110"
                      />
                    </CardContent>
                  </Card>
                );
              },
            )
          )
        ) : (
          /* VIEW 2: Admin seeing members of a specific department OR Manager seeing their own team[cite: 9] */
          renderMembers(
            isAdmin
              ? groupedDepartments[selectedDepartment].members
              : workloadData,
          )
        )}
      </div>

      {/* VIEW 3: Specific User Ticket Modal (Unchanged functionality)[cite: 9] */}
      <UserTicketsModal
        isOpen={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
