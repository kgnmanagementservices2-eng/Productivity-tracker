import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Hexagon, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import logo from "../../public/img1.png"; // Update the path

import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(result.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* LEFT FORM PANEL */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="flex items-center  mb-10">
            <img
              src={logo}
              alt="Productivity Tracker"
              className="h-14 w-auto object-contain"
            />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            Log in to your account
          </h2>
          {/* <p className="text-sm font-medium text-slate-500 mb-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors"
            >
              Sign up today
            </Link>
          </p> */}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={cn(
                    "w-full h-12 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
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

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {/* Optional: Forgot password link */}
                <a
                  href="#"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
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
                    "w-full h-12 pl-10 pr-4 rounded-xl border bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all",
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />{" "}
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT GRAPHICAL PANEL (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-900 opacity-90 mix-blend-multiply"></div>

        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[64px] opacity-70"></div>
        <div className="absolute bottom-12 -left-12 w-72 h-72 bg-violet-500 rounded-full mix-blend-screen filter blur-[64px] opacity-70"></div>

        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-16 text-center">
          <div className="max-w-md">
            <div className="h-16 w-16 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <Hexagon size={32} className="text-white" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4">
              Streamline your enterprise ticketing.
            </h3>
            <p className="text-indigo-100 font-medium text-lg leading-relaxed">
              Powerful routing, real-time huddles, and deep analytics designed
              for Fortune 500 support teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
