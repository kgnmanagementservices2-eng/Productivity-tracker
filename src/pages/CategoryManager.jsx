/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Layers,
  Loader2,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Card, CardHeader, CardTitle } from "../components/common/Card";
import { cn } from "../utils/cn";

// Pre-defined color themes with rich gradients and dynamic shadows
const CATEGORY_THEMES = [
  {
    headerGradient: "bg-gradient-to-r from-red-600 to-rose-500",
    shadowHover: "hover:shadow-red-500/20",
    bg: "bg-red-50",
    text: "text-red-800",
    hoverBg: "hover:bg-red-100",
    border: "border-red-200",
  }, // Theme 1: Red/Rose
  {
    headerGradient: "bg-gradient-to-r from-blue-600 to-sky-500",
    shadowHover: "hover:shadow-blue-500/20",
    bg: "bg-blue-50",
    text: "text-blue-800",
    hoverBg: "hover:bg-blue-100",
    border: "border-blue-200",
  }, // Theme 2: Blue/Sky
  {
    headerGradient: "bg-gradient-to-r from-emerald-600 to-teal-500",
    shadowHover: "hover:shadow-emerald-500/20",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    hoverBg: "hover:bg-emerald-100",
    border: "border-emerald-200",
  }, // Theme 3: Emerald/Teal
  {
    headerGradient: "bg-gradient-to-r from-purple-600 to-indigo-500",
    shadowHover: "hover:shadow-purple-500/20",
    bg: "bg-purple-50",
    text: "text-purple-800",
    hoverBg: "hover:bg-purple-100",
    border: "border-purple-200",
  }, // Theme 4: Purple/Indigo
  {
    headerGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    shadowHover: "hover:shadow-amber-500/20",
    bg: "bg-amber-50",
    text: "text-amber-800",
    hoverBg: "hover:bg-amber-100",
    border: "border-amber-200",
  }, // Theme 5: Amber/Orange
  {
    headerGradient: "bg-gradient-to-r from-pink-600 to-fuchsia-500",
    shadowHover: "hover:shadow-pink-500/20",
    bg: "bg-pink-50",
    text: "text-pink-800",
    hoverBg: "hover:bg-pink-100",
    border: "border-pink-200",
  }, // Theme 6: Pink/Fuchsia
];

export default function CategoryManager() {
  const { user } = useAuth();

  // Dynamic Departments State
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [isDeptLoading, setIsDeptLoading] = useState(true);

  // Category State
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Input states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState({});

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/categories/departments/allowed");
        const depts = res.data.data;
        setDepartments(depts);
        if (depts && depts.length > 0) {
          setSelectedDept(depts[0]);
        }
      } catch (error) {
        toast.error("Failed to load departments.");
      } finally {
        setIsDeptLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const fetchCategories = async (dept) => {
    if (!dept) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/categories/${dept}`);
      setCategories(res.data.data);
    } catch (error) {
      toast.error("Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(selectedDept);
  }, [selectedDept]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !selectedDept) return;
    try {
      await api.post("/categories", {
        department: selectedDept,
        name: newCategoryName,
      });
      toast.success("Category added!");
      setNewCategoryName("");
      fetchCategories(selectedDept);
    } catch (error) {
      toast.error("Failed to add category.");
    }
  };

  const handleAddSubcategory = async (categoryId) => {
    const subName = newSubcategoryInputs[categoryId];
    if (!subName || !subName.trim()) return;
    try {
      await api.post("/categories/subcategory", {
        categoryId: categoryId,
        name: subName,
      });
      toast.success("Subcategory added!");
      setNewSubcategoryInputs({ ...newSubcategoryInputs, [categoryId]: "" });
      fetchCategories(selectedDept);
    } catch (error) {
      toast.error("Failed to add subcategory.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !window.confirm(
        "Delete this category? ALL subcategories inside it will also be deleted.",
      )
    )
      return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories(selectedDept);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteSubcategory = async (id) => {
    try {
      await api.delete(`/categories/subcategory/${id}`);
      fetchCategories(selectedDept);
    } catch (error) {
      toast.error("Failed to delete subcategory");
    }
  };

  const getCategoryTheme = (index) =>
    CATEGORY_THEMES[index % CATEGORY_THEMES.length];

  if (isDeptLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 tracking-wide">
            Loading routing configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 space-y-8 font-sans pb-12 bg-[#F8FAFC] min-h-screen pt-6">
      {/* 
        INJECTED CSS FOR "TOUGH" SPRING ANIMATIONS
        Using a custom cubic-bezier for a strong snap effect 
      */}
      <style>{`
        @keyframes pop-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          50% { opacity: 1; transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-pop-in {
          opacity: 0;
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-[#0F172A] flex items-center gap-3 tracking-tight">
            <FolderTree className="text-indigo-600" size={32} />
            Category Routing Manager
          </h1>
          <p className="text-[#64748B] mt-1.5 text-sm font-medium">
            Define the hierarchical category & subcategory workflows for the
            ticket submission engine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT COLUMN: Department Selector */}
        <div className="lg:col-span-1 space-y-4 sticky top-24">
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader className="bg-white border-b border-slate-100 py-5 px-5">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                {user?.role === "GLOBAL_ADMIN"
                  ? "All Departments"
                  : "Your Department"}
              </CardTitle>
            </CardHeader>
            <div className="py-3 flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {departments.length === 0 ? (
                <div className="py-8 text-center text-sm font-medium text-slate-400">
                  No departments found.
                </div>
              ) : (
                departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={cn(
                      "group flex items-center justify-between py-3 transition-all duration-300 text-left w-full mr-2 rounded-r-xl",
                      selectedDept === dept
                        ? "border-l-[6px] border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold pl-4 pr-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]"
                        : "border-l-[6px] border-transparent text-[#64748B] font-semibold hover:bg-slate-50 hover:text-slate-900 pl-4 pr-4 active:scale-[0.98]",
                    )}
                  >
                    <span className="truncate pr-2">{dept}</span>
                    {selectedDept === dept && (
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-indigo-500 animate-in slide-in-from-left-2"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Categories & Subcategories */}
        <div className="lg:col-span-3 space-y-6">
          {selectedDept ? (
            <>
              {/* Add Category Bar */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-2.5 flex items-center transition-all duration-300 focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:shadow-md">
                <div className="pl-4 pr-3 text-indigo-400">
                  <FolderOpen size={22} />
                </div>
                <form
                  onSubmit={handleAddCategory}
                  className="flex-1 flex gap-3"
                >
                  <input
                    type="text"
                    placeholder={`Create a new main category for ${selectedDept}...`}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-transparent h-12 text-[15px] font-medium text-[#334155] placeholder:text-slate-400 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className="rounded-xl px-8 bg-[#0F172A] hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Plus size={20} className="mr-2" /> Create
                  </Button>
                </form>
              </div>

              {/* List of Existing Categories */}
              {isLoading ? (
                <div className="py-32 text-center flex flex-col items-center justify-center text-slate-400">
                  <Loader2
                    className="animate-spin mb-4 text-indigo-500"
                    size={32}
                  />
                  <p className="text-base font-semibold">
                    Constructing routing tree...
                  </p>
                </div>
              ) : categories.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white flex flex-col items-center justify-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 mb-5">
                    <FolderTree size={36} className="text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-extrabold text-xl mb-2">
                    No categories configured
                  </p>
                  <p className="text-base text-[#64748B] font-medium max-w-md">
                    The <span className="text-slate-800">{selectedDept}</span>{" "}
                    department doesn't have any routing categories yet. Add one
                    above to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-7">
                  {categories.map((category, index) => {
                    const theme = getCategoryTheme(index);

                    return (
                      <Card
                        key={category.id}
                        // Applies the staggered pop-in animation, scale on hover, and dynamic shadow
                        className={cn(
                          "animate-pop-in border-slate-200/60 rounded-2xl overflow-hidden flex flex-col bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
                          theme.shadowHover,
                        )}
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        {/* Gradient Category Header */}
                        <div
                          className={cn(
                            "px-5 py-4 flex items-center justify-between shrink-0",
                            theme.headerGradient,
                          )}
                        >
                          <h3 className="font-bold text-white text-[17px] leading-6 flex items-center gap-3 drop-shadow-sm">
                            <Layers size={20} className="text-white/80" />
                            {category.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200 group active:scale-95"
                            title="Delete entire category"
                          >
                            <Trash2
                              size={18}
                              className="group-hover:rotate-12 transition-transform duration-300"
                            />
                          </button>
                        </div>

                        {/* Subcategories */}
                        <div className="flex-1 p-6 bg-white">
                          {category.subcategories.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-[#64748B] font-semibold bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
                              <AlertCircle
                                size={16}
                                className="text-amber-500"
                              />{" "}
                              No subcategories assigned yet.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2.5">
                              {category.subcategories.map((sub) => (
                                <div
                                  key={sub.id}
                                  // Tough, tactile hover effects on individual tags
                                  className={cn(
                                    "group relative flex items-center gap-2 border-[1.5px] text-[13.5px] font-bold pl-3 pr-2 py-1.5 rounded-lg transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97]",
                                    theme.bg,
                                    theme.text,
                                    theme.border,
                                    theme.hoverBg,
                                  )}
                                >
                                  {sub.name}
                                  <button
                                    onClick={() =>
                                      handleDeleteSubcategory(sub.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 bg-black/5 hover:bg-red-500 hover:text-white p-1 rounded-md transition-all duration-200 focus:opacity-100 ml-1"
                                    title="Remove subcategory"
                                  >
                                    <X
                                      size={14}
                                      className="group-hover/btn:rotate-90 transition-transform"
                                    />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Subcategory Inline Input */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                          <div className="relative flex items-center group/input">
                            <input
                              type="text"
                              placeholder="Add a new subcategory..."
                              value={newSubcategoryInputs[category.id] || ""}
                              onChange={(e) =>
                                setNewSubcategoryInputs({
                                  ...newSubcategoryInputs,
                                  [category.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleAddSubcategory(category.id);
                              }}
                              className="w-full h-11 rounded-xl border border-slate-300/80 pl-4 pr-20 text-[14px] font-medium text-[#334155] focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none bg-white shadow-sm transition-all duration-300"
                            />
                            <button
                              onClick={() => handleAddSubcategory(category.id)}
                              disabled={
                                !newSubcategoryInputs[category.id]?.trim()
                              }
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 active:scale-95 disabled:opacity-0 disabled:scale-90 transition-all duration-200"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="py-32 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white flex flex-col items-center justify-center">
              <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 mb-5">
                <Layers size={36} className="text-slate-400" />
              </div>
              <p className="text-slate-900 font-extrabold text-xl mb-2">
                Awaiting Selection
              </p>
              <p className="text-base text-[#64748B] font-medium max-w-md">
                Please select a department from the left sidebar to manage its
                hierarchical categories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
