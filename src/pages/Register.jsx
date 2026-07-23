/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Hexagon,
  Building,
  User,
  Mail,
  Lock,
  UploadCloud,
  ArrowRight,
  Loader2,
  Palette,
} from "lucide-react";

import api from "../services/api";
import { cn } from "../utils/cn";

// Validation Rules
const registerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  ceoName: z.string().min(2, "Your name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
});

export default function Register() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      primaryColor: "#4f46e5", // Indigo 600
      secondaryColor: "#ffffff",
    },
  });

  const pColor = watch("primaryColor");
  const sColor = watch("secondaryColor");

  const onSubmit = async (data) => {
    try {
      let logoUrl = null;

      // 1. Upload Logo to AWS S3 First (if provided)
      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        logoUrl = uploadRes.data.data.url;
        setIsUploading(false);
      }

      // 2. Register the Company
      const payload = { ...data, logoUrl };
      const response = await api.post("/auth/register", payload);

      // 3. Save the token and force a reload to populate the AuthContext
      localStorage.setItem("saas_token", response.data.token);
      toast.success("Welcome to SaaS Ticketing!");
      window.location.href = "/dashboard";
    } catch (error) {
      setIsUploading(false);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* LEFT FORM PANEL */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto custom-scrollbar">
        <div className="mx-auto w-full max-w-lg">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-sm">
              <Hexagon size={24} className="text-white fill-white/20" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Ticket Tracker
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            Set up your tenant
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors"
            >
              Sign in here
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
            {/* SECTION 1: WORKSPACE CONFIGURATION */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building size={16} className="text-indigo-500" /> 1. Workspace
                Details
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Company Name
                </label>
                <div className="relative">
                  <Building
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    {...register("companyName")}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
                      errors.companyName
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-200 focus:border-indigo-500",
                    )}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-xs font-semibold text-red-500 mt-1">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* White Label Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette size={12} /> Primary Color
                  </label>
                  <div className="relative flex items-center h-11 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <input
                      type="color"
                      {...register("primaryColor")}
                      className="absolute left-[-10px] top-[-10px] w-20 h-20 cursor-pointer opacity-0"
                    />
                    <div
                      className="w-6 h-6 rounded-md ml-3 shadow-sm border border-slate-200 pointer-events-none"
                      style={{ backgroundColor: pColor }}
                    ></div>
                    <span className="ml-3 text-sm font-mono text-slate-600 font-medium uppercase pointer-events-none">
                      {pColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette size={12} /> Secondary Color
                  </label>
                  <div className="relative flex items-center h-11 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <input
                      type="color"
                      {...register("secondaryColor")}
                      className="absolute left-[-10px] top-[-10px] w-20 h-20 cursor-pointer opacity-0"
                    />
                    <div
                      className="w-6 h-6 rounded-md ml-3 shadow-sm border border-slate-200 pointer-events-none"
                      style={{ backgroundColor: sColor }}
                    ></div>
                    <span className="ml-3 text-sm font-mono text-slate-600 font-medium uppercase pointer-events-none">
                      {sColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom File Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Company Logo{" "}
                  <span className="normal-case text-slate-400 font-medium">
                    (Optional)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center gap-2 h-11 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer shadow-sm group">
                    <UploadCloud
                      size={18}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <span className="text-sm font-medium text-slate-600 truncate max-w-[200px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      {file.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: ADMINISTRATOR PROFILE */}
            <div className="space-y-5 pt-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> 2. Administrator
                Account
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    {...register("ceoName")}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
                      errors.ceoName
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-200 focus:border-indigo-500",
                    )}
                  />
                </div>
                {errors.ceoName && (
                  <p className="text-xs font-semibold text-red-500 mt-1">
                    {errors.ceoName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    placeholder="jane@acme.com"
                    {...register("email")}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
                      errors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-200 focus:border-indigo-500",
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-semibold text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
                      errors.password
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-200 focus:border-indigo-500",
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-semibold text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full h-12 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Uploading
                  Logo...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Provisioning
                  Tenant...
                </>
              ) : (
                <>
                  Launch Workspace{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
            <p className="text-[11px] text-center font-medium text-slate-400 mt-4">
              By creating a workspace, you agree to our Enterprise Terms of
              Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT GRAPHICAL PANEL (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 opacity-95"></div>

        {/* Abstract Background Shapes */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-violet-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>

        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-16 text-center">
          <div className="w-full max-w-lg text-left">
            <blockquote className="text-2xl text-white font-medium leading-relaxed mb-6">
              "Streamlining our multi-tenant communication changed everything.
              Emergency ticket resolutions dropped from hours to minutes."
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-lg">
                {/* Placeholder Avatar */}
                <img
                  src="https://i.pravatar.cc/150?img=32"
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">
                  Sarah Jenkins
                </p>
                <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">
                  VP of Operations, TechCorp
                </p>
              </div>
            </div>

            <div className="mt-16 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building size={16} /> White-Label Architecture
              </p>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Your branding, your rules. Upload your logo and lock in your
                primary colors to create a seamless experience for your
                workforce.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
