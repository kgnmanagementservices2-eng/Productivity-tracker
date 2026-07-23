// import { NavLink } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth";
// import { cn } from "../../utils/cn";
// import {
//   LayoutDashboard,
//   Ticket,
//   Settings,
//   Users,
//   PhoneCall,
//   MessageSquare,
//   FolderTree,
// } from "lucide-react";

// export const Sidebar = () => {
//   const { user } = useAuth();

//   // The Master Navigation Configuration
//   const navItems = [
//     {
//       name: "Dashboard",
//       path: "/dashboard",
//       icon: LayoutDashboard,
//       allowedRoles: [
//         "CEO",
//         "GLOBAL_ADMIN",
//         "MARKET_MANAGER",
//         "EMPLOYEE",
//         "BACK_OFFICE_MANAGER",
//         "BACK_OFFICE_MEMBER",
//       ],
//     },
//     {
//       name: "My Tickets",
//       path: "/tickets",
//       icon: Ticket,
//       allowedRoles: [
//         "EMPLOYEE",
//         "BACK_OFFICE_MANAGER",
//         "BACK_OFFICE_MEMBER",
//         "GLOBAL_ADMIN",
//         "MARKET_MANAGER",
//       ],
//     },
//     {
//       name: "Active Huddles",
//       path: "/huddles",
//       icon: PhoneCall,
//       allowedRoles: ["BACK_OFFICE_MANAGER", "BACK_OFFICE_MEMBER"],
//     },
//     {
//       name: "Team Groups",
//       path: "/groups",
//       icon: MessageSquare,
//       allowedRoles: [
//         "CEO",
//         "GLOBAL_ADMIN",
//         "MARKET_MANAGER",
//         "EMPLOYEE",
//         "BACK_OFFICE_MANAGER",
//         "BACK_OFFICE_MEMBER",
//       ],
//     },
//     {
//       name: "Team Workload",
//       path: "/workload",
//       icon: Users,
//       allowedRoles: ["BACK_OFFICE_MANAGER", "GLOBAL_ADMIN"],
//     },
//     {
//       name: "Category Routing",
//       path: "/categories", // Make sure this matches your Route path in App.jsx!
//       icon: FolderTree,
//       allowedRoles: ["GLOBAL_ADMIN", "BACK_OFFICE_MANAGER"],
//     },
//     {
//       name: "Company Setup",
//       path: "/admin",
//       icon: Settings,
//       allowedRoles: ["CEO", "GLOBAL_ADMIN"],
//     },
//   ];

//   // Filter links based on the user's secure JWT role
//   const visibleLinks = navItems.filter((item) =>
//     item.allowedRoles.includes(user?.role),
//   );

//   return (
//     <aside className="w-64 text-slate-300 flex flex-col h-screen fixed left-0 top-0 bg-[var(--tenant-primary,#0f172a)]">
//       {/* Brand Logo Area */}
//       <div className="h-16 flex items-center px-6 border-b border-black/20 bg-black/20">
//         <span className="text-white font-bold text-lg tracking-wide">
//           Ticket Tracker
//         </span>
//       </div>

//       {/* Navigation Links */}
//       <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
//         {visibleLinks.map((link) => {
//           const Icon = link.icon;
//           return (
//             <NavLink
//               key={link.name}
//               to={link.path}
//               className={({ isActive }) =>
//                 cn(
//                   "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm",
//                   isActive
//                     ? "bg-white text-[var(--tenant-primary,#0f172a)] shadow-sm" // Inverted for active state!
//                     : "hover:bg-white/10 hover:text-white text-white/70",
//                 )
//               }
//             >
//               <Icon size={18} />
//               {link.name}
//             </NavLink>
//           );
//         })}
//       </nav>
//     </aside>
//   );
// };
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";
import {
  LayoutDashboard,
  Ticket,
  Settings,
  Users,
  PhoneCall,
  MessageSquare,
  FolderTree,
  LogOut,
  Hexagon, // Using as a placeholder for a modern brand logo
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth(); // Assuming your useAuth hook has a logout method

  // The Master Navigation Configuration - Added 'group' property for visual hierarchy
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      group: "Overview",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
    {
      name: "My Tickets",
      path: "/tickets",
      icon: Ticket,
      group: "Overview",
      allowedRoles: [
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
      ],
    },
    {
      name: "Active Huddles",
      path: "/huddles",
      icon: PhoneCall,
      group: "Overview",
      allowedRoles: [
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
        "GLOBAL_ADMIN",
        "CEO",
      ],
    },
    {
      name: "Team Groups",
      path: "/groups",
      icon: MessageSquare,
      group: "Overview",
      allowedRoles: [
        "CEO",
        "GLOBAL_ADMIN",
        "MARKET_MANAGER",
        "EMPLOYEE",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ],
    },
    {
      name: "Team Workload",
      path: "/workload",
      icon: Users,
      group: "Administration",
      allowedRoles: ["BACK_OFFICE_MANAGER", "GLOBAL_ADMIN"],
    },
    {
      name: "Category Routing",
      path: "/categories",
      icon: FolderTree,
      group: "Administration",
      allowedRoles: ["GLOBAL_ADMIN", "BACK_OFFICE_MANAGER"],
    },
    {
      name: "Company Setup",
      path: "/admin",
      icon: Settings,
      group: "Administration",
      allowedRoles: ["CEO", "GLOBAL_ADMIN"],
    },
  ];

  // Filter links based on the user's secure JWT role
  const visibleLinks = navItems.filter((item) =>
    item.allowedRoles.includes(user?.role),
  );

  // Group the filtered links for rendering
  const groupedLinks = visibleLinks.reduce((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 bg-[var(--tenant-primary,#020617)] border-r border-white/10 z-50">
      {/* Brand Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm">
            <Hexagon size={18} className="text-white fill-white/20" />
          </div>
          <span className="font-bold text-[15px] tracking-wide">
            Productivity Tracker
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
        {Object.entries(groupedLinks).map(([groupName, links]) => (
          <div key={groupName} className="space-y-1.5">
            {/* Group Header */}
            <h4 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              {groupName}
            </h4>

            {/* Group Links */}
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Premium Active Indicator (Linear/Vercel Style) */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}

                      <Icon
                        size={18}
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-indigo-400"
                            : "text-slate-500 group-hover:text-slate-300",
                        )}
                      />
                      {link.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-200 group">
          {/* Avatar Initials */}
          <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
            {(user?.name || "U")[0].toUpperCase()}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold text-slate-200 truncate">
              {user?.name || "System User"}
            </span>
            <span className="text-[10px] font-medium text-slate-500 truncate uppercase tracking-wider">
              {user?.role?.replace(/_/g, " ") || "UNASSIGNED"}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
