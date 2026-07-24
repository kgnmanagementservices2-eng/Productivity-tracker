import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Contexts
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Layout & Overlays
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { TabConflictOverlay } from "./components/TabConflictOverlay";
import { DesktopBlocker } from "./components/DesktopBlocker";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NoInternetPage from "./pages/NoInternetPage"; // 🟢 NEW: Import No Internet Page

// Protected Pages
import Dashboard from "./pages/Dashboard";
import TicketList from "./pages/TicketList";
import TicketDetail from "./pages/TicketDetail";
import HuddleRoom from "./pages/HuddleRoom";
import ActiveHuddles from "./pages/ActiveHuddles";
import Groups from "./pages/Groups";
import Workload from "./pages/Workload";
import CategoryManager from "./pages/CategoryManager";
import AdminSetup from "./pages/AdminSetup";

function App() {
  // 🟢 NEW: Track the user's internet connection status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* Global Enforcers - These run regardless of network status */}
      <DesktopBlocker />
      <TabConflictOverlay />

      {/* 🟢 NEW: Conditionally render the app or the No Internet page */}
      {!isOnline ? (
        <NoInternetPage />
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Toaster position="top-right" />

              <Routes>
                {/* ==========================================
                    PUBLIC ROUTES
                    ========================================== */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* ==========================================
                    PROTECTED WORKSPACE (Requires Login)
                    ========================================== */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Redirect base URL to dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* --- Overview Group --- */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          "CEO",
                          "GLOBAL_ADMIN",
                          "MARKET_MANAGER",
                          "EMPLOYEE",
                          "BACK_OFFICE_MANAGER",
                          "BACK_OFFICE_MEMBER",
                        ]}
                      >
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* --- Tickets Group --- */}
                  <Route path="tickets">
                    <Route
                      index
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "EMPLOYEE",
                            "BACK_OFFICE_MANAGER",
                            "BACK_OFFICE_MEMBER",
                            "GLOBAL_ADMIN",
                            "MARKET_MANAGER",
                          ]}
                        >
                          <TicketList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path=":id"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "EMPLOYEE",
                            "BACK_OFFICE_MANAGER",
                            "BACK_OFFICE_MEMBER",
                            "GLOBAL_ADMIN",
                            "MARKET_MANAGER",
                          ]}
                        >
                          <TicketDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path=":id/huddle"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "EMPLOYEE",
                            "BACK_OFFICE_MANAGER",
                            "BACK_OFFICE_MEMBER",
                            "GLOBAL_ADMIN",
                            "MARKET_MANAGER",
                          ]}
                        >
                          <HuddleRoom />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* --- Huddles & Groups --- */}
                  <Route
                    path="huddles"
                    element={
                      <ProtectedRoute allowedRoles={["GLOBAL_ADMIN", "CEO"]}>
                        <ActiveHuddles />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="groups"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          "CEO",
                          "GLOBAL_ADMIN",
                          "MARKET_MANAGER",
                          "EMPLOYEE",
                          "BACK_OFFICE_MANAGER",
                          "BACK_OFFICE_MEMBER",
                        ]}
                      >
                        <Groups />
                      </ProtectedRoute>
                    }
                  />

                  {/* --- Administration Group --- */}
                  <Route
                    path="workload"
                    element={
                      <ProtectedRoute
                        allowedRoles={["BACK_OFFICE_MANAGER", "GLOBAL_ADMIN"]}
                      >
                        <Workload />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="categories"
                    element={
                      <ProtectedRoute
                        allowedRoles={["GLOBAL_ADMIN", "BACK_OFFICE_MANAGER"]}
                      >
                        <CategoryManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute allowedRoles={["CEO", "GLOBAL_ADMIN"]}>
                        <AdminSetup />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ==========================================
                    CATCH-ALL REDIRECT
                    ========================================== */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
