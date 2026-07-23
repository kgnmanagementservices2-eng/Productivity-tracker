import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "../../hooks/useAuth";

export const DashboardLayout = () => {
  const { user, loading } = useAuth();

  // Show a blank screen or a spinner while the AuthContext checks local storage
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  // Route Protection: If they are not logged in, kick them back to the login page immediately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Sidebar on the left */}
      <Sidebar />

      {/* Main Content Area (offset by the 64-width/256px sidebar) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar />
        
        {/* The specific page content gets injected here */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};