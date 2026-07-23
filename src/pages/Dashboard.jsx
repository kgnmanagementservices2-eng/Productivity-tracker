// /* eslint-disable no-unused-vars */
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import {
//   DollarSign,
//   Ticket,
//   RefreshCcw,
//   CreditCard,
//   X,
//   Building2,
//   Map,
//   Store,
//   ArrowLeft,
//   ArrowRight,
//   Activity,
//   AlertTriangle, // 🟢 NEW
// } from "lucide-react";

// import { useAuth } from "../hooks/useAuth";
// import api from "../services/api";
// import { TrendCard } from "../components/dashboard/TrendCard";
// import { AnalyticsBarChart } from "../components/dashboard/AnalyticsBarChart";
// import { DistributionDonut } from "../components/dashboard/DistributionDonut";
// import { RecentActivityTable } from "../components/dashboard/RecentActivityTable";
// import { RecentNotificationsCard } from "../components/dashboard/RecentNotificationsCard";

// export default function Dashboard() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [stats, setStats] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // DRILL-DOWN STATES
//   const [activeDetailsStatus, setActiveDetailsStatus] = useState(null);
//   const [activeMarket, setActiveMarket] = useState(null);
//   const [activeStore, setActiveStore] = useState(null);

//   // 🟢 NEW: Department Drill-down States
//   const [activeDepartment, setActiveDepartment] = useState(null);
//   const [deptTickets, setDeptTickets] = useState([]);
//   const [isLoadingDeptTickets, setIsLoadingDeptTickets] = useState(false);

//   const [storeTickets, setStoreTickets] = useState([]);
//   const [isLoadingStoreTickets, setIsLoadingStoreTickets] = useState(false);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const response = await api.get("/tickets/stats");
//         setStats(response.data.data);
//       } catch (error) {
//         toast.error("Failed to load dashboard statistics.");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchStats();
//   }, []);

//   const detailData = activeDetailsStatus
//     ? stats?.detailed?.[activeDetailsStatus]
//     : null;

//   const handleStoreClick = async (store) => {
//     setActiveStore(store);
//     setIsLoadingStoreTickets(true);
//     try {
//       const res = await api.get(
//         `/tickets?storeId=${store.id}&status=${activeDetailsStatus}&limit=50`,
//       );
//       setStoreTickets(res.data.data);
//     } catch (e) {
//       toast.error("Failed to load tickets for this store.");
//     } finally {
//       setIsLoadingStoreTickets(false);
//     }
//   };

//   // 🟢 NEW: Department Click Handler
//   const handleDepartmentClick = async (dept) => {
//     setActiveDepartment(dept.name);
//     setIsLoadingDeptTickets(true);
//     try {
//       // Passes departmentName as a query param
//       const res = await api.get(
//         `/tickets?departmentName=${encodeURIComponent(dept.name)}&status=${activeDetailsStatus}&limit=50`,
//       );
//       setDeptTickets(res.data.data);
//     } catch (e) {
//       toast.error("Failed to load tickets for this department.");
//     } finally {
//       setIsLoadingDeptTickets(false);
//     }
//   };

//   const closeDetailsModal = () => {
//     setActiveDetailsStatus(null);
//     setActiveMarket(null);
//     setActiveStore(null);
//     setActiveDepartment(null); // 🟢 Reset Dept state
//     setStoreTickets([]);
//     setDeptTickets([]); // 🟢 Reset Dept tickets
//   };

//   if (isLoading)
//     return (
//       <div className="flex h-screen w-full items-center justify-center bg-slate-50">
//         <div className="flex flex-col items-center gap-3">
//           <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
//           <p className="text-sm font-medium text-slate-500 tracking-wide">
//             Loading Enterprise Data...
//           </p>
//         </div>
//       </div>
//     );

//   return (
//     <div className="space-y-8 bg-slate-50 min-h-screen pb-12 px-4 sm:px-6 lg:px-8 pt-6 font-sans">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
//             Platform Overview
//           </h1>
//           <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
//             <span>Home</span>
//             <span className="text-slate-300">/</span>
//             <span className="text-indigo-600">Dashboard</span>
//           </p>
//         </div>
//       </div>

//       {/* ROW 1: Trend Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
//         <TrendCard
//           title="Total Open Tickets"
//           value={stats?.OPEN || 0}
//           icon={Ticket}
//           isPositive={false}
//           trend={12}
//           theme="amber"
//           onClick={() => setActiveDetailsStatus("OPEN")}
//         />
//         <TrendCard
//           title="In Progress"
//           value={stats?.IN_PROGRESS || 0}
//           icon={RefreshCcw}
//           theme="blue"
//           onClick={() => setActiveDetailsStatus("IN_PROGRESS")}
//         />

//         {/* 🟢 NEW CARD: TAT Breached */}
//         <TrendCard
//           title="TAT Breached"
//           value={stats?.tatBreached || 0}
//           icon={AlertTriangle}
//           theme="rose"
//         />

//         <TrendCard
//           title="Resolved (All Time)"
//           value={stats?.RESOLVED || 0}
//           icon={DollarSign}
//           isPositive={true}
//           trend={8}
//           theme="emerald"
//           onClick={() => setActiveDetailsStatus("RESOLVED")}
//         />
//         <TrendCard
//           title="Total Ticket Volume"
//           value={stats?.total || 0}
//           icon={CreditCard}
//           theme="indigo"
//         />
//       </div>

//       {/* ROW 2: The Main Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <AnalyticsBarChart data={stats?.timeSeries || []} />
//         </div>
//         <div className="lg:col-span-1">
//           <DistributionDonut data={stats?.distribution || []} />
//         </div>
//       </div>

//       {/* ROW 3: Recent Activity & Notifications */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-1">
//           <RecentNotificationsCard />
//         </div>
//         <div className="lg:col-span-2">
//           <RecentActivityTable tickets={stats?.recent || []} />
//         </div>
//       </div>

//       {/* ========================================================= */}
//       {/* THE MULTI-LEVEL DRILL-DOWN MODAL */}
//       {/* ========================================================= */}
//       {activeDetailsStatus && detailData && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-5xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[85vh] border border-slate-200/60 transition-all animate-in zoom-in-95 duration-300">
//             {/* Modal Header */}
//             <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
//                   {activeStore ? (
//                     <>
//                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
//                         <Store size={20} />
//                       </div>
//                       Tickets for {activeStore.name}
//                     </>
//                   ) : activeDepartment ? (
//                     // 🟢 NEW: Department Header
//                     <>
//                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
//                         <Building2 size={20} />
//                       </div>
//                       Tickets for {activeDepartment}
//                     </>
//                   ) : activeMarket ? (
//                     <>
//                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
//                         <Map size={20} />
//                       </div>
//                       Stores in {activeMarket}
//                     </>
//                   ) : (
//                     <>
//                       <div
//                         className={`p-2 rounded-lg ${activeDetailsStatus === "RESOLVED" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
//                       >
//                         <Activity size={20} />
//                       </div>
//                       <span className="capitalize">
//                         {activeDetailsStatus.replace("_", " ").toLowerCase()}
//                       </span>{" "}
//                       Breakdown
//                     </>
//                   )}
//                 </h2>
//               </div>
//               <button
//                 onClick={closeDetailsModal}
//                 className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200/60 shadow-sm"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             {/* Modal Content Window */}
//             <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
//               {/* LEVEL 3: View Actual Tickets */}
//               {activeStore ? (
//                 <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
//                   <button
//                     onClick={() => setActiveStore(null)}
//                     className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
//                   >
//                     <ArrowLeft size={16} /> Back to Stores
//                   </button>

//                   {isLoadingStoreTickets ? (
//                     <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
//                       <Activity className="h-6 w-6 animate-pulse text-indigo-500" />
//                       <span className="text-sm font-medium">
//                         Fetching tickets...
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
//                       <table className="w-full text-sm text-left">
//                         <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
//                           <tr>
//                             <th className="px-6 py-4">Ticket ID</th>
//                             <th className="px-6 py-4">Category</th>
//                             <th className="px-6 py-4">Priority</th>
//                             <th className="px-6 py-4 text-right">
//                               Created Date
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                           {storeTickets.length === 0 && (
//                             <tr>
//                               <td
//                                 colSpan="4"
//                                 className="px-6 py-12 text-center text-slate-400 font-medium"
//                               >
//                                 No tickets found for this store.
//                               </td>
//                             </tr>
//                           )}
//                           {storeTickets.map((t) => (
//                             <tr
//                               key={t.id}
//                               onClick={() => navigate(`/tickets/${t.id}`)}
//                               className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
//                             >
//                               <td className="px-6 py-4 font-mono text-slate-500 group-hover:text-indigo-600 transition-colors">
//                                 {t.id.substring(0, 8)}
//                               </td>
//                               <td className="px-6 py-4 font-medium text-slate-800">
//                                 {t.category_level_1}
//                               </td>
//                               <td className="px-6 py-4">
//                                 <span
//                                   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
//                                     t.priority === "EMERGENCY"
//                                       ? "bg-red-50 text-red-700 border border-red-100"
//                                       : t.priority === "IMPORTANT"
//                                         ? "bg-orange-50 text-orange-700 border border-orange-100"
//                                         : "bg-slate-100 text-slate-700 border border-slate-200"
//                                   }`}
//                                 >
//                                   {t.priority}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 text-right text-slate-500 font-medium">
//                                 {new Date(t.created_at).toLocaleDateString(
//                                   undefined,
//                                   {
//                                     month: "short",
//                                     day: "numeric",
//                                     year: "numeric",
//                                   },
//                                 )}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               ) : activeDepartment ? (
//                 /* 🟢 NEW LEVEL 3: View Department Tickets */
//                 <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
//                   <button
//                     onClick={() => setActiveDepartment(null)}
//                     className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
//                   >
//                     <ArrowLeft size={16} /> Back to Breakdown
//                   </button>

//                   {isLoadingDeptTickets ? (
//                     <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
//                       <Activity className="h-6 w-6 animate-pulse text-indigo-500" />
//                       <span className="text-sm font-medium">
//                         Fetching tickets...
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
//                       <table className="w-full text-sm text-left">
//                         <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
//                           <tr>
//                             <th className="px-6 py-4">Ticket ID</th>
//                             <th className="px-6 py-4">Category</th>
//                             <th className="px-6 py-4">Priority</th>
//                             <th className="px-6 py-4 text-right">
//                               Created Date
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                           {deptTickets.length === 0 && (
//                             <tr>
//                               <td
//                                 colSpan="4"
//                                 className="px-6 py-12 text-center text-slate-400 font-medium"
//                               >
//                                 No tickets found for this department.
//                               </td>
//                             </tr>
//                           )}
//                           {deptTickets.map((t) => (
//                             <tr
//                               key={t.id}
//                               onClick={() => navigate(`/tickets/${t.id}`)}
//                               className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
//                             >
//                               <td className="px-6 py-4 font-mono text-slate-500 group-hover:text-indigo-600 transition-colors">
//                                 {t.id.substring(0, 8)}
//                               </td>
//                               <td className="px-6 py-4 font-medium text-slate-800">
//                                 {t.category_level_1}
//                               </td>
//                               <td className="px-6 py-4">
//                                 <span
//                                   className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
//                                     t.priority === "EMERGENCY"
//                                       ? "bg-red-50 text-red-700 border border-red-100"
//                                       : t.priority === "IMPORTANT"
//                                         ? "bg-orange-50 text-orange-700 border border-orange-100"
//                                         : "bg-slate-100 text-slate-700 border border-slate-200"
//                                   }`}
//                                 >
//                                   {t.priority}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-4 text-right text-slate-500 font-medium">
//                                 {new Date(t.created_at).toLocaleDateString(
//                                   undefined,
//                                   {
//                                     month: "short",
//                                     day: "numeric",
//                                     year: "numeric",
//                                   },
//                                 )}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               ) : activeMarket ? (
//                 /* LEVEL 2: View Stores in a Market */
//                 <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
//                   <button
//                     onClick={() => setActiveMarket(null)}
//                     className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
//                   >
//                     <ArrowLeft size={16} /> Back to Market List
//                   </button>

//                   <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
//                     <table className="w-full text-sm text-left">
//                       <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
//                         <tr>
//                           <th className="px-6 py-4">Store Name</th>
//                           <th className="px-6 py-4 text-right">
//                             Ticket Volume
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-slate-100">
//                         {detailData.stores.filter(
//                           (s) => s.marketName === activeMarket,
//                         ).length === 0 && (
//                           <tr>
//                             <td
//                               colSpan="2"
//                               className="px-6 py-12 text-center text-slate-400 font-medium"
//                             >
//                               No store data found for this market.
//                             </td>
//                           </tr>
//                         )}
//                         {detailData.stores
//                           .filter((s) => s.marketName === activeMarket)
//                           .sort((a, b) => b.count - a.count)
//                           .map((store, idx) => (
//                             <tr
//                               key={idx}
//                               onClick={() => handleStoreClick(store)}
//                               className="hover:bg-slate-50 transition-colors cursor-pointer group"
//                             >
//                               <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
//                                 <div className="p-1.5 bg-slate-100 text-slate-400 rounded-md group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
//                                   <Store size={16} />
//                                 </div>
//                                 {store.name}
//                               </td>
//                               <td className="px-6 py-4 text-right font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
//                                 {store.count}
//                                 <ArrowRight
//                                   size={16}
//                                   className="inline ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
//                                 />
//                               </td>
//                             </tr>
//                           ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               ) : (
//                 /* LEVEL 1: Default Breakdown */
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in duration-500">
//                   {/* Department Table */}
//                   <div className="flex flex-col">
//                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
//                       <Building2 size={16} className="text-indigo-500" /> By
//                       Department
//                     </h3>
//                     <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex-1">
//                       <table className="w-full text-sm text-left">
//                         <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
//                           <tr>
//                             <th className="px-5 py-3">Department</th>
//                             <th className="px-5 py-3 text-right">Count</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                           {detailData.departments.length === 0 ? (
//                             <tr>
//                               <td
//                                 colSpan="2"
//                                 className="px-5 py-8 text-center text-slate-400"
//                               >
//                                 No data available
//                               </td>
//                             </tr>
//                           ) : (
//                             detailData.departments
//                               .sort((a, b) => b.count - a.count)
//                               .map((dept, idx) => (
//                                 <tr
//                                   key={idx}
//                                   // 🟢 NEW: Makes the row clickable to drill down
//                                   onClick={() => handleDepartmentClick(dept)}
//                                   className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
//                                 >
//                                   <td className="px-5 py-3.5 font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
//                                     {dept.name}
//                                   </td>
//                                   <td className="px-5 py-3.5 text-right font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
//                                     {dept.count}
//                                     <ArrowRight
//                                       size={14}
//                                       className="inline ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
//                                     />
//                                   </td>
//                                 </tr>
//                               ))
//                           )}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>

//                   {/* Market Table */}
//                   <div className="flex flex-col">
//                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
//                       <Map size={16} className="text-emerald-500" /> By Market
//                     </h3>
//                     <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex-1">
//                       <table className="w-full text-sm text-left">
//                         <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
//                           <tr>
//                             <th className="px-5 py-3">Market Name</th>
//                             <th className="px-5 py-3 text-right">Count</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                           {detailData.markets.length === 0 ? (
//                             <tr>
//                               <td
//                                 colSpan="2"
//                                 className="px-5 py-8 text-center text-slate-400"
//                               >
//                                 No data available
//                               </td>
//                             </tr>
//                           ) : (
//                             detailData.markets
//                               .sort((a, b) => b.count - a.count)
//                               .map((market, idx) => (
//                                 <tr
//                                   key={idx}
//                                   onClick={() => setActiveMarket(market.name)}
//                                   className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
//                                 >
//                                   <td className="px-5 py-3.5 font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
//                                     {market.name}
//                                   </td>
//                                   <td className="px-5 py-3.5 text-right font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
//                                     {market.count}
//                                     <ArrowRight
//                                       size={14}
//                                       className="inline ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
//                                     />
//                                   </td>
//                                 </tr>
//                               ))
//                           )}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DollarSign,
  Ticket,
  RefreshCcw,
  CreditCard,
  X,
  Building2,
  Map,
  Store,
  ArrowLeft,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { TrendCard } from "../components/dashboard/TrendCard";
import { AnalyticsBarChart } from "../components/dashboard/AnalyticsBarChart";
import { DistributionDonut } from "../components/dashboard/DistributionDonut";
import { RecentActivityTable } from "../components/dashboard/RecentActivityTable";
import { RecentNotificationsCard } from "../components/dashboard/RecentNotificationsCard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeDetailsStatus, setActiveDetailsStatus] = useState(null);
  const [activeMarket, setActiveMarket] = useState(null);
  const [activeStore, setActiveStore] = useState(null);

  const [activeDepartment, setActiveDepartment] = useState(null);
  const [deptTickets, setDeptTickets] = useState([]);
  const [isLoadingDeptTickets, setIsLoadingDeptTickets] = useState(false);

  const [storeTickets, setStoreTickets] = useState([]);
  const [isLoadingStoreTickets, setIsLoadingStoreTickets] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/tickets/stats");
        setStats(response.data.data);
      } catch (error) {
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const detailData = activeDetailsStatus
    ? stats?.detailed?.[activeDetailsStatus]
    : null;

  const handleStoreClick = async (store) => {
    setActiveStore(store);
    setIsLoadingStoreTickets(true);
    try {
      const res = await api.get(
        `/tickets?storeId=${store.id}&status=${activeDetailsStatus}&limit=50`,
      );
      setStoreTickets(res.data.data);
    } catch (e) {
      toast.error("Failed to load tickets for this store.");
    } finally {
      setIsLoadingStoreTickets(false);
    }
  };

  const handleDepartmentClick = async (dept) => {
    setActiveDepartment(dept.name);
    setIsLoadingDeptTickets(true);
    try {
      const res = await api.get(
        `/tickets?departmentName=${encodeURIComponent(dept.name)}&status=${activeDetailsStatus}&limit=50`,
      );
      setDeptTickets(res.data.data);
    } catch (e) {
      toast.error("Failed to load tickets for this department.");
    } finally {
      setIsLoadingDeptTickets(false);
    }
  };

  const closeDetailsModal = () => {
    setActiveDetailsStatus(null);
    setActiveMarket(null);
    setActiveStore(null);
    setActiveDepartment(null);
    setStoreTickets([]);
    setDeptTickets([]);
  };

  if (isLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 tracking-wide">
            Loading Enterprise Data...
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen pb-12 px-4 sm:px-6 lg:px-8 pt-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Platform Overview
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span>Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600">Dashboard</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <TrendCard
          title="Total Open Tickets"
          value={stats?.OPEN || 0}
          icon={Ticket}
          isPositive={false}
          trend={12}
          theme="amber"
          onClick={() => setActiveDetailsStatus("OPEN")}
        />
        <TrendCard
          title="In Progress"
          value={stats?.IN_PROGRESS || 0}
          icon={RefreshCcw}
          theme="blue"
          onClick={() => setActiveDetailsStatus("IN_PROGRESS")}
        />

        {/* 🟢 Clickable TAT Breached Card */}
        <TrendCard
          title="TAT Breached"
          value={stats?.tatBreached || 0}
          icon={AlertTriangle}
          theme="rose"
          onClick={() => setActiveDetailsStatus("TAT_BREACHED")}
        />

        <TrendCard
          title="Resolved (All Time)"
          value={stats?.RESOLVED || 0}
          icon={DollarSign}
          isPositive={true}
          trend={8}
          theme="emerald"
          onClick={() => setActiveDetailsStatus("RESOLVED")}
        />
        <TrendCard
          title="Total Ticket Volume"
          value={stats?.total || 0}
          icon={CreditCard}
          theme="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsBarChart data={stats?.timeSeries || []} />
        </div>
        <div className="lg:col-span-1">
          <DistributionDonut data={stats?.distribution || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentNotificationsCard />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityTable tickets={stats?.recent || []} />
        </div>
      </div>

      {activeDetailsStatus && detailData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[85vh] border border-slate-200/60 transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                  {activeStore ? (
                    <>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Store size={20} />
                      </div>
                      Tickets for {activeStore.name}
                    </>
                  ) : activeDepartment ? (
                    <>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building2 size={20} />
                      </div>
                      Tickets for {activeDepartment}
                    </>
                  ) : activeMarket ? (
                    <>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Map size={20} />
                      </div>
                      Stores in {activeMarket}
                    </>
                  ) : (
                    <>
                      {/* 🟢 Dynamic Header Icon Colors */}
                      <div
                        className={`p-2 rounded-lg ${
                          activeDetailsStatus === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-600"
                            : activeDetailsStatus === "TAT_BREACHED"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {activeDetailsStatus === "TAT_BREACHED" ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <Activity size={20} />
                        )}
                      </div>
                      <span className="capitalize">
                        {activeDetailsStatus.replace("_", " ").toLowerCase()}
                      </span>{" "}
                      Breakdown
                    </>
                  )}
                </h2>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200/60 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
              {activeStore ? (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
                  <button
                    onClick={() => setActiveStore(null)}
                    className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
                  >
                    <ArrowLeft size={16} /> Back to Stores
                  </button>

                  {isLoadingStoreTickets ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                      <Activity className="h-6 w-6 animate-pulse text-indigo-500" />
                      <span className="text-sm font-medium">
                        Fetching tickets...
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                          <tr>
                            <th className="px-6 py-4">Ticket ID</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4 text-right">
                              Created Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {storeTickets.length === 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-6 py-12 text-center text-slate-400 font-medium"
                              >
                                No tickets found for this store.
                              </td>
                            </tr>
                          )}
                          {storeTickets.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => navigate(`/tickets/${t.id}`)}
                              className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4 font-mono text-slate-500 group-hover:text-indigo-600 transition-colors">
                                {t.id.substring(0, 8)}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-800">
                                {t.category_level_1}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    t.priority === "EMERGENCY"
                                      ? "bg-red-50 text-red-700 border border-red-100"
                                      : t.priority === "IMPORTANT"
                                        ? "bg-orange-50 text-orange-700 border border-orange-100"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                {new Date(t.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeDepartment ? (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
                  <button
                    onClick={() => setActiveDepartment(null)}
                    className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
                  >
                    <ArrowLeft size={16} /> Back to Breakdown
                  </button>

                  {isLoadingDeptTickets ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                      <Activity className="h-6 w-6 animate-pulse text-indigo-500" />
                      <span className="text-sm font-medium">
                        Fetching tickets...
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                          <tr>
                            <th className="px-6 py-4">Ticket ID</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4 text-right">
                              Created Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {deptTickets.length === 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-6 py-12 text-center text-slate-400 font-medium"
                              >
                                No tickets found for this department.
                              </td>
                            </tr>
                          )}
                          {deptTickets.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => navigate(`/tickets/${t.id}`)}
                              className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4 font-mono text-slate-500 group-hover:text-indigo-600 transition-colors">
                                {t.id.substring(0, 8)}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-800">
                                {t.category_level_1}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    t.priority === "EMERGENCY"
                                      ? "bg-red-50 text-red-700 border border-red-100"
                                      : t.priority === "IMPORTANT"
                                        ? "bg-orange-50 text-orange-700 border border-orange-100"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                {new Date(t.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeMarket ? (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 ease-out">
                  <button
                    onClick={() => setActiveMarket(null)}
                    className="mb-6 text-sm font-semibold text-slate-500 flex items-center gap-2 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-slate-200/60 shadow-sm w-fit"
                  >
                    <ArrowLeft size={16} /> Back to Market List
                  </button>

                  <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-4">Store Name</th>
                          <th className="px-6 py-4 text-right">
                            Ticket Volume
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailData.stores.filter(
                          (s) => s.marketName === activeMarket,
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan="2"
                              className="px-6 py-12 text-center text-slate-400 font-medium"
                            >
                              No store data found for this market.
                            </td>
                          </tr>
                        )}
                        {detailData.stores
                          .filter((s) => s.marketName === activeMarket)
                          .sort((a, b) => b.count - a.count)
                          .map((store, idx) => (
                            <tr
                              key={idx}
                              onClick={() => handleStoreClick(store)}
                              className="hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 text-slate-400 rounded-md group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                  <Store size={16} />
                                </div>
                                {store.name}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {store.count}
                                <ArrowRight
                                  size={16}
                                  className="inline ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in duration-500">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-indigo-500" /> By
                      Department
                    </h3>
                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex-1">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                          <tr>
                            <th className="px-5 py-3">Department</th>
                            <th className="px-5 py-3 text-right">Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailData.departments.length === 0 ? (
                            <tr>
                              <td
                                colSpan="2"
                                className="px-5 py-8 text-center text-slate-400"
                              >
                                No data available
                              </td>
                            </tr>
                          ) : (
                            detailData.departments
                              .sort((a, b) => b.count - a.count)
                              .map((dept, idx) => (
                                <tr
                                  key={idx}
                                  onClick={() => handleDepartmentClick(dept)}
                                  className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                >
                                  <td className="px-5 py-3.5 font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                                    {dept.name}
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                    {dept.count}
                                    <ArrowRight
                                      size={14}
                                      className="inline ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                    />
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Map size={16} className="text-emerald-500" /> By Market
                    </h3>
                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex-1">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                          <tr>
                            <th className="px-5 py-3">Market Name</th>
                            <th className="px-5 py-3 text-right">Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailData.markets.length === 0 ? (
                            <tr>
                              <td
                                colSpan="2"
                                className="px-5 py-8 text-center text-slate-400"
                              >
                                No data available
                              </td>
                            </tr>
                          ) : (
                            detailData.markets
                              .sort((a, b) => b.count - a.count)
                              .map((market, idx) => (
                                <tr
                                  key={idx}
                                  onClick={() => setActiveMarket(market.name)}
                                  className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                                >
                                  <td className="px-5 py-3.5 font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
                                    {market.name}
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {market.count}
                                    <ArrowRight
                                      size={14}
                                      className="inline ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                    />
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
