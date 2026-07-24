/* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { X, Loader2, Store, Users, Calendar } from "lucide-react";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";
import { useAuth } from "../../hooks/useAuth";
import { useOnlineUsers } from "../../context/SocketContext";

const ticketSchema = z.object({
  departmentId: z.string().uuid("Please select a department"),
  assigneeId: z.string().optional(),
  tat: z.string().optional(),
  categoryLevel1: z.string().min(1, "Main category is required"),
  categoryLevel2: z.string().min(1, "Sub-category is required"),
  priority: z.enum(["STANDARD", "IMPORTANT", "EMERGENCY"]),
  userComments: z.string().optional(),
  storeId: z.string().optional(),
});

export const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  // 🟢 FIX 1: Extract 'loading' to prevent race conditions
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
    reset({
      priority: "STANDARD",
      storeId: user?.store_id || "",
      departmentId: isBackOfficeStaff ? userDeptId : "",
      categoryLevel1: "",
      categoryLevel2: "",
      assigneeId: "",
      tat: "",
      userComments: "",
    });
  }, [isOpen, user, reset, isBackOfficeStaff, userDeptId]);

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

  // useEffect(() => {
  //   if (!isOpen || !user) return;
  //   loadDropdowns();
  // }, [
  //   isOpen,
  //   user,
  //   userDeptId,
  //   isBackOfficeStaff,
  //   canAssignStore,
  //   canAssignTask,
  //   setValue,
  // ]);
  useEffect(() => {
    // 🟢 Guard against the loading state
    if (!isOpen || loading || !user) return;
    loadDropdowns();
  }, [
    isOpen,
    loading, // <-- add to dependency array
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

  // 3. Fetch Categories and Members when Department Changes
  useEffect(() => {
    if (!user) return;

    if (!selectedDeptId) {
      setCategories([]);
      setDepartmentMembers([]);
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
      setValue("assigneeId", "");
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

          const members = (userRes.data.data || []).filter((u) => {
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

          setDepartmentMembers(members);

          // If it's a standard member, instantly auto-assign the ticket to themselves
          if (user?.role === "BACK_OFFICE_MEMBER") {
            const currentUserId = String(user.id || user.userId);
            if (members.some((m) => String(m.id) === currentUserId)) {
              setValue("assigneeId", currentUserId, { shouldValidate: true });
            }
          }
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
      setValue("assigneeId", "");
    }
  }, [selectedDeptId, departments, setValue, canAssignTask, user]);

  // 4. Handle Subcategories
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
    if (canAssignStore && !data.storeId) {
      return toast.error("Please select a target store for this ticket.");
    }

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
        Comments: ${data.userComments || "None provided."}
      `;

      const selectedStoreObj = stores.find((s) => s.id === data.storeId);
      const targetMarketId = selectedStoreObj
        ? selectedStoreObj.market_id || selectedStoreObj.marketId
        : user?.market_id;

      const cleanAssigneeId =
        data.assigneeId && data.assigneeId.trim() !== ""
          ? data.assigneeId
          : null;
      const cleanTat = data.tat && data.tat.trim() !== "" ? data.tat : null;
      const cleanStoreId =
        data.storeId && data.storeId.trim() !== ""
          ? data.storeId
          : user?.store_id || null;

      // Ensure proper target department
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto bg-white">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <CardHeader>
          <CardTitle>
            {canAssignTask ? "Create Proactive Task" : "Create a New Ticket"}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {canAssignTask
              ? "Assign targeted tasks with deadlines to specific members."
              : "Submit an issue and our smart router will assign it immediately."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Select Department
                </label>
                <select
                  {...register("departmentId")}
                  tabIndex={isBackOfficeStaff ? -1 : 0}
                  className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                    isBackOfficeStaff
                      ? "pointer-events-none bg-slate-50 opacity-80"
                      : ""
                  }`}
                >
                  <option value="">Select a Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="text-sm text-red-500">
                    {errors.departmentId.message}
                  </span>
                )}
              </div>

              {canAssignTask ? (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-600" /> Members in
                    Department
                    {isFetchingMembers && (
                      <Loader2
                        size={12}
                        className="animate-spin text-indigo-500"
                      />
                    )}
                  </label>
                  <select
                    {...register("assigneeId")}
                    disabled={!selectedDeptId || departmentMembers.length === 0}
                    tabIndex={user?.role === "BACK_OFFICE_MEMBER" ? -1 : 0}
                    className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 ${
                      user?.role === "BACK_OFFICE_MEMBER"
                        ? "pointer-events-none bg-slate-50 opacity-80"
                        : ""
                    }`}
                  >
                    <option value="">
                      {!selectedDeptId
                        ? "Select a department first"
                        : departmentMembers.length === 0
                          ? "No members found in this department"
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

                        let icon = "⚪";
                        let label = "";

                        if (status === "online") {
                          icon = "🟢";
                          label = "(Online)";
                        } else if (status === "away") {
                          icon = "🟡";
                          label = "(Away)";
                        }

                        return (
                          <option key={member.id} value={member.id}>
                            {icon} {member.name} -{" "}
                            {member.role.replace(/_/g, " ")} {label}
                          </option>
                        );
                      })}
                  </select>
                </div>
              ) : canAssignStore ? (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Store size={14} className="text-indigo-600" /> Target Store
                  </label>
                  <select
                    {...register("storeId")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a Store...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  Main Category (C1)
                  {isFetchingCategories && (
                    <Loader2
                      size={14}
                      className="animate-spin text-indigo-500"
                    />
                  )}
                </label>
                <select
                  {...register("categoryLevel1")}
                  disabled={!selectedDeptId || categories.length === 0}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
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
                  <span className="text-sm text-red-500">
                    {errors.categoryLevel1.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Sub Category (C2)
                </label>
                <select
                  {...register("categoryLevel2")}
                  disabled={
                    !selectedCategoryName || availableSubcategories.length === 0
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
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
                  <span className="text-sm text-red-500">
                    {errors.categoryLevel2.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canAssignTask && (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />{" "}
                    Turnaround Time (TAT)
                  </label>
                  <input
                    type="datetime-local"
                    {...register("tat")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Priority Level
                </label>
                <select
                  {...register("priority")}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="EMERGENCY">Emergency (Escalation)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 pt-2">
              <label className="text-sm font-medium text-slate-700">
                Additional Comments / Task Description
              </label>
              <textarea
                {...register("userComments")}
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder={
                  canAssignTask
                    ? "Describe the proactive task details here..."
                    : "Please describe the issue in detail..."
                }
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Attach Image/PDF (Optional)
              </p>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isUploading
                  ? "Uploading File..."
                  : isSubmitting
                    ? canAssignTask
                      ? "Assigning Task..."
                      : "Routing Ticket..."
                    : canAssignTask
                      ? "Create Task"
                      : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
