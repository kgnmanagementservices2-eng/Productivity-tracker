import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={36} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Access Denied
        </h1>
        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
          You do not have the required permissions to view this module. If you
          believe this is a mistake, contact your system administrator.
        </p>

        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white h-12 rounded-xl font-bold transition-all active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
