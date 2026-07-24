import { Navigate, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. LOADING STATE
  // While AuthContext is checking local storage / validating token
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 tracking-wide">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATION CHECK
  // If there is no user, redirect to login page.
  // We pass the intended location in 'state' so we can send them back there after they log in.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. AUTHORIZATION (ROLE) CHECK
  // If this route requires specific roles, check if the user has one of them.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 4. ACCESS GRANTED
  return children;
}
