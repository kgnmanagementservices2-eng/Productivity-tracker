/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { X, Loader2, Store, Users, Calendar, AlertCircle } from "lucide-react";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";
import { useAuth } from "../../hooks/useAuth";
import { useOnlineUsers } from "../../context/SocketContext";

const ticketSchema = z
  .object({
    departmentId: z.string().min(1, "Please select a department"),
    assigneeId: z.string().optional(),
    tat: z.string().optional(),
    categoryLevel1: z.string().min(1, "Main category is required"),
    categoryLevel2: z.string().min(1, "Sub-category is required"),
    priority: z.enum(["STANDARD", "IMPORTANT", "EMERGENCY"]),
    userComments: z
      .string()
      .min(10, "Please provide at least 10 characters of description"),
    storeId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tat && data.tat.trim() !== "") {
        const selectedDate = new Date(data.tat).getTime();
        const currentDate = new Date().getTime();
        return selectedDate > currentDate;
      }
      return true;
    },
    {
      message: "Turnaround Time (TAT) must be in the future",
      path: ["tat"],
    },
  );

export const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, loading } = useAuth();
  const onlineUsers = useOnlineUsers() || {};

  const [departments, setDepartments] = useState([]);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [stores, setStores] = useState([]);

  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: "STANDARD",
      storeId: user?.store_id || "",
    },
  });

  const selectedDeptId = watch("departmentId") ?? "";
  const selectedCategoryName = watch("categoryLevel1");

  const canAssignTask = useMemo(
    () =>
      [
        "GLOBAL_ADMIN",
        "CEO",
        "BACK_OFFICE_MANAGER",
        "BACK_OFFICE_MEMBER",
      ].includes(user?.role),
    [user?.role],
  );

  const userDeptId = user
    ? String(user.department_id || user.departmentId || "")
    : "";

  const currentUserId = user ? String(user.id || user.userId) : "";

  const isBackOfficeStaff = useMemo(
    () => ["BACK_OFFICE_MANAGER", "BACK_OFFICE_MEMBER"].includes(user?.role),
    [user?.role],
  );

  const canAssignStore = useMemo(
    () => ["MARKET_MANAGER", "EMPLOYEE"].includes(user?.role),
    [user?.role],
  );

  useEffect(() => {
    if (!isOpen) return;

    // 🟢 INSTANT AUTO-ASSIGN: If Back Office Member, assign to self immediately on open
    reset({
      priority: "STANDARD",
      storeId: user?.store_id || "",
      departmentId: isBackOfficeStaff ? userDeptId : "",
      categoryLevel1: "",
      categoryLevel2: "",
      assigneeId: user?.role === "BACK_OFFICE_MEMBER" ? currentUserId : "",
      tat: "",
      userComments: "",
    });
  }, [isOpen, user, reset, isBackOfficeStaff, userDeptId, currentUserId]);

  const loadDropdowns = async () => {
    try {
      const deptPromise = api.get("/tickets/departments");
      const storePromise =
        canAssignStore && user
          ? api.get("/tickets/stores")
          : Promise.resolve({ data: { data: [] } });

      const [deptRes, storeRes] = await Promise.all([
        deptPromise,
        storePromise,
      ]);

      const fetchedDepts = deptRes.data.data || [];
      setDepartments(fetchedDepts);

      if (isBackOfficeStaff && userDeptId) {
        const exists = fetchedDepts.find((d) => String(d.id) === userDeptId);
        if (exists) {
          setValue("departmentId", userDeptId, {
            shouldValidate: true,
          });
        }
      }

      if (canAssignStore && user) {
        const allStores = storeRes.data.data || [];
        const userMarketId = String(user.market_id || user.marketId);

        const displayStores = canAssignTask
          ? allStores
          : allStores.filter(
              (s) => String(s.market_id || s.marketId) === userMarketId,
            );

        setStores(displayStores);
      }
    } catch (error) {
      toast.error("Failed to load ticket dropdowns");
    }
  };

  useEffect(() => {
    if (!isOpen || loading || !user) return;
    loadDropdowns();
  }, [
    isOpen,
    loading,
    user,
    userDeptId,
    isBackOfficeStaff,
    canAssignStore,
    canAssignTask,
    setValue,
  ]);

  useEffect(() => {
    if (!user) return;
    if (departments.length > 0) return;
    loadDropdowns();
  }, [
    user,
    departments.length,
    canAssignStore,
    canAssignTask,
    isBackOfficeStaff,
    userDeptId,
    setValue,
  ]);

  useEffect(() => {
    if (!user) return;

    if (!selectedDeptId) {
      setCategories([]);
      setDepartmentMembers([]);
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
      // Only clear assignee if they are NOT a Back Office Member
      if (user?.role !== "BACK_OFFICE_MEMBER") {
        setValue("assigneeId", "");
      }
      return;
    }

    const fetchDepartmentDetails = async () => {
      const selectedDept = departments.find(
        (d) => String(d.id) === String(selectedDeptId),
      );
      if (!selectedDept) return;

      setIsFetchingCategories(true);
      try {
        const catRes = await api.get(`/categories/${selectedDept.name}`);
        setCategories(catRes.data.data);
      } catch (error) {
        toast.error("Failed to load categories");
      } finally {
        setIsFetchingCategories(false);
      }

      if (canAssignTask) {
        setIsFetchingMembers(true);
        try {
          const userRes = await api.get(`/groups/users`);

          let members = (userRes.data.data || []).filter((u) => {
            const matchById =
              String(u.department_id || u.departmentId) ===
              String(selectedDeptId);
            const matchByName =
              String(u.department_name || u.departmentName || u.department) ===
              String(selectedDept.name);

            const isBackOffice =
              u.role === "BACK_OFFICE_MEMBER" ||
              u.role === "BACK_OFFICE_MANAGER";

            return (matchById || matchByName) && isBackOffice;
          });

          // 🟢 LIST INJECTION: Guarantee the user is in the list if they are a BACK_OFFICE_MEMBER
          if (user?.role === "BACK_OFFICE_MEMBER") {
            if (!members.some((m) => String(m.id) === currentUserId)) {
              members.unshift({
                id: currentUserId,
                name: user.name || "My Account",
                role: user.role,
              });
            }
            setValue("assigneeId", currentUserId, { shouldValidate: true });
          }

          setDepartmentMembers(members);
        } catch (error) {
          console.error("Failed to fetch department members");
        } finally {
          setIsFetchingMembers(false);
        }
      }
    };

    fetchDepartmentDetails();

    if (String(selectedDeptId) !== String(userDeptId)) {
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
      if (user?.role !== "BACK_OFFICE_MEMBER") {
        setValue("assigneeId", "");
      }
    }
  }, [
    selectedDeptId,
    departments,
    setValue,
    canAssignTask,
    user,
    currentUserId,
  ]);

  useEffect(() => {
    if (!selectedCategoryName) {
      setAvailableSubcategories([]);
      setValue("categoryLevel2", "");
      return;
    }
    const activeCategory = categories.find(
      (c) => c.name === selectedCategoryName,
    );
    setAvailableSubcategories(
      activeCategory ? activeCategory.subcategories : [],
    );
    setValue("categoryLevel2", "");
  }, [selectedCategoryName, categories, setValue]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setFile(null);
    setCategories([]);
    setAvailableSubcategories([]);
    setDepartmentMembers([]);
    onClose();
  };

  const onSubmit = async (data) => {
    let hasError = false;

    if (canAssignStore && (!data.storeId || data.storeId.trim() === "")) {
      setError("storeId", { message: "Store selection is required" });
      hasError = true;
    }

    if (canAssignTask) {
      if (!data.tat || data.tat.trim() === "") {
        setError("tat", { message: "Turnaround Time (TAT) is required" });
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      let attachmentUrls = [];

      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        attachmentUrls.push(uploadRes.data.data?.url || uploadRes.data.url);
        setIsUploading(false);
      }

      const generatedEmailBody = `
        TICKET SUBMISSION:
        Category: ${data.categoryLevel1} > ${data.categoryLevel2}
        Priority: ${data.priority}
        Comments: ${data.userComments}
      `;

      const selectedStoreObj = stores.find((s) => s.id === data.storeId);
      const targetMarketId = selectedStoreObj
        ? selectedStoreObj.market_id || selectedStoreObj.marketId
        : user?.market_id;

      // 🟢 PAYLOAD HARDCODING: Ensure a disabled select box doesn't strip the Back Office Member's ID
      let cleanAssigneeId =
        data.assigneeId && data.assigneeId.trim() !== ""
          ? data.assigneeId
          : null;
      if (user?.role === "BACK_OFFICE_MEMBER") {
        cleanAssigneeId = currentUserId;
      }

      const cleanTat = data.tat;
      const cleanStoreId =
        data.storeId && data.storeId.trim() !== ""
          ? data.storeId
          : user?.store_id || null;

      const finalDepartmentId = isBackOfficeStaff
        ? user.department_id || user.departmentId
        : data.departmentId;

      const ticketPayload = {
        ...data,
        departmentId: finalDepartmentId,
        assigneeId: cleanAssigneeId,
        tat: cleanTat,
        market_id: canAssignTask ? null : targetMarketId,
        store_id: canAssignTask ? null : cleanStoreId,
        ticketType: canAssignTask ? "PROACTIVE" : "REACTIVE",
        generatedEmailBody,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      };

      await api.post("/tickets", ticketPayload);

      toast.success(
        canAssignTask
          ? "Proactive Task created successfully!"
          : "Ticket submitted and routed successfully!",
      );
      onSuccess();
      handleClose();
    } catch (error) {
      setIsUploading(false);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to submit ticket.";
      toast.error(errorMsg);
    }
  };

  const Label = ({ children, required = true }) => (
    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-0">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {canAssignTask ? "Create Proactive Task" : "Create a New Ticket"}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {canAssignTask
                ? "Assign targeted tasks with deadlines to specific members."
                : "Submit an issue and our smart router will assign it immediately."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <Label>Select Department</Label>
                <select
                  {...register("departmentId")}
                  tabIndex={isBackOfficeStaff ? -1 : 0}
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all ${
                    isBackOfficeStaff
                      ? "pointer-events-none opacity-70"
                      : "hover:bg-white"
                  } ${errors.departmentId ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                >
                  <option value="">Select a Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.departmentId.message}
                  </span>
                )}
              </div>

              {canAssignTask ? (
                <div className="flex flex-col">
                  <Label required={false}>
                    <Users size={16} className="text-indigo-600" /> Assign To
                    {isFetchingMembers && (
                      <Loader2
                        size={12}
                        className="animate-spin text-indigo-500 ml-1"
                      />
                    )}
                  </Label>
                  <select
                    {...register("assigneeId")}
                    disabled={
                      (!selectedDeptId || departmentMembers.length === 0) &&
                      user?.role !== "BACK_OFFICE_MEMBER"
                    }
                    tabIndex={user?.role === "BACK_OFFICE_MEMBER" ? -1 : 0}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      user?.role === "BACK_OFFICE_MEMBER"
                        ? "pointer-events-none opacity-70"
                        : "hover:bg-white"
                    }`}
                  >
                    <option value="">
                      {!selectedDeptId
                        ? "Select a department first"
                        : departmentMembers.length === 0 &&
                            user?.role !== "BACK_OFFICE_MEMBER"
                          ? "No members found"
                          : "Auto-Route via Smart Router"}
                    </option>
                    {[...departmentMembers]
                      .sort((a, b) => {
                        const statusA = onlineUsers[String(a.id)] || "offline";
                        const statusB = onlineUsers[String(b.id)] || "offline";
                        const weight = { online: 2, away: 1, offline: 0 };
                        return weight[statusB] - weight[statusA];
                      })
                      .map((member) => {
                        const status =
                          onlineUsers[String(member.id)] || "offline";
                        const icon =
                          status === "online"
                            ? "🟢"
                            : status === "away"
                              ? "🟡"
                              : "⚪";
                        return (
                          <option key={member.id} value={member.id}>
                            {icon} {member.name}
                          </option>
                        );
                      })}
                  </select>
                </div>
              ) : canAssignStore ? (
                <div className="flex flex-col">
                  <Label>
                    <Store size={16} className="text-indigo-600" /> Target Store
                  </Label>
                  <select
                    {...register("storeId")}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:bg-white transition-all ${errors.storeId ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                  >
                    <option value="">Select a Store...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  {errors.storeId && (
                    <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.storeId.message}
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <Label>
                  Main Category
                  {isFetchingCategories && (
                    <Loader2
                      size={12}
                      className="animate-spin text-indigo-500 ml-1"
                    />
                  )}
                </Label>
                <select
                  {...register("categoryLevel1")}
                  disabled={!selectedDeptId || categories.length === 0}
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white ${errors.categoryLevel1 ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                >
                  <option value="">
                    {!selectedDeptId
                      ? "Select a department first"
                      : categories.length === 0
                        ? "No categories found"
                        : "Select Category..."}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryLevel1 && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.categoryLevel1.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <Label>Sub Category</Label>
                <select
                  {...register("categoryLevel2")}
                  disabled={
                    !selectedCategoryName || availableSubcategories.length === 0
                  }
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white ${errors.categoryLevel2 ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                >
                  <option value="">
                    {!selectedCategoryName
                      ? "Select main category first"
                      : availableSubcategories.length === 0
                        ? "No subcategories"
                        : "Select Subcategory..."}
                  </option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.categoryLevel2 && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.categoryLevel2.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {canAssignTask && (
                <div className="flex flex-col">
                  <Label>
                    <Calendar size={16} className="text-indigo-600" />{" "}
                    Turnaround Time (TAT)
                  </Label>
                  <input
                    type="datetime-local"
                    {...register("tat")}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white ${errors.tat ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                  />
                  {errors.tat && (
                    <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.tat.message}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col">
                <Label>Priority Level</Label>
                <select
                  {...register("priority")}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="EMERGENCY">Emergency (Escalation)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <Label>Description / Comments</Label>
              <textarea
                {...register("userComments")}
                className={`flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white resize-y ${errors.userComments ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                placeholder={
                  canAssignTask
                    ? "Describe the proactive task details here..."
                    : "Please describe the issue in detail..."
                }
              />
              {errors.userComments && (
                <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.userComments.message}
                </span>
              )}
            </div>

            <div className="pt-2">
              <Label required={false}>Attach File (Optional)</Label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300 transition-all duration-200">
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">
                    {file ? file.name : "Click or drag to upload Image/PDF"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 pb-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="rounded-xl px-6 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="rounded-xl px-8 h-11 bg-[#0F172A] hover:bg-indigo-600 text-white font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Uploading...
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </span>
                ) : canAssignTask ? (
                  "Create Task"
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
