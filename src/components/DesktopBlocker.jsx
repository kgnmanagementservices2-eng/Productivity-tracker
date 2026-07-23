import { useState, useEffect } from "react";
import { Monitor, Smartphone, X } from "lucide-react";

export function DesktopBlocker() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // 1. Check User Agent for mobile/tablet operating systems
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileOS =
        /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(
          userAgent,
        );

      // 2. Check screen width (1024px is the standard threshold for iPads/Tablets)
      const isSmallScreen = window.innerWidth < 1024;

      setIsMobileOrTablet(isMobileOS || isSmallScreen);
    };

    // Check on initial load
    checkDevice();

    // Listen for window resizing (in case a desktop user shrinks their window too much)
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (!isMobileOrTablet) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Top Decorative Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        <div className="p-8 text-center flex flex-col items-center">
          {/* Icon Container */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="h-20 w-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
              <Smartphone size={32} strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
              <Monitor size={18} strokeWidth={2.5} />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
            Desktop Only
          </h2>

          <p className="text-[#64748B] text-[15px] leading-relaxed font-medium mb-2">
            This workspace contains complex routing trees and workload
            dashboards that require a larger screen.
          </p>
          <p className="text-slate-500 text-sm font-semibold mb-8">
            Please access this application using a desktop or laptop computer.
          </p>

          {/* Action Button */}
          <button
            onClick={() => window.history.back()}
            className="group w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-[15px] h-12 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm"
          >
            <X
              size={18}
              className="text-slate-400 group-hover:text-white transition-colors"
            />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
