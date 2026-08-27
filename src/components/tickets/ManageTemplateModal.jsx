/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
  X,
  Loader2,
  Building,
  Store,
  Calendar,
  FileText,
  LayoutTemplate,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import { Button } from "../common/Button";
import { Card, CardContent } from "../common/Card";
import { useAuth } from "../../hooks/useAuth";

const templateSchema = z.object({
  templateName: z
    .string()
    .min(3, "Template name must be at least 3 characters"),
  templateDescription: z.string().min(1, "Please provide a quick description"),
  marketId: z.string().optional(),
  storeId: z.string().optional(),
  departmentId: z.string().min(1, "Please select a department"),
  categoryLevel1: z.string().min(1, "Main category is required"),
  categoryLevel2: z.string().min(1, "Sub-category is required"),
  priority: z.enum(["STANDARD", "IMPORTANT", "EMERGENCY"]),
  userComments: z.string().optional(),
  tatHours: z.coerce.number().min(1, "TAT must be at least 1 hour"),
});

const Label = ({ children, required = true }) => (
  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

export const ManageTemplateModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingTemplate,
  departments,
}) => {
  const { user } = useAuth();

  // 1. STRICT ROLE FILTERING (Mirrored from Workload.jsx)

  const isBackOfficeManager = user?.role === "BACK_OFFICE_MANAGER";
  const userDeptId = String(user?.department_id || user?.departmentId || "");

  const [markets, setMarkets] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      priority: "STANDARD",
      tatHours: 24,
      marketId: "",
      storeId: "",
      departmentId: isBackOfficeManager ? userDeptId : "",
      categoryLevel1: "",
      categoryLevel2: "",
    },
  });

  const watchMarketId = watch("marketId");
  const watchDepartmentId = watch("departmentId");
  const watchCategoryLevel1 = watch("categoryLevel1");

  // Load Base Data
  useEffect(() => {
    if (!isOpen) return;
    const loadBaseDropdowns = async () => {
      try {
        const [marketRes, storeRes] = await Promise.all([
          api
            .get("/admin/markets?paginate=false")
            .catch(() => ({ data: { data: [] } })),
          api.get("/tickets/stores").catch(() => ({ data: { data: [] } })),
        ]);
        setMarkets(marketRes.data?.data || []);
        setStores(storeRes.data?.data || []);
      } catch (error) {
        toast.error("Failed to load clients and stores");
      }
    };
    loadBaseDropdowns();
  }, [isOpen]);

  // Initial Form Hydration (Basic Text Fields)
  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        reset({
          templateName: editingTemplate.template_name || "",
          templateDescription: editingTemplate.template_description || "",
          priority: editingTemplate.priority || "STANDARD",
          userComments: editingTemplate.user_comments || "",
          tatHours: editingTemplate.tat_hours || 24,
          // Relational IDs are left blank here so Async Hooks can catch them safely
          marketId: "",
          storeId: "",
          departmentId: isBackOfficeManager ? userDeptId : "",
          categoryLevel1: "",
          categoryLevel2: "",
        });
      } else {
        reset({
          templateName: "",
          templateDescription: "",
          marketId: "",
          storeId: "",
          departmentId: isBackOfficeManager ? userDeptId : "",
          categoryLevel1: "",
          categoryLevel2: "",
          priority: "STANDARD",
          userComments: "",
          tatHours: 24,
        });
      }
    }
  }, [editingTemplate, isOpen, reset, isBackOfficeManager, userDeptId]);

  // Cascading Logic: Markets -> Stores
  const displayedStores = useMemo(() => {
    if (watchMarketId) {
      return stores.filter(
        (s) => String(s.market_id || s.marketId) === String(watchMarketId),
      );
    }
    return stores;
  }, [stores, watchMarketId]);

  // Smart Wipe: Only clear store if manual change (not during template hydration)
  useEffect(() => {
    if (watchMarketId) {
      if (
        !editingTemplate ||
        String(watchMarketId) !== String(editingTemplate.market_id)
      ) {
        if (!displayedStores.find((s) => s.id === watch("storeId"))) {
          setValue("storeId", "");
        }
      }
    }
  }, [watchMarketId, displayedStores, setValue, watch, editingTemplate]);

  // Cascading Logic: Departments -> Categories
  useEffect(() => {
    if (!watchDepartmentId) {
      setCategories([]);
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
      return;
    }

    const fetchCategories = async () => {
      const selectedDept = departments.find(
        (d) => String(d.id) === String(watchDepartmentId),
      );
      if (!selectedDept) return;

      setIsFetchingCategories(true);
      try {
        const catRes = await api.get(`/categories/${selectedDept.name}`);
        setCategories(catRes.data.data || []);
      } catch (error) {
        toast.error("Failed to load categories");
      } finally {
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();

    // Smart Wipe: Only clear categories if manual department change
    if (
      !editingTemplate ||
      String(watchDepartmentId) !== String(editingTemplate.department_id)
    ) {
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
    }
  }, [watchDepartmentId, departments, setValue, editingTemplate]);

  // Cascading Logic: Main Category -> Sub Category
  useEffect(() => {
    if (!watchCategoryLevel1) {
      setAvailableSubcategories([]);
      setValue("categoryLevel2", "");
      return;
    }
    const activeCategory = categories.find(
      (c) => c.name === watchCategoryLevel1,
    );
    setAvailableSubcategories(
      activeCategory ? activeCategory.subcategories : [],
    );

    // Smart Wipe: Only clear subcategory if manual main category change
    if (
      !editingTemplate ||
      watchCategoryLevel1 !== editingTemplate.category_level_1
    ) {
      setValue("categoryLevel2", "");
    }
  }, [watchCategoryLevel1, categories, setValue, editingTemplate]);

  // -------------------------------------------------------------
  // 2. ASYNC HYDRATION FIX: Safely loads template data into dropdowns
  // only AFTER the API data has populated the DOM.
  // -------------------------------------------------------------
  useEffect(() => {
    if (markets.length > 0 && editingTemplate?.market_id) {
      setValue("marketId", editingTemplate.market_id);
    }
  }, [markets, editingTemplate, setValue]);

  useEffect(() => {
    if (displayedStores.length > 0 && editingTemplate?.store_id) {
      if (String(watchMarketId) === String(editingTemplate.market_id)) {
        setValue("storeId", editingTemplate.store_id);
      }
    }
  }, [displayedStores, editingTemplate, setValue, watchMarketId]);

  useEffect(() => {
    if (departments.length > 0 && editingTemplate?.department_id) {
      setValue("departmentId", editingTemplate.department_id);
    } else if (departments.length > 0 && isBackOfficeManager) {
      setValue("departmentId", userDeptId);
    }
  }, [departments, editingTemplate, setValue, isBackOfficeManager, userDeptId]);

  useEffect(() => {
    if (categories.length > 0 && editingTemplate?.category_level_1) {
      if (String(watchDepartmentId) === String(editingTemplate.department_id)) {
        setValue("categoryLevel1", editingTemplate.category_level_1);
      }
    }
  }, [categories, editingTemplate, setValue, watchDepartmentId]);

  useEffect(() => {
    if (
      availableSubcategories.length > 0 &&
      editingTemplate?.category_level_2
    ) {
      if (watchCategoryLevel1 === editingTemplate.category_level_1) {
        setValue("categoryLevel2", editingTemplate.category_level_2);
      }
    }
  }, [availableSubcategories, editingTemplate, setValue, watchCategoryLevel1]);
  // -------------------------------------------------------------

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      // 3. FAILSAFE: Force the department ID for Managers so they can't bypass the UI
      const payload = {
        ...data,
        departmentId: isBackOfficeManager ? userDeptId : data.departmentId,
      };

      if (editingTemplate) {
        await api.put(`/ticket-templates/${editingTemplate.id}`, payload);
        toast.success("Template updated successfully!");
      } else {
        await api.post("/ticket-templates", payload);
        toast.success("New template created!");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save template");
    }
  };

  const inputStyles =
    "flex h-11 w-full rounded-xl border bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-0 custom-scrollbar">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {editingTemplate
                ? "Edit Proactive Template"
                : "Create Proactive Template"}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Pre-configure a standardized task to instantly generate tickets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <Label>
                  <LayoutTemplate size={16} className="text-indigo-600" />{" "}
                  Template Name
                </Label>
                <input
                  {...register("templateName")}
                  className={`${inputStyles} hover:bg-white ${errors.templateName ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                  placeholder="e.g., Daily End of Day Report"
                />
                {errors.templateName && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.templateName.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <Label>
                  <FileText size={16} className="text-indigo-600" /> Quick
                  Description
                </Label>
                <input
                  {...register("templateDescription")}
                  className={`${inputStyles} hover:bg-white ${errors.templateDescription ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                  placeholder="Internal notes for what this template does..."
                />
                {errors.templateDescription && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.templateDescription.message}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-2"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col">
                <Label required={false}>
                  <Building size={16} className="text-indigo-600" /> Select
                  Client
                </Label>
                <select
                  {...register("marketId")}
                  className={`${inputStyles} hover:bg-white border-slate-200 focus:ring-indigo-500/30`}
                >
                  <option value="">Any Client (Dynamic)</option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <Label required={false}>
                  <Store size={16} className="text-indigo-600" /> Target Store
                </Label>
                <select
                  {...register("storeId")}
                  disabled={!watchMarketId}
                  className={`${inputStyles} hover:bg-white border-slate-200 focus:ring-indigo-500/30`}
                >
                  <option value="">
                    {!watchMarketId
                      ? "Select a Client first"
                      : "Any Store (Dynamic)"}
                  </option>
                  {displayedStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <Label>Select Department</Label>
                {/* 4. UI LOCK: Disable the select entirely if the user is a Manager */}
                <select
                  {...register("departmentId")}
                  disabled={isBackOfficeManager}
                  className={`${inputStyles} ${!isBackOfficeManager && "hover:bg-white"} ${errors.departmentId ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                >
                  <option value="">Select a Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
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
                  Main Category{" "}
                  {isFetchingCategories && (
                    <Loader2
                      size={12}
                      className="animate-spin text-indigo-500 ml-1"
                    />
                  )}
                </Label>
                <select
                  {...register("categoryLevel1")}
                  disabled={!watchDepartmentId || categories.length === 0}
                  className={`${inputStyles} hover:bg-white ${errors.categoryLevel1 ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                >
                  <option value="">
                    {!watchDepartmentId
                      ? "Select a department first"
                      : categories.length === 0
                        ? "No categories found"
                        : "Select Category..."}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
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
                    !watchCategoryLevel1 || availableSubcategories.length === 0
                  }
                  className={`${inputStyles} hover:bg-white ${errors.categoryLevel2 ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                >
                  <option value="">
                    {!watchCategoryLevel1
                      ? "Select main category first"
                      : availableSubcategories.length === 0
                        ? "No subcategories"
                        : "Select Subcategory..."}
                  </option>
                  {availableSubcategories.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
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
              <div className="flex flex-col">
                <Label>Priority Level</Label>
                <select
                  {...register("priority")}
                  className={`${inputStyles} hover:bg-white border-slate-200 focus:ring-indigo-500/30`}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div className="flex flex-col">
                <Label>
                  <Calendar size={16} className="text-indigo-600" /> TAT Goal
                  (Hours)
                </Label>
                <input
                  type="number"
                  {...register("tatHours")}
                  className={`${inputStyles} hover:bg-white ${errors.tatHours ? "border-red-500 focus:ring-red-500/30" : "border-slate-200 focus:ring-indigo-500/30"}`}
                  placeholder="24"
                />
                {errors.tatHours && (
                  <span className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.tatHours.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <Label required={false}>Description / Comments (SOP)</Label>
              <textarea
                {...register("userComments")}
                className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all hover:bg-white resize-y custom-scrollbar"
                placeholder="Prefill the ticket description with standard operating procedures or required checklist items..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 pb-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-xl px-6 h-11 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 h-11 bg-[#0F172A] hover:bg-indigo-600 text-white font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </span>
                ) : editingTemplate ? (
                  "Update Template"
                ) : (
                  "Save Template"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
