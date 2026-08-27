/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
  X,
  Loader2,
  Store,
  Users,
  Calendar,
  AlertCircle,
  Building,
  CheckSquare,
} from "lucide-react";
import axios from "axios";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardContent } from "../common/Card";
import { useAuth } from "../../hooks/useAuth";
import { useOnlineUsers } from "../../context/SocketContext";

const ticketSchema = z
  .object({
    departmentId: z.string().min(1, "Please select a department"),
    // 1. UPDATED: assigneeIds is now an array to support multi-select
    assigneeIds: z.array(z.string()).optional().default([]),
    tat: z.string().optional(),
    marketId: z.string().optional(),
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

export const CreateTicketModal = ({
  isOpen,
  onClose,
  onSuccess,
  prefillData,
}) => {
  const { user, loading } = useAuth();
  const onlineUsers = useOnlineUsers() || {};

  const [departments, setDepartments] = useState([]);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [markets, setMarkets] = useState([]);

  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      marketId: "",
      assigneeIds: [],
    },
  });

  const selectedDeptId = watch("departmentId") ?? "";
  const selectedCategoryName = watch("categoryLevel1");
  const selectedMarketId = watch("marketId");
  const watchedAssigneeIds = watch("assigneeIds") || [];

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
  const currentUserName = user
    ? user.name || user.first_name || "My Account"
    : "Assigned to Me";

  const isBackOfficeStaff = useMemo(
    () => ["BACK_OFFICE_MANAGER", "BACK_OFFICE_MEMBER"].includes(user?.role),
    [user?.role],
  );

  const canAssignStore = useMemo(
    () => ["MARKET_MANAGER", "EMPLOYEE"].includes(user?.role),
    [user?.role],
  );

  useEffect(() => {
    if (canAssignTask) {
      if (
        !prefillData ||
        String(selectedMarketId) !== String(prefillData.marketId)
      ) {
        setValue("storeId", "");
      }
    }
  }, [selectedMarketId, setValue, canAssignTask, prefillData]);

  const displayedStores = useMemo(() => {
    if (canAssignTask && selectedMarketId) {
      return stores.filter(
        (s) => String(s.market_id || s.marketId) === String(selectedMarketId),
      );
    }
    return stores;
  }, [stores, selectedMarketId, canAssignTask]);

  useEffect(() => {
    if (!isOpen) return;

    if (prefillData) {
      reset({
        priority: prefillData.priority || "STANDARD",
        storeId: prefillData.storeId || user?.store_id || "",
        marketId: prefillData.marketId || "",
        departmentId:
          prefillData.departmentId || (isBackOfficeStaff ? userDeptId : ""),
        categoryLevel1: prefillData.categoryLevel1 || "",
        categoryLevel2: prefillData.categoryLevel2 || "",
        // Convert prefilled assignee string to array for multi-select
        assigneeIds:
          user?.role === "BACK_OFFICE_MEMBER"
            ? [currentUserId]
            : prefillData.assigneeId
              ? [prefillData.assigneeId]
              : [],
        tat: prefillData.tat || "",
        userComments: prefillData.userComments || "",
      });
    } else {
      reset({
        priority: "STANDARD",
        storeId: user?.store_id || "",
        marketId: "",
        departmentId: isBackOfficeStaff ? userDeptId : "",
        categoryLevel1: "",
        categoryLevel2: "",
        assigneeIds: user?.role === "BACK_OFFICE_MEMBER" ? [currentUserId] : [],
        tat: "",
        userComments: "",
      });
    }
  }, [
    isOpen,
    prefillData,
    user,
    reset,
    isBackOfficeStaff,
    userDeptId,
    currentUserId,
  ]);

  const loadDropdowns = async () => {
    try {
      const deptPromise = api.get("/tickets/departments");

      const storePromise = user
        ? api.get("/tickets/stores").catch(() => ({ data: { data: [] } }))
        : Promise.resolve({ data: { data: [] } });

      const marketPromise = canAssignTask
        ? api
            .get("/admin/markets?paginate=false")
            .catch(() => ({ data: { data: [] } }))
        : Promise.resolve({ data: { data: [] } });

      const [deptRes, storeRes, marketRes] = await Promise.all([
        deptPromise,
        storePromise,
        marketPromise,
      ]);

      const fetchedDepts = deptRes.data.data || [];
      setDepartments(fetchedDepts);
      setMarkets(marketRes.data?.data || []);

      if (isBackOfficeStaff && userDeptId) {
        const exists = fetchedDepts.find((d) => String(d.id) === userDeptId);
        if (exists) {
          setValue("departmentId", userDeptId, { shouldValidate: true });
        }
      }

      if (user) {
        const allStores = storeRes.data?.data || [];
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
      if (user?.role !== "BACK_OFFICE_MEMBER") {
        setValue("assigneeIds", []);
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

      if (canAssignTask && user?.role !== "BACK_OFFICE_MEMBER") {
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
      if (
        !prefillData ||
        String(selectedDeptId) !== String(prefillData.departmentId)
      ) {
        setValue("categoryLevel1", "");
        setValue("categoryLevel2", "");
        if (user?.role !== "BACK_OFFICE_MEMBER") {
          setValue("assigneeIds", []);
        }
      }
    }
  }, [
    selectedDeptId,
    departments,
    setValue,
    canAssignTask,
    user,
    currentUserId,
    prefillData,
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

    if (!prefillData || selectedCategoryName !== prefillData.categoryLevel1) {
      setValue("categoryLevel2", "");
    }
  }, [selectedCategoryName, categories, setValue, prefillData]);

  useEffect(() => {
    if (markets.length > 0 && prefillData?.marketId) {
      setValue("marketId", prefillData.marketId);
    }
  }, [markets, prefillData, setValue]);

  useEffect(() => {
    if (displayedStores.length > 0 && prefillData?.storeId) {
      if (String(selectedMarketId) === String(prefillData.marketId)) {
        setValue("storeId", prefillData.storeId);
      }
    }
  }, [displayedStores, prefillData, setValue, selectedMarketId]);

  useEffect(() => {
    if (departments.length > 0 && prefillData?.departmentId) {
      setValue("departmentId", prefillData.departmentId);
    }
  }, [departments, prefillData, setValue]);

  useEffect(() => {
    if (categories.length > 0 && prefillData?.categoryLevel1) {
      if (String(selectedDeptId) === String(prefillData.departmentId)) {
        setValue("categoryLevel1", prefillData.categoryLevel1);
      }
    }
  }, [categories, prefillData, setValue, selectedDeptId]);

  useEffect(() => {
    if (availableSubcategories.length > 0 && prefillData?.categoryLevel2) {
      if (selectedCategoryName === prefillData.categoryLevel1) {
        setValue("categoryLevel2", prefillData.categoryLevel2);
      }
    }
  }, [availableSubcategories, prefillData, setValue, selectedCategoryName]);

  useEffect(() => {
    if (departmentMembers.length > 0 && prefillData?.assigneeId) {
      if (String(selectedDeptId) === String(prefillData.departmentId)) {
        setValue("assigneeIds", [prefillData.assigneeId]);
      }
    }
  }, [departmentMembers, prefillData, setValue, selectedDeptId]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setFile(null);
    setUploadProgress(0);
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
      if (!data.marketId || data.marketId.trim() === "") {
        setError("marketId", {
          message: "Market selection is strictly required",
        });
        hasError = true;
      }
      if (!data.tat || data.tat.trim() === "") {
        setError("tat", { message: "Turnaround Time (TAT) is required" });
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      let attachmentUrls = [];

      // Only upload the file ONCE, even if creating 10 tickets
      if (file) {
        const MAX_FILE_SIZE = 25 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File is too large. Maximum size allowed is 25MB.");
          return;
        }

        setIsUploading(true);
        setUploadProgress(1);

        const presignedRes = await api.post("/upload/presigned-url", {
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
        });

        const { uploadUrl, fileUrl } = presignedRes.data.data;

        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percentCompleted);
            }
          },
        });

        attachmentUrls.push(fileUrl);
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

      const cleanTat = data.tat;
      const cleanStoreId =
        data.storeId && data.storeId.trim() !== ""
          ? data.storeId
          : user?.store_id || null;

      const finalDepartmentId = isBackOfficeStaff
        ? user.department_id || user.departmentId
        : data.departmentId;

      // Base payload applied to ALL tickets generated
      const basePayload = {
        ...data,
        departmentId: finalDepartmentId,
        tat: cleanTat,
        market_id: canAssignTask ? data.marketId : targetMarketId,
        store_id: cleanStoreId,
        ticketType: canAssignTask ? "PROACTIVE" : "REACTIVE",
        generatedEmailBody,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      };

      let payloadsToSubmit = [];
      let finalAssigneeIds =
        user?.role === "BACK_OFFICE_MEMBER"
          ? [currentUserId]
          : data.assigneeIds || [];

      if (finalAssigneeIds.length === 0) {
        // Auto-route execution (1 ticket, no assignee)
        payloadsToSubmit.push({ ...basePayload, assigneeId: null });
      } else {
        // Multi-assign execution (N tickets)
        payloadsToSubmit = finalAssigneeIds.map((id) => ({
          ...basePayload,
          assigneeId: id,
        }));
      }

      // Execute all creations in parallel
      await Promise.all(
        payloadsToSubmit.map((payload) => api.post("/tickets", payload)),
      );

      toast.success(
        payloadsToSubmit.length > 1
          ? `Successfully created ${payloadsToSubmit.length} tasks!`
          : canAssignTask
            ? "Proactive Task created successfully!"
            : "Ticket submitted and routed successfully!",
      );

      onSuccess();
      handleClose();
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
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

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const pastedFile = items[i].getAsFile();

        if (
          pastedFile &&
          (pastedFile.type.startsWith("image/") ||
            pastedFile.type === "application/pdf")
        ) {
          setFile(pastedFile);
          e.preventDefault();
          return;
        } else {
          toast.error("Invalid file type. Please paste an image or PDF.");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-0">
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
            <div
              className={`grid grid-cols-1 gap-5 ${
                canAssignTask ? "md:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {canAssignTask && (
                <div className="flex flex-col">
                  <Label>
                    <Building size={16} className="text-indigo-600" /> Select
                    Client
                  </Label>
                  <select
                    {...register("marketId")}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white ${
                      errors.marketId
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Select a Client...</option>
                    {markets.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                  {errors.marketId && (
                    <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.marketId.message}
                    </span>
                  )}
                </div>
              )}

              {(canAssignTask || canAssignStore) && (
                <div className="flex flex-col">
                  <Label required={!canAssignTask}>
                    <Store size={16} className="text-indigo-600" /> Target Store
                  </Label>
                  <select
                    {...register("storeId")}
                    disabled={canAssignTask && !selectedMarketId}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.storeId
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : ""
                    }`}
                  >
                    <option value="">
                      {canAssignTask
                        ? !selectedMarketId
                          ? "Select a Client first"
                          : "Select Store (Optional)"
                        : "Select a Store..."}
                    </option>
                    {displayedStores.map((store) => (
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
              )}

              <div className="flex flex-col">
                <Label>Select Department</Label>
                <select
                  {...register("departmentId")}
                  tabIndex={isBackOfficeStaff ? -1 : 0}
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all ${
                    isBackOfficeStaff
                      ? "pointer-events-none opacity-70"
                      : "hover:bg-white"
                  } ${
                    errors.departmentId
                      ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
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
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.departmentId.message}
                  </span>
                )}
              </div>
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
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white ${
                    errors.categoryLevel1
                      ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                      : ""
                  }`}
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
                  className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white ${
                    errors.categoryLevel2
                      ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                      : ""
                  }`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {canAssignTask && (
                <div className="flex flex-col h-full">
                  <Label required={false}>
                    <Users size={16} className="text-indigo-600" /> Assign To
                    {isFetchingMembers &&
                      user?.role !== "BACK_OFFICE_MEMBER" && (
                        <Loader2
                          size={12}
                          className="animate-spin text-indigo-500 ml-1"
                        />
                      )}
                  </Label>

                  {/* MULTI-SELECT CHECKBOX UI INSTEAD OF STANDARD SELECT */}
                  <div
                    className={`flex flex-col w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden transition-all ${user?.role === "BACK_OFFICE_MEMBER" ? "opacity-70 pointer-events-none" : ""}`}
                  >
                    {user?.role === "BACK_OFFICE_MEMBER" ? (
                      <div className="px-3 py-2.5 text-[14px] font-semibold text-indigo-700 bg-indigo-50/40 border border-indigo-200 rounded-xl h-11 flex items-center">
                        🟢 {currentUserName}
                      </div>
                    ) : (
                      <div className="max-h-[140px] overflow-y-auto custom-scrollbar bg-slate-50 border-y border-transparent">
                        {/* Auto-Route Checkbox Option */}
                        <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-white cursor-pointer border-b border-slate-200 transition-colors sticky top-0 bg-slate-50 z-10 shadow-sm">
                          <input
                            type="checkbox"
                            checked={watchedAssigneeIds.length === 0}
                            onChange={() => setValue("assigneeIds", [])}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-[13px] font-bold text-slate-700">
                            Auto-Route via Smart Router
                          </span>
                        </label>

                        {/* Fallback if no members */}
                        {!selectedDeptId ? (
                          <div className="px-4 py-3 text-xs text-slate-400 font-medium italic">
                            Select a department first...
                          </div>
                        ) : departmentMembers.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 font-medium italic">
                            No active members found.
                          </div>
                        ) : (
                          [...departmentMembers]
                            .sort((a, b) => {
                              const statusA =
                                onlineUsers[String(a.id)] || "offline";
                              const statusB =
                                onlineUsers[String(b.id)] || "offline";
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
                                <label
                                  key={member.id}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-white cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    value={member.id}
                                    {...register("assigneeIds")}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="text-[13px] font-medium text-slate-700">
                                    {icon} {member.name}
                                  </span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col h-full">
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

            {canAssignTask && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <Label>
                    <Calendar size={16} className="text-indigo-600" />{" "}
                    Turnaround Time (TAT)
                  </Label>
                  <input
                    type="datetime-local"
                    {...register("tat")}
                    className={`flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white ${
                      errors.tat
                        ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {errors.tat && (
                    <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.tat.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <Label>Description / Comments</Label>
              <textarea
                {...register("userComments")}
                className={`flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white resize-y ${
                  errors.userComments
                    ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                    : ""
                }`}
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
              <div
                className="relative group rounded-xl outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
                onPaste={handlePaste}
                tabIndex={0}
              >
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title=""
                />
                <div className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300 transition-all duration-200">
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 text-center">
                    {file ? (
                      <span className="font-bold text-indigo-600">
                        {file.name}
                      </span>
                    ) : (
                      <>
                        Click, drag, or{" "}
                        <span className="font-bold text-slate-700">
                          paste (Ctrl+V)
                        </span>{" "}
                        Image/PDF
                      </>
                    )}
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
                    <Loader2 size={16} className="animate-spin" /> Uploading{" "}
                    {uploadProgress}%...
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </span>
                ) : canAssignTask ? (
                  watchedAssigneeIds.length > 1 ? (
                    `Create ${watchedAssigneeIds.length} Tasks`
                  ) : (
                    "Create Task"
                  )
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
