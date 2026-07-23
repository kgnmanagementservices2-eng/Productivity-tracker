/* eslint-disable no-unused-vars */
import { MonitorX, ArrowRight, X } from "lucide-react";
import { useSingleTabEnforcer } from "../hooks/useSingleTabEnforcer"; // Adjust path as needed

export function TabConflictOverlay() {
  const { isDuplicateTab, claimSession } = useSingleTabEnforcer();

  if (!isDuplicateTab) return null;

  const closeCurrentTab = () => {
    window.close();
    // Fallback if the browser blocks window.close() on un-owned tabs
    window.location.href = "about:blank";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Glassmorphism Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" />

      {/* 
        The Popup Card 
        Using a custom cubic-bezier for a premium "spring" effect
      */}
      <style>{`
        @keyframes modal-pop {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-pop {
          animation: modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-modal-pop">
        {/* Top Decorative Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8 text-center flex flex-col items-center">
          {/* Icon Container */}
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-red-100">
            <MonitorX size={32} strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
            Session Active Elsewhere
          </h2>

          <p className="text-[#64748B] text-[15px] leading-relaxed font-medium mb-8">
            To prevent data conflicts, this application can only be active in
            one tab at a time.
          </p>

          <div className="flex flex-col gap-3 w-full">
            {/* Secondary Action: Close Tab */}
            <button
              onClick={closeCurrentTab}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[15px] h-12 rounded-xl transition-all duration-200 active:scale-[0.98] border border-slate-200"
            >
              <X size={18} />
              Close This Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
