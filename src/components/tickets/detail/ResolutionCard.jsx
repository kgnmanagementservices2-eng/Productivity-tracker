// import { useState, useRef, useEffect } from "react";
// import toast from "react-hot-toast";
// import axios from "axios";
// import api from "../../../services/api";
// import { Card, CardHeader, CardTitle, CardContent } from "../../common/Card";
// import { Button } from "../../common/Button";
// import {
//   ShieldCheck,
//   Image as ImageIcon,
//   RefreshCw,
//   ServerCrash,
//   UploadCloud,
//   ExternalLink,
// } from "lucide-react";

// const sanitizeFileName = (fileName) => {
//   return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_").toLowerCase();
// };

// // UI Helper for dynamic status coloring
// const getStatusStyles = (status) => {
//   const styles = {
//     OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
//     IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-300",
//     RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
//     CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
//   };
//   return styles[status] || styles.CLOSED;
// };

// export default function ResolutionCard({ ticket, user, onUpdateSuccess }) {
//   // Check if the user is an admin
//   const isAdmin = ["GLOBAL_ADMIN", "CEO"].includes(user?.role);

//   // Initialize status to prevent re-selecting IN_PROGRESS if it's already IN_PROGRESS
//   const [statusUpdate, setStatusUpdate] = useState(() => {
//     if (ticket.status === "IN_PROGRESS") return "RESOLVED";
//     return ticket.status || "OPEN";
//   });

//   const [resolutionNotes, setResolutionNotes] = useState(
//     ticket.resolution_notes || "",
//   );
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Database URL state
//   const [proofOfWorkUrl, setProofOfWorkUrl] = useState(
//     ticket.proof_of_work_url || "",
//   );

//   // Local Queue State (Holds file before user clicks Update)
//   const [selectedPowFile, setSelectedPowFile] = useState(null);
//   const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

//   const [powUploadState, setPowUploadState] = useState({
//     status: "idle", // idle | uploading | error
//     progress: 0,
//     errorMsg: null,
//   });

//   const powFileInputRef = useRef(null);

//   // Sync state if ticket data updates via parent refresh/reload
//   useEffect(() => {
//     if (ticket && !isAdmin) {
//       if (ticket.proof_of_work_url) setProofOfWorkUrl(ticket.proof_of_work_url);
//       if (ticket.resolution_notes) setResolutionNotes(ticket.resolution_notes);
//       if (ticket.status !== "IN_PROGRESS") {
//         setStatusUpdate(ticket.status);
//       }
//     }
//   }, [ticket, isAdmin]);

//   // Clean up object URLs to prevent memory leaks
//   useEffect(() => {
//     return () => {
//       if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
//     };
//   }, [localPreviewUrl]);

//   // STRICT FORMATTING: Only allow images
//   const handleFileSelect = (file) => {
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       return toast.error(
//         "Invalid format: Only image files are permitted for Proof of Work.",
//       );
//     }

//     const MAX_SIZE_MB = import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 25;
//     if (file.size > MAX_SIZE_MB * 1024 * 1024) {
//       return toast.error(
//         `File exceeds maximum allowed size of ${MAX_SIZE_MB}MB.`,
//       );
//     }

//     setSelectedPowFile(file);
//     setLocalPreviewUrl(URL.createObjectURL(file));
//     setPowUploadState({ status: "idle", progress: 0, errorMsg: null });
//   };

//   // PASTE HANDLER: Scans clipboard strictly for image formats
//   const handlePowPaste = (e) => {
//     const items = e.clipboardData?.items;
//     if (!items) return;
//     for (let i = 0; i < items.length; i++) {
//       if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
//         const file = items[i].getAsFile();
//         if (file) {
//           handleFileSelect(file);
//           e.preventDefault();
//           return;
//         }
//       }
//     }
//   };

//   // Used internally post-upload
//   const clearSelection = () => {
//     setSelectedPowFile(null);
//     setLocalPreviewUrl(null);
//     if (powFileInputRef.current) powFileInputRef.current.value = "";
//   };

//   // Main Submit Handler
//   const handleUpdateStatus = async (e) => {
//     e.preventDefault();
//     if (!statusUpdate) return toast.error("Please select a status");

//     const isResolved = statusUpdate === "RESOLVED";

//     if (isResolved) {
//       // 🟢 THE FIX: 10-Minute Minimum Review Constraint
//       if (ticket.created_at) {
//         // Handle timezone discrepancies safely by replacing ' ' with 'T' and appending 'Z' if needed
//         let safeDateStr = ticket.created_at;
//         if (typeof safeDateStr === "string") {
//           if (!safeDateStr.includes("T"))
//             safeDateStr = safeDateStr.replace(" ", "T");
//           if (
//             !safeDateStr.endsWith("Z") &&
//             !safeDateStr.match(/[+-]\d{2}:\d{2}$/)
//           ) {
//             safeDateStr += "Z";
//           }
//         }

//         const createdAtMs = new Date(safeDateStr).getTime();
//         const nowMs = Date.now();
//         const diffInMinutes = Math.floor((nowMs - createdAtMs) / (1000 * 60));

//         if (diffInMinutes < 10) {
//           const remainingMins = 10 - diffInMinutes;
//           return toast.error(
//             `Quality Control: Tickets cannot be resolved within 10 minutes of creation. Please review the issue thoroughly. (${remainingMins} min${remainingMins > 1 ? "s" : ""} remaining)`,
//             { duration: 5000 },
//           );
//         }
//       }

//       // STRICT VALIDATION: Require BOTH proof and notes if resolving
//       if (!proofOfWorkUrl && !selectedPowFile) {
//         return toast.error(
//           "Ticket CANNOT be resolved without a Proof of Work screenshot.",
//         );
//       }
//       if (!resolutionNotes || resolutionNotes.trim() === "") {
//         return toast.error(
//           "Ticket CANNOT be resolved without Resolution Notes.",
//         );
//       }
//     }

//     try {
//       setIsUpdating(true);
//       let finalS3Url = proofOfWorkUrl;

//       // 1. Upload to S3 ONLY if a new file is queued
//       if (selectedPowFile) {
//         setPowUploadState({ status: "uploading", progress: 0, errorMsg: null });
//         const safeFileName = sanitizeFileName(selectedPowFile.name);

//         const presignedRes = await api.post("/upload/presigned-url", {
//           fileName: safeFileName,
//           fileType: selectedPowFile.type,
//         });

//         const { uploadUrl, fileUrl } = presignedRes.data.data;

//         await axios.put(uploadUrl, selectedPowFile, {
//           headers: { "Content-Type": selectedPowFile.type },
//           onUploadProgress: (progressEvent) => {
//             if (progressEvent.total) {
//               const percentCompleted = Math.round(
//                 (progressEvent.loaded * 100) / progressEvent.total,
//               );
//               setPowUploadState({
//                 status: "uploading",
//                 progress: percentCompleted,
//                 errorMsg: null,
//               });
//             }
//           },
//         });

//         finalS3Url = fileUrl;
//         setProofOfWorkUrl(fileUrl);
//       }

//       // 2. Only send URL if resolved
//       const payloadUrl = isResolved ? finalS3Url : null;

//       // 3. Save to Database
//       await api.put(`/tickets/${ticket.id}/status`, {
//         status: statusUpdate,
//         resolutionNotes: resolutionNotes,
//         proofOfWorkUrl: payloadUrl,
//       });

//       toast.success("Ticket status updated successfully!");
//       clearSelection();
//       setPowUploadState({ status: "idle", progress: 0, errorMsg: null });
//       onUpdateSuccess();
//     } catch (error) {
//       const errMsg =
//         error.response?.data?.message || "Failed to process update.";
//       setPowUploadState({ status: "error", progress: 0, errorMsg: errMsg });
//       toast.error(errMsg);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // ----------------------------------------------------------------------
//   // ADMIN READ-ONLY VIEW
//   // ----------------------------------------------------------------------
//   if (isAdmin) {
//     return (
//       <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md transition-all">
//         <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 pt-4 px-5">
//           <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
//             <ShieldCheck size={16} className="text-slate-400" /> Resolution
//             Details
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-5 space-y-6">
//           <div>
//             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
//               Current Status
//             </label>
//             <span
//               className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset uppercase tracking-wider shadow-sm ${getStatusStyles(
//                 ticket.status || "OPEN",
//               )}`}
//             >
//               {ticket.status ? ticket.status.replace("_", " ") : "OPEN"}
//             </span>
//           </div>

//           <div>
//             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
//               Proof of Work
//             </label>
//             {ticket.proof_of_work_url ? (
//               <a
//                 href={ticket.proof_of_work_url}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="group relative block w-fit rounded-xl overflow-hidden shadow-sm border-2 border-slate-200 hover:border-indigo-400 transition-colors"
//               >
//                 <img
//                   src={ticket.proof_of_work_url}
//                   alt="Proof of Work"
//                   className="h-28 w-36 object-cover bg-slate-50 group-hover:scale-105 transition-transform duration-300"
//                 />
//                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
//                   <ExternalLink
//                     className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md"
//                     size={20}
//                   />
//                 </div>
//               </a>
//             ) : (
//               <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-sm text-slate-400 italic flex items-center justify-center">
//                 No proof of work uploaded yet.
//               </div>
//             )}
//           </div>

//           <div>
//             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
//               Resolution Notes
//             </label>
//             {ticket.resolution_notes ? (
//               <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
//                 {ticket.resolution_notes}
//               </div>
//             ) : (
//               <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-sm text-slate-400 italic flex items-center justify-center">
//                 No resolution notes provided yet.
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   // ----------------------------------------------------------------------
//   // AGENT / MANAGER INTERACTIVE VIEW
//   // ----------------------------------------------------------------------
//   return (
//     <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md">
//       <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 pt-4 px-5">
//         <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
//           <ShieldCheck size={16} className="text-indigo-500" /> Resolution &
//           Proof
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="p-5">
//         <form onSubmit={handleUpdateStatus} className="space-y-6">
//           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
//             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               Current Status
//             </span>
//             <span
//               className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset uppercase tracking-wider shadow-sm ${getStatusStyles(
//                 ticket.status || "OPEN",
//               )}`}
//             >
//               {ticket.status ? ticket.status.replace("_", " ") : "OPEN"}
//             </span>
//           </div>

//           <div
//             className="flex flex-col space-y-2 rounded-xl outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
//             onPaste={handlePowPaste}
//             tabIndex={0}
//           >
//             <div className="flex items-center justify-between mb-1 pointer-events-none">
//               <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
//                 <ImageIcon size={14} className="text-indigo-500" /> Proof of
//                 Work
//               </label>
//             </div>

//             <input
//               type="file"
//               accept="image/*"
//               ref={powFileInputRef}
//               className="hidden"
//               onChange={(e) => handleFileSelect(e.target.files[0])}
//             />

//             {powUploadState.status === "uploading" && (
//               <div className="w-full border border-indigo-200 bg-indigo-50 rounded-xl p-4 shadow-sm mb-3 animate-pulse">
//                 <div className="flex justify-between items-center text-xs font-bold text-indigo-900 mb-2">
//                   <span className="flex items-center gap-2">
//                     <RefreshCw
//                       size={14}
//                       className="animate-spin text-indigo-600"
//                     />
//                     Uploading to Secure Storage...
//                   </span>
//                   <span>{powUploadState.progress}%</span>
//                 </div>
//                 <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
//                   <div
//                     className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
//                     style={{ width: `${powUploadState.progress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             {powUploadState.status === "error" && (
//               <div className="w-full border border-red-200 bg-red-50 rounded-xl p-3 flex flex-col gap-2 mb-3">
//                 <div className="flex items-start gap-2 text-red-700 text-xs font-bold">
//                   <ServerCrash size={14} className="shrink-0 mt-0.5" />
//                   <span>{powUploadState.errorMsg}</span>
//                 </div>
//               </div>
//             )}

//             {/* 🟢 REPLACEMENT ONLY UX */}
//             {localPreviewUrl || proofOfWorkUrl ? (
//               <div className="space-y-3">
//                 <div className="relative group rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-4 transition-all hover:shadow-sm">
//                   <img
//                     src={localPreviewUrl || proofOfWorkUrl}
//                     alt="Proof of work preview"
//                     className="h-14 w-14 object-cover rounded-lg border border-emerald-200 bg-white"
//                   />
//                   <div className="flex-1 min-w-0">
//                     <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
//                       <ShieldCheck size={14} className="text-emerald-600" />
//                       {localPreviewUrl ? "Queued for Upload" : "Secured in DB"}
//                     </span>
//                     <a
//                       href={localPreviewUrl || proofOfWorkUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline truncate block"
//                     >
//                       {selectedPowFile
//                         ? selectedPowFile.name
//                         : "View Source Image"}
//                     </a>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => powFileInputRef.current?.click()}
//                       className="px-4 py-2 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 bg-white border border-slate-200 rounded-lg transition-colors text-[11px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
//                     >
//                       Replace Image
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {/* Empty Dropzone */}
//             {!localPreviewUrl && !proofOfWorkUrl && (
//               <button
//                 type="button"
//                 onClick={() => powFileInputRef.current?.click()}
//                 className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/30 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 group"
//               >
//                 <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform mb-1">
//                   <UploadCloud size={24} className="text-indigo-500" />
//                 </div>
//                 <span className="text-sm font-bold text-slate-700 text-center px-4">
//                   Click to Browse or Paste Screenshot
//                   <span className="block text-xs font-medium text-slate-400 mt-1">
//                     (Ctrl+V / Cmd+V anywhere in this area)
//                   </span>
//                 </span>
//                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
//                   Max 25MB • JPG, PNG, WEBP
//                 </span>
//               </button>
//             )}
//           </div>

//           <div className="space-y-4 pt-2 border-t border-slate-100">
//             <div className="flex flex-col space-y-1.5">
//               <label
//                 htmlFor="status-select"
//                 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider"
//               >
//                 Update Status
//               </label>
//               <select
//                 id="status-select"
//                 value={statusUpdate}
//                 onChange={(e) => setStatusUpdate(e.target.value)}
//                 className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
//               >
//                 <option value="OPEN">Open</option>
//                 {ticket.status !== "IN_PROGRESS" && (
//                   <option value="IN_PROGRESS">In Progress</option>
//                 )}
//                 <option value="RESOLVED">Resolved</option>
//               </select>
//             </div>

//             <div className="flex flex-col space-y-1.5">
//               <label
//                 htmlFor="resolution-notes"
//                 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider"
//               >
//                 Resolution Notes{" "}
//                 {statusUpdate === "RESOLVED" && (
//                   <span className="text-red-500 ml-0.5">*</span>
//                 )}
//               </label>
//               <textarea
//                 id="resolution-notes"
//                 value={resolutionNotes}
//                 onChange={(e) => setResolutionNotes(e.target.value)}
//                 placeholder="Detail the steps taken to resolve this ticket..."
//                 className="min-h-[100px] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm resize-y hover:border-slate-300 transition-colors placeholder:text-slate-400"
//               />
//             </div>
//           </div>

//           <Button
//             type="submit"
//             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2.5 shadow-sm text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             disabled={isUpdating}
//           >
//             {isUpdating ? (
//               <>
//                 <RefreshCw size={16} className="animate-spin opacity-70" />
//                 Processing Update...
//               </>
//             ) : (
//               "Update Ticket Status"
//             )}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../../../services/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../common/Card";
import { Button } from "../../common/Button";
import {
  ShieldCheck,
  Image as ImageIcon,
  RefreshCw,
  ServerCrash,
  UploadCloud,
  ExternalLink,
  Lock,
} from "lucide-react";

const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_").toLowerCase();
};

// UI Helper for dynamic status coloring
const getStatusStyles = (status) => {
  const styles = {
    OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-300",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return styles[status] || styles.CLOSED;
};

export default function ResolutionCard({ ticket, user, onUpdateSuccess }) {
  // 🟢 STRICT SECURITY: Determine if the current user is the exact assignee
  const currentUserId = String(user?.id || user?.userId);
  const isAssignee =
    ticket?.assignee_id && String(ticket.assignee_id) === currentUserId;
  const isReadOnly = !isAssignee;

  // Initialize status to prevent re-selecting IN_PROGRESS if it's already IN_PROGRESS
  const [statusUpdate, setStatusUpdate] = useState(() => {
    if (ticket.status === "IN_PROGRESS") return "RESOLVED";
    return ticket.status || "OPEN";
  });

  const [resolutionNotes, setResolutionNotes] = useState(
    ticket.resolution_notes || "",
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Database URL state
  const [proofOfWorkUrl, setProofOfWorkUrl] = useState(
    ticket.proof_of_work_url || "",
  );

  // Local Queue State (Holds file before user clicks Update)
  const [selectedPowFile, setSelectedPowFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  const [powUploadState, setPowUploadState] = useState({
    status: "idle", // idle | uploading | error
    progress: 0,
    errorMsg: null,
  });

  const powFileInputRef = useRef(null);

  // Sync state if ticket data updates via parent refresh/reload
  useEffect(() => {
    if (ticket && !isReadOnly) {
      if (ticket.proof_of_work_url) setProofOfWorkUrl(ticket.proof_of_work_url);
      if (ticket.resolution_notes) setResolutionNotes(ticket.resolution_notes);
      if (ticket.status !== "IN_PROGRESS") {
        setStatusUpdate(ticket.status);
      }
    }
  }, [ticket, isReadOnly]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  // STRICT FORMATTING: Only allow images
  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error(
        "Invalid format: Only image files are permitted for Proof of Work.",
      );
    }

    const MAX_SIZE_MB = import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 25;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return toast.error(
        `File exceeds maximum allowed size of ${MAX_SIZE_MB}MB.`,
      );
    }

    setSelectedPowFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setPowUploadState({ status: "idle", progress: 0, errorMsg: null });
  };

  // PASTE HANDLER: Scans clipboard strictly for image formats
  const handlePowPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  // Used internally post-upload
  const clearSelection = () => {
    setSelectedPowFile(null);
    setLocalPreviewUrl(null);
    if (powFileInputRef.current) powFileInputRef.current.value = "";
  };

  // Main Submit Handler
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusUpdate) return toast.error("Please select a status");

    const isResolved = statusUpdate === "RESOLVED";

    if (isResolved) {
      // 10-Minute Minimum Review Constraint
      if (ticket.created_at) {
        let safeDateStr = ticket.created_at;
        if (typeof safeDateStr === "string") {
          if (!safeDateStr.includes("T"))
            safeDateStr = safeDateStr.replace(" ", "T");
          if (
            !safeDateStr.endsWith("Z") &&
            !safeDateStr.match(/[+-]\d{2}:\d{2}$/)
          ) {
            safeDateStr += "Z";
          }
        }

        const createdAtMs = new Date(safeDateStr).getTime();
        const nowMs = Date.now();
        const diffInMinutes = Math.floor((nowMs - createdAtMs) / (1000 * 60));

        if (diffInMinutes < 10) {
          const remainingMins = 10 - diffInMinutes;
          return toast.error(
            `Quality Control: Tickets cannot be resolved within 10 minutes of creation. Please review the issue thoroughly. (${remainingMins} min${remainingMins > 1 ? "s" : ""} remaining)`,
            { duration: 5000 },
          );
        }
      }

      // STRICT VALIDATION: Require BOTH proof and notes if resolving
      if (!proofOfWorkUrl && !selectedPowFile) {
        return toast.error(
          "Ticket CANNOT be resolved without a Proof of Work screenshot.",
        );
      }
      if (!resolutionNotes || resolutionNotes.trim() === "") {
        return toast.error(
          "Ticket CANNOT be resolved without Resolution Notes.",
        );
      }
    }

    try {
      setIsUpdating(true);
      let finalS3Url = proofOfWorkUrl;

      // 1. Upload to S3 ONLY if a new file is queued
      if (selectedPowFile) {
        setPowUploadState({ status: "uploading", progress: 0, errorMsg: null });
        const safeFileName = sanitizeFileName(selectedPowFile.name);

        const presignedRes = await api.post("/upload/presigned-url", {
          fileName: safeFileName,
          fileType: selectedPowFile.type,
        });

        const { uploadUrl, fileUrl } = presignedRes.data.data;

        await axios.put(uploadUrl, selectedPowFile, {
          headers: { "Content-Type": selectedPowFile.type },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setPowUploadState({
                status: "uploading",
                progress: percentCompleted,
                errorMsg: null,
              });
            }
          },
        });

        finalS3Url = fileUrl;
        setProofOfWorkUrl(fileUrl);
      }

      // 2. Only send URL if resolved
      // 2. Send the URL regardless of the status so agents can save their progress
      const payloadUrl = finalS3Url;
      // 3. Save to Database
      await api.put(`/tickets/${ticket.id}/status`, {
        status: statusUpdate,
        resolutionNotes: resolutionNotes,
        proofOfWorkUrl: payloadUrl,
      });

      toast.success("Ticket status updated successfully!");
      clearSelection();
      setPowUploadState({ status: "idle", progress: 0, errorMsg: null });
      onUpdateSuccess();
    } catch (error) {
      const errMsg =
        error.response?.data?.message || "Failed to process update.";
      setPowUploadState({ status: "error", progress: 0, errorMsg: errMsg });
      toast.error(errMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  // ----------------------------------------------------------------------
  // READ-ONLY VIEW (For Admins, Managers, and Non-Assigned Agents)
  // ----------------------------------------------------------------------
  if (isReadOnly) {
    return (
      <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md transition-all">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 pt-4 px-5">
          <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-slate-400" /> Resolution
              Details
            </span>
            {/* 🟢 NEW: Visual indicator explaining why it's locked */}
            <span className="flex items-center gap-1 text-[9px] bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full">
              <Lock size={10} /> View Only
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Current Status
            </label>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset uppercase tracking-wider shadow-sm ${getStatusStyles(
                ticket.status || "OPEN",
              )}`}
            >
              {ticket.status ? ticket.status.replace("_", " ") : "OPEN"}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Proof of Work
            </label>
            {ticket.proof_of_work_url ? (
              <a
                href={ticket.proof_of_work_url}
                target="_blank"
                rel="noreferrer"
                className="group relative block w-fit rounded-xl overflow-hidden shadow-sm border-2 border-slate-200 hover:border-indigo-400 transition-colors"
              >
                <img
                  src={ticket.proof_of_work_url}
                  alt="Proof of Work"
                  className="h-28 w-36 object-cover bg-slate-50 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                  <ExternalLink
                    className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md"
                    size={20}
                  />
                </div>
              </a>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-sm text-slate-400 italic flex items-center justify-center">
                No proof of work uploaded yet.
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Resolution Notes
            </label>
            {ticket.resolution_notes ? (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                {ticket.resolution_notes}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-sm text-slate-400 italic flex items-center justify-center">
                No resolution notes provided yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------------------------
  // INTERACTIVE VIEW (Only for the Assigned Agent)
  // ----------------------------------------------------------------------
  return (
    <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 pt-4 px-5">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
          <ShieldCheck size={16} className="text-indigo-500" /> Resolution &
          Proof
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5">
        <form onSubmit={handleUpdateStatus} className="space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Current Status
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset uppercase tracking-wider shadow-sm ${getStatusStyles(
                ticket.status || "OPEN",
              )}`}
            >
              {ticket.status ? ticket.status.replace("_", " ") : "OPEN"}
            </span>
          </div>

          <div
            className="flex flex-col space-y-2 rounded-xl outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            onPaste={handlePowPaste}
            tabIndex={0}
          >
            <div className="flex items-center justify-between mb-1 pointer-events-none">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={14} className="text-indigo-500" /> Proof of
                Work
              </label>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={powFileInputRef}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {powUploadState.status === "uploading" && (
              <div className="w-full border border-indigo-200 bg-indigo-50 rounded-xl p-4 shadow-sm mb-3 animate-pulse">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-900 mb-2">
                  <span className="flex items-center gap-2">
                    <RefreshCw
                      size={14}
                      className="animate-spin text-indigo-600"
                    />
                    Uploading to Secure Storage...
                  </span>
                  <span>{powUploadState.progress}%</span>
                </div>
                <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${powUploadState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {powUploadState.status === "error" && (
              <div className="w-full border border-red-200 bg-red-50 rounded-xl p-3 flex flex-col gap-2 mb-3">
                <div className="flex items-start gap-2 text-red-700 text-xs font-bold">
                  <ServerCrash size={14} className="shrink-0 mt-0.5" />
                  <span>{powUploadState.errorMsg}</span>
                </div>
              </div>
            )}

            {localPreviewUrl || proofOfWorkUrl ? (
              <div className="space-y-3">
                <div className="relative group rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-4 transition-all hover:shadow-sm">
                  <img
                    src={localPreviewUrl || proofOfWorkUrl}
                    alt="Proof of work preview"
                    className="h-14 w-14 object-cover rounded-lg border border-emerald-200 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      {localPreviewUrl ? "Queued for Upload" : "Secured in DB"}
                    </span>
                    <a
                      href={localPreviewUrl || proofOfWorkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline truncate block"
                    >
                      {selectedPowFile
                        ? selectedPowFile.name
                        : "View Source Image"}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => powFileInputRef.current?.click()}
                      className="px-4 py-2 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 bg-white border border-slate-200 rounded-lg transition-colors text-[11px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      Replace Image
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!localPreviewUrl && !proofOfWorkUrl && (
              <button
                type="button"
                onClick={() => powFileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/30 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform mb-1">
                  <UploadCloud size={24} className="text-indigo-500" />
                </div>
                <span className="text-sm font-bold text-slate-700 text-center px-4">
                  Click to Browse or Paste Screenshot
                  <span className="block text-xs font-medium text-slate-400 mt-1">
                    (Ctrl+V / Cmd+V anywhere in this area)
                  </span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                  Max 25MB • JPG, PNG, WEBP
                </span>
              </button>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="status-select"
                className="text-[11px] font-bold text-slate-600 uppercase tracking-wider"
              >
                Update Status
              </label>
              <select
                id="status-select"
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="OPEN">Open</option>
                {ticket.status !== "IN_PROGRESS" && (
                  <option value="IN_PROGRESS">In Progress</option>
                )}
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="resolution-notes"
                className="text-[11px] font-bold text-slate-600 uppercase tracking-wider"
              >
                Resolution Notes{" "}
                {statusUpdate === "RESOLVED" && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the steps taken to resolve this ticket..."
                className="min-h-[100px] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm resize-y hover:border-slate-300 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2.5 shadow-sm text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw size={16} className="animate-spin opacity-70" />
                Processing Update...
              </>
            ) : (
              "Update Ticket Status"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
