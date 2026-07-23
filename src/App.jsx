// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast";

// import { AuthProvider } from "./context/AuthContext";
// import { SocketProvider } from "./context/SocketContext";
// import { DashboardLayout } from "./components/layout/DashboardLayout";
// import HuddleRoom from "./pages/HuddleRoom";

// // Pages
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import AdminSetup from "./pages/AdminSetup";
// import TicketList from "./pages/TicketList";
// import TicketDetail from "./pages/TicketDetail";
// import Workload from "./pages/Workload";
// import ActiveHuddles from "./pages/ActiveHuddles";
// import Register from "./pages/Register";
// import ForgotPassword from "./pages/ForgotPassword";
// import Groups from "./pages/Groups";
// import CategoryManager from "./pages/CategoryManager";

// // 🟢 NEW: Import the Tab Enforcer Hook
// import { useSingleTabEnforcer } from "./hooks/useSingleTabEnforcer";

// function App() {
//   // 🟢 ENFORCER: This will instantly block the UI if they open a second tab
//   useSingleTabEnforcer();

//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <SocketProvider>
//           <Toaster position="top-right" />
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/forgot-password" element={<ForgotPassword />} />

//             <Route path="/" element={<DashboardLayout />}>
//               <Route index element={<Navigate to="/dashboard" replace />} />
//               <Route path="dashboard" element={<Dashboard />} />
//               <Route path="admin" element={<AdminSetup />} />
//               <Route path="groups" element={<Groups />} />
//               <Route path="categories" element={<CategoryManager />} />
//               <Route path="tickets">
//                 <Route index element={<TicketList />} />
//                 <Route path=":id" element={<TicketDetail />} />
//                 <Route path=":id/huddle" element={<HuddleRoom />} />
//               </Route>
//               <Route path="huddles" element={<ActiveHuddles />} />
//               <Route path="workload" element={<Workload />} />
//             </Route>

//             <Route path="*" element={<Navigate to="/login" replace />} />
//           </Routes>
//         </SocketProvider>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

// export default App;
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import HuddleRoom from "./pages/HuddleRoom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminSetup from "./pages/AdminSetup";
import TicketList from "./pages/TicketList";
import TicketDetail from "./pages/TicketDetail";
import Workload from "./pages/Workload";
import ActiveHuddles from "./pages/ActiveHuddles";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Groups from "./pages/Groups";
import CategoryManager from "./pages/CategoryManager";

// 🟢 NEW: Import the Security/UX Overlays
import { TabConflictOverlay } from "./components/TabConflictOverlay";
import { DesktopBlocker } from "./components/DesktopBlocker";

function App() {
  return (
    <>
      {/* 
        🟢 ENFORCERS: These sit completely outside the router tree. 
        They remain invisible unless their specific conditions are met.
      */}
      <DesktopBlocker />
      <TabConflictOverlay />

      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admin" element={<AdminSetup />} />
                <Route path="groups" element={<Groups />} />
                <Route path="categories" element={<CategoryManager />} />
                <Route path="tickets">
                  <Route index element={<TicketList />} />
                  <Route path=":id" element={<TicketDetail />} />
                  <Route path=":id/huddle" element={<HuddleRoom />} />
                </Route>
                <Route path="huddles" element={<ActiveHuddles />} />
                <Route path="workload" element={<Workload />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
