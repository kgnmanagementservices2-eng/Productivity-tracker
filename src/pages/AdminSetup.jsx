/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
  X,
  Plus,
  Building2,
  Map,
  Store,
  Filter,
  Power,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../services/api"; // Adjust this import based on your actual api setup
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/common/Card";
import { cn } from "../utils/cn";
import { useAuth } from "../hooks/useAuth";

// --- Validation Schemas ---
const infrastructureSchema = z.object({
  name: z.string().min(2, "Name required"),
});

const storeSchema = z.object({
  // Changed from .uuid() to allow any string 3 characters or longer
  id: z
    .string()
    .min(3, "ID must be at least 3 characters")
    .optional()
    .or(z.literal("")),
  name: z.string().min(2, "Name required"),
  marketId: z.string().min(1, "Market required"),
});

const userSchema = z.object({
  id: z
    .string()
    .min(3, "ID must be at least 3 characters")
    .optional()
    .or(z.literal("")), // 🟢 NEW
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be 6+ chars"),
  role: z.string().min(1, "Role is required"),
  departmentId: z.string().optional(),
  marketId: z.string().optional(),
  storeId: z.string().optional(),
});

// --- 🟢 THE PAGINATION COMPONENT (Handles "Next" and "Previous") ---
// --- Reusable Pagination Component ---
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  // We removed the 'if (totalPages <= 1) return null;' line so it always shows!

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50 rounded-b-xl mt-auto">
      <span className="text-sm text-slate-500 font-medium">
        Page {currentPage} of {totalPages || 1}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="bg-white"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} className="mr-1" /> Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="bg-white"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};
export default function AdminSetup() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personnel");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Constants - How many items to show before making them click "Next"
  const USERS_PER_PAGE = 10;
  const INFRA_PER_PAGE = 5;

  // --- Dropdown States (Unpaginated, used so the form selects have ALL options) ---
  const [allDepartments, setAllDepartments] = useState([]);
  const [allMarkets, setAllMarkets] = useState([]);
  const [allStores, setAllStores] = useState([]);

  // --- 🟢 PAGINATED STATES (Tracks current page & current data chunk) ---
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptPage, setDeptPage] = useState(1);
  const [totalDeptPages, setTotalDeptPages] = useState(1);

  const [markets, setMarkets] = useState([]);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketPage, setMarketPage] = useState(1);
  const [totalMarketPages, setTotalMarketPages] = useState(1);

  const [stores, setStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [storePage, setStorePage] = useState(1);
  const [totalStorePages, setTotalStorePages] = useState(1);

  // Form Initializations
  const {
    register: regDept,
    handleSubmit: submitDept,
    reset: resetDept,
  } = useForm({ resolver: zodResolver(infrastructureSchema) });
  const {
    register: regMkt,
    handleSubmit: submitMkt,
    reset: resetMkt,
  } = useForm({ resolver: zodResolver(infrastructureSchema) });
  const {
    register: regStr,
    handleSubmit: submitStr,
    reset: resetStr,
    formState: { errors: strErrors },
  } = useForm({ resolver: zodResolver(storeSchema) });
  const {
    register: regUser,
    handleSubmit: submitUser,
    watch,
    reset: resetUser,
    setValue: setUserValue, // 🟢 NEW: Extract setValue
    formState: { errors: userErrors },
  } = useForm({ resolver: zodResolver(userSchema) });

  const selectedRole = watch("role");
  const selectedMarketId = watch("marketId");

  useEffect(() => {
    setUserValue("storeId", "");
  }, [selectedMarketId, setUserValue]);
  // ==========================================
  // API CALLS (Triggered when user clicks "Next")
  // ==========================================

  // Gets the full lists for the dropdown menus
  const fetchDropdowns = async () => {
    try {
      const [deptRes, mktRes, strRes] = await Promise.all([
        api.get("/admin/departments?paginate=false"),
        api.get("/admin/markets?paginate=false"),
        api.get("/admin/stores?paginate=false"),
      ]);
      setAllDepartments(deptRes.data?.data || []);
      setAllMarkets(mktRes.data?.data || []);
      setAllStores(strRes.data?.data || []);
    } catch (e) {
      toast.error("Failed to load dropdowns");
    }
  };

  const fetchUsersData = async () => {
    try {
      const res = await api.get(`/admin/users`, {
        params: {
          page: userPage,
          limit: USERS_PER_PAGE,
          search: userSearch,
          role: roleFilter,
        },
      });
      setUsers(res.data?.data || []);
      setTotalUserPages(res.data?.pagination?.totalPages || 1);
    } catch (e) {}
  };

  const fetchDeptsData = async () => {
    try {
      const res = await api.get(`/admin/departments`, {
        params: { page: deptPage, limit: INFRA_PER_PAGE, search: deptSearch },
      });
      setDepartments(res.data?.data || []);
      setTotalDeptPages(res.data?.pagination?.totalPages || 1);
    } catch (e) {}
  };

  const fetchMarketsData = async () => {
    try {
      const res = await api.get(`/admin/markets`, {
        params: {
          page: marketPage,
          limit: INFRA_PER_PAGE,
          search: marketSearch,
        },
      });
      setMarkets(res.data?.data || []);
      setTotalMarketPages(res.data?.pagination?.totalPages || 1);
    } catch (e) {
      /* empty */
    }
  };

  const fetchStoresData = async () => {
    try {
      const res = await api.get(`/admin/stores`, {
        params: { page: storePage, limit: INFRA_PER_PAGE, search: storeSearch },
      });
      setStores(res.data?.data || []);
      setTotalStorePages(res.data?.pagination?.totalPages || 1);
    } catch (e) {}
  };

  // Run on initial page load
  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Run whenever the User Page changes (e.g. clicking "Next")
  useEffect(() => {
    const timer = setTimeout(() => fetchUsersData(), 300);
    return () => clearTimeout(timer);
  }, [userPage, userSearch, roleFilter]);

  // Run whenever the Dept Page changes
  useEffect(() => {
    const timer = setTimeout(() => fetchDeptsData(), 300);
    return () => clearTimeout(timer);
  }, [deptPage, deptSearch]);

  // Run whenever the Market Page changes
  useEffect(() => {
    const timer = setTimeout(() => fetchMarketsData(), 300);
    return () => clearTimeout(timer);
  }, [marketPage, marketSearch]);

  // Run whenever the Store Page changes
  useEffect(() => {
    const timer = setTimeout(() => fetchStoresData(), 300);
    return () => clearTimeout(timer);
  }, [storePage, storeSearch]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreate = async (
    endpoint,
    data,
    resetFn,
    successMsg,
    refreshFn,
  ) => {
    try {
      if (data.id === "") delete data.id; // Clean up optional UUID
      await api.post(`/admin/${endpoint}`, data);
      toast.success(successMsg);
      resetFn();
      refreshFn(); // Refresh the current paginated list
      fetchDropdowns(); // Refresh the full dropdown lists
    } catch (e) {
      toast.error(e.response?.data?.message || `Error creating ${endpoint}`);
    }
  };

  const handleProvisionUser = async (data) => {
    try {
      const payload = {
        ...data,
        departmentId: data.departmentId || null,
        marketId: data.marketId || null,
        storeId: data.storeId || null,
      };
      await api.post("/admin/users", payload);
      toast.success(`${data.name} provisioned successfully!`);
      setIsModalOpen(false);
      resetUser();
      fetchUsersData(); // Get fresh page 1
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to provision user");
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/admin/users/${userId}/status`, { is_active: newStatus });
      toast.success(
        `User account has been ${newStatus ? "activated" : "deactivated"}.`,
      );
      fetchUsersData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  // Resets to Page 1 if you start typing a new search
  const onSearchChange = (setter, pageSetter) => (e) => {
    setter(e.target.value);
    pageSetter(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Master Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Setup</h1>
          <p className="text-slate-500">
            Manage your global workforce and routing locations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("personnel")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all",
              activeTab === "personnel"
                ? "bg-white shadow-sm text-[var(--tenant-primary)]"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Personnel
          </button>
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all",
              activeTab === "infrastructure"
                ? "bg-white shadow-sm text-[var(--tenant-primary)]"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Infrastructure
          </button>
        </div>
      </div>

      {/* =========================================
          TAB 1: PERSONNEL DATA GRID
          ========================================= */}
      {activeTab === "personnel" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border-b border-slate-100 rounded-t-xl pb-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search personnel..."
                  value={userSearch}
                  onChange={onSearchChange(setUserSearch, setUserPage)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)] w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5">
                <Filter size={16} className="text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-transparent text-sm font-medium focus:outline-none text-slate-700"
                >
                  <option value="ALL">All Roles</option>
                  <option value="EMPLOYEE">Store Employees</option>
                  <option value="BACK_OFFICE_MEMBER">Back Office Team</option>
                  <option value="BACK_OFFICE_MANAGER">Managers</option>
                  <option value="MARKET_MANAGER">Market Managers</option>
                </select>
              </div>
            </div>

            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} className="mr-2" /> Provision User
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Active Workload</th>
                    <th className="px-6 py-4 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12 text-slate-500"
                      >
                        No personnel found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isMe =
                        String(user.id) ===
                        String(currentUser?.id || currentUser?.userId);
                      const isActive = user.is_active !== false;

                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${!isActive ? "bg-slate-50" : "hover:bg-slate-50"}`}
                        >
                          <td className="px-6 py-4">
                            <div
                              className={cn(
                                "font-semibold",
                                !isActive ? "text-slate-500" : "text-slate-900",
                              )}
                            >
                              {user.name} {isMe && "(You)"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                isActive
                                  ? "bg-indigo-50 text-indigo-700 ring-indigo-700/10"
                                  : "bg-slate-100 text-slate-500 ring-slate-500/10",
                              )}
                            >
                              {user.role.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={cn(
                                "font-medium",
                                !isActive ? "text-slate-500" : "text-slate-900",
                              )}
                            >
                              {user.market_name || "Global / Unassigned"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.store_name || ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.role.includes("BACK_OFFICE") ? (
                              <span
                                className={cn(
                                  "font-bold text-lg",
                                  user.active_ticket_count > 5
                                    ? "text-red-500"
                                    : !isActive
                                      ? "text-slate-400"
                                      : "text-emerald-600",
                                )}
                              >
                                {user.active_ticket_count || 0}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isMe && (
                              <button
                                onClick={() =>
                                  handleToggleUserStatus(user.id, isActive)
                                }
                                className={cn(
                                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all shadow-sm",
                                  isActive
                                    ? "text-red-600 bg-white border border-red-200 hover:bg-red-50"
                                    : "text-white bg-emerald-600 hover:bg-emerald-700",
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <Power size={14} /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={14} /> Activate
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 🟢 THIS PLACES THE NEXT/PREV BUTTONS AT THE BOTTOM OF THE TABLE */}
            <PaginationControls
              currentPage={userPage}
              totalPages={totalUserPages}
              onPageChange={setUserPage}
            />
          </CardContent>
        </Card>
      )}

      {/* =========================================
          TAB 2: INFRASTRUCTURE BUILDER
          ========================================= */}
      {activeTab === "infrastructure" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DEPARTMENTS */}
          <Card className="h-[36rem] flex flex-col">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2">
                  <Building2 size={18} /> Departments
                </span>
              </CardTitle>
              <div className="relative mt-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={deptSearch}
                  onChange={onSearchChange(setDeptSearch, setDeptPage)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {departments.length === 0 && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  No departments found.
                </p>
              )}
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-3 rounded border border-slate-200 text-sm font-medium"
                >
                  {d.name}
                </div>
              ))}
            </CardContent>
            {/* 🟢 NEXT/PREV BUTTONS FOR DEPARTMENTS */}
            <PaginationControls
              currentPage={deptPage}
              totalPages={totalDeptPages}
              onPageChange={setDeptPage}
            />
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
              <form
                onSubmit={submitDept((d) =>
                  handleCreate(
                    "departments",
                    d,
                    resetDept,
                    "Department added",
                    fetchDeptsData,
                  ),
                )}
                className="flex gap-2"
              >
                <Input
                  placeholder="New Dept Name..."
                  {...regDept("name")}
                  className="h-9"
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            </div>
          </Card>

          {/* MARKETS */}
          <Card className="h-[36rem] flex flex-col">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2">
                  <Map size={18} /> Markets
                </span>
              </CardTitle>
              <div className="relative mt-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={marketSearch}
                  onChange={onSearchChange(setMarketSearch, setMarketPage)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {markets.length === 0 && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  No markets found.
                </p>
              )}
              {markets.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-3 rounded border border-slate-200 text-sm font-medium"
                >
                  {m.name}
                </div>
              ))}
            </CardContent>
            {/* 🟢 NEXT/PREV BUTTONS FOR MARKETS */}
            <PaginationControls
              currentPage={marketPage}
              totalPages={totalMarketPages}
              onPageChange={setMarketPage}
            />
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
              <form
                onSubmit={submitMkt((d) =>
                  handleCreate(
                    "markets",
                    d,
                    resetMkt,
                    "Market added",
                    fetchMarketsData,
                  ),
                )}
                className="flex gap-2"
              >
                <Input
                  placeholder="New Market..."
                  {...regMkt("name")}
                  className="h-9"
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            </div>
          </Card>

          {/* STORES */}
          <Card className="h-[36rem] flex flex-col">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2">
                  <Store size={18} /> Stores
                </span>
              </CardTitle>
              <div className="relative mt-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={storeSearch}
                  onChange={onSearchChange(setStoreSearch, setStorePage)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {stores.length === 0 && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  No stores found.
                </p>
              )}
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="bg-white p-3 rounded border border-slate-200 text-sm flex flex-col gap-1"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {s.id}
                  </span>
                </div>
              ))}
            </CardContent>
            {/* 🟢 NEXT/PREV BUTTONS FOR STORES */}
            <PaginationControls
              currentPage={storePage}
              totalPages={totalStorePages}
              onPageChange={setStorePage}
            />
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl mt-auto">
              <form
                onSubmit={submitStr((d) =>
                  handleCreate(
                    "stores",
                    d,
                    resetStr,
                    "Store added",
                    fetchStoresData,
                  ),
                )}
                className="space-y-2"
              >
                <Input
                  placeholder="Custom Store UUID (Optional)"
                  {...regStr("id")}
                  className="h-9 text-xs"
                  error={strErrors.id?.message}
                />
                <select
                  {...regStr("marketId")}
                  className="w-full text-sm border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[var(--tenant-primary)]"
                >
                  <option value="">Select Market...</option>
                  {allMarkets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Input
                    placeholder="New Store Name..."
                    {...regStr("name")}
                    className="h-9 w-full"
                    error={strErrors.name?.message}
                  />
                  <Button type="submit" size="sm" className="h-9">
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================
          MODAL: USER PROVISIONING
          ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <CardHeader>
              <CardTitle>Provision New User</CardTitle>
              <p className="text-sm text-slate-500">
                Add personnel and map them to their routing locations.
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={submitUser(handleProvisionUser)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Custom ID (Optional)"
                    {...regUser("id")}
                    error={userErrors.id?.message}
                    placeholder="e.g. EMP-123"
                  />
                  <Input
                    label="Full Name"
                    {...regUser("name")}
                    error={userErrors.name?.message}
                  />
                  <Input
                    label="Email"
                    type="email"
                    {...regUser("email")}
                    error={userErrors.email?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Temp Password"
                    type="password"
                    {...regUser("password")}
                    error={userErrors.password?.message}
                  />

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Access Role
                    </label>
                    <select
                      {...regUser("role")}
                      className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-[var(--tenant-primary)]"
                    >
                      <option value="">Select Role...</option>
                      <option value="GLOBAL_ADMIN">Global Admin</option>
                      <option value="BACK_OFFICE_MANAGER">
                        Back Office Manager
                      </option>
                      <option value="BACK_OFFICE_MEMBER">
                        Back Office Member
                      </option>
                      <option value="MARKET_MANAGER">Market Manager</option>
                      <option value="EMPLOYEE">Store Employee</option>
                    </select>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3 mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Map size={14} /> Required Routing Assignments
                  </p>

                  {(selectedRole === "BACK_OFFICE_MANAGER" ||
                    selectedRole === "BACK_OFFICE_MEMBER") && (
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">
                        Assign Department
                      </label>
                      <select
                        {...regUser("departmentId")}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                      >
                        <option value="">Select a Department...</option>
                        {/* Uses unpaginated list so no options are hidden */}
                        {allDepartments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedRole === "MARKET_MANAGER" && (
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">
                        Assign Market
                      </label>
                      <select
                        {...regUser("marketId")}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                      >
                        <option value="">Select a Market...</option>
                        {allMarkets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedRole === "EMPLOYEE" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium">
                          Assign Market
                        </label>
                        <select
                          {...regUser("marketId")}
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                        >
                          <option value="">Select a Market...</option>
                          {allMarkets.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium">
                          Assign Store
                        </label>
                        <select
                          {...regUser("storeId")}
                          disabled={!selectedMarketId} // 🟢 Disable if no market is chosen
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {/* Dynamic Placeholder */}
                          <option value="">
                            {!selectedMarketId
                              ? "Select a Market first..."
                              : "Select a Store..."}
                          </option>

                          {/* 🟢 Filter stores to only match the selected market */}
                          {allStores
                            .filter(
                              (s) =>
                                String(s.market_id || s.marketId) ===
                                String(selectedMarketId),
                            )
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {(!selectedRole || selectedRole === "GLOBAL_ADMIN") && (
                    <p className="text-sm text-slate-500 italic">
                      No specific location assignments required for this role.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Deploy User</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
