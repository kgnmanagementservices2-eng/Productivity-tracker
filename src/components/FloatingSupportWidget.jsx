import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axios from "axios";
import {
  MessageCircle,
  X,
  Search,
  ChevronRight,
  Send,
  Loader2,
  LifeBuoy,
  Building,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const FAQS = [
  {
    q: "How do I reset my password?",
    a: "Go to your profile dropdown and click 'Change Password'.",
  },
  {
    q: "How do I close a ticket?",
    a: "Open the ticket details and use the Resolution Card on the right to mark it as Resolved. Proof of work is required.",
  },
  {
    q: "How do I escalate an issue?",
    a: "Click the 'Escalate Issue' button on the ticket sidebar to alert your manager.",
  },
];

export default function FloatingSupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("faq");

  // Dynamic State
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  // File Upload State
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      departmentId: "",
      categoryLevel1: "",
      categoryLevel2: "",
      marketId: "",
      userComments: "",
    },
  });

  const selectedDeptId = watch("departmentId");
  const selectedCategoryName = watch("categoryLevel1");

  // Fetch Base Dropdowns (Departments & Markets)
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [deptRes, marketRes] = await Promise.all([
          api.get("/tickets/departments"),
          api
            .get("/admin/markets?paginate=false")
            .catch(() => ({ data: { data: [] } })),
        ]);
        setDepartments(deptRes.data?.data || []);
        setMarkets(marketRes.data?.data || []);
      } catch (error) {
        console.error("Failed to load widget dropdowns");
      }
    };
    fetchBaseData();
  }, []);

  // Fetch Categories based on selected Department
  useEffect(() => {
    if (!selectedDeptId) {
      setCategories([]);
      setAvailableSubcategories([]);
      setValue("categoryLevel1", "");
      setValue("categoryLevel2", "");
      return;
    }

    const loadCategories = async () => {
      const selectedDept = departments.find(
        (d) => String(d.id) === String(selectedDeptId),
      );
      if (!selectedDept) return;

      setIsFetchingCategories(true);
      try {
        const catRes = await api.get(`/categories/${selectedDept.name}`);
        setCategories(catRes.data?.data || []);
      } catch (error) {
        toast.error("Failed to load categories.");
      } finally {
        setIsFetchingCategories(false);
      }
    };

    loadCategories();
  }, [selectedDeptId, departments, setValue]);

  // Update Subcategories when Main Category changes
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

  // Secure Paste Handler for Images/PDFs
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

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data) => {
    try {
      let attachmentUrls = [];

      // Handle the optional Presigned URL Upload flow
      if (file) {
        const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Limit
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
          headers: { "Content-Type": file.type || "application/octet-stream" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(
                Math.round((progressEvent.loaded * 100) / progressEvent.total),
              );
            }
          },
        });

        attachmentUrls.push(fileUrl);
        setIsUploading(false);
      }

      // 🟢 Calculate TAT exactly 7 days from now
      const tatDate = new Date();
      tatDate.setDate(tatDate.getDate() + 7);
      const cleanTat = tatDate.toISOString();

      // 🟢 THE FIX: Generate the required email body text for the backend validation
      const generatedEmailBody = `
        IT SUPPORT WIDGET SUBMISSION:
        Category: ${data.categoryLevel1} > ${data.categoryLevel2}
        Priority: IMPORTANT
        Comments: ${data.userComments}
      `;

      await api.post("/tickets", {
        departmentId: data.departmentId,
        categoryLevel1: data.categoryLevel1,
        categoryLevel2: data.categoryLevel2,
        priority: "IMPORTANT",
        userComments: data.userComments,
        generatedEmailBody, // 🟢 THE FIX: Injected into the payload
        market_id: data.marketId || user?.market_id || null,
        tat: cleanTat,
        ticketType: "REACTIVE",
        tags: ["SUPPORT"],
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      toast.success("Support Ticket Raised Successfully!");
      reset();
      clearFile();
      setView("faq");
      setIsOpen(false);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(error.response?.data?.message || "Failed to submit ticket.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* The Hanging Bot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 hover:bg-indigo-600 text-white h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          <LifeBuoy size={24} />
        </button>
      )}

      {/* The Support Panel */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[650px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <LifeBuoy size={16} className="text-indigo-400" /> Help Center
              </h3>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Find answers or reach out for support
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition-colors p-1 bg-white/10 rounded-md hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          {/* FAQ View (Deflection) */}
          {view === "faq" && (
            <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
              <div className="p-4 space-y-3 flex-1">
                <div className="relative mb-4">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  />
                </div>

                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Frequent Questions
                </p>
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm cursor-help group transition-all hover:border-indigo-200 hover:shadow-md"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {faq.q}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <p className="text-[11px] font-bold text-slate-500 text-center mb-2 uppercase tracking-wider">
                  Still need help?
                </p>
                <button
                  onClick={() => setView("form")}
                  className="w-full bg-indigo-50 text-indigo-700 font-bold text-xs py-3 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100"
                >
                  <MessageCircle size={14} /> Contact Support{" "}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Form View (Escalation) */}
          {view === "form" && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto bg-slate-50 flex flex-col p-4 space-y-4"
            >
              <button
                type="button"
                onClick={() => setView("faq")}
                className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center w-fit bg-white px-2 py-1 rounded border border-slate-200 shadow-sm"
              >
                &larr; Back to FAQs
              </button>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                {/* Market Dropdown */}
                {markets.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building size={12} className="text-indigo-500" /> Select
                      Market
                    </label>
                    <select
                      {...register("marketId")}
                      className="w-full text-sm p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Market (Optional)</option>
                      {markets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Department Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Target Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("departmentId", {
                      required: "Department is required",
                    })}
                    className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${errors.departmentId ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Level 1 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    Main Category <span className="text-red-500">*</span>
                    {isFetchingCategories && (
                      <Loader2
                        size={10}
                        className="animate-spin text-indigo-500"
                      />
                    )}
                  </label>
                  <select
                    {...register("categoryLevel1", {
                      required: "Category is required",
                    })}
                    disabled={!selectedDeptId || categories.length === 0}
                    className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors disabled:opacity-50 ${errors.categoryLevel1 ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                  >
                    <option value="">
                      {categories.length === 0 && selectedDeptId
                        ? "No categories found"
                        : "Select Category..."}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Level 2 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Specific Issue <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("categoryLevel2", {
                      required: "Subcategory is required",
                    })}
                    disabled={
                      !selectedCategoryName ||
                      availableSubcategories.length === 0
                    }
                    className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors disabled:opacity-50 ${errors.categoryLevel2 ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                  >
                    <option value="">Select Subcategory...</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comments/Details */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("userComments", {
                      required: "Please describe the issue",
                    })}
                    placeholder="Describe your issue in detail..."
                    className={`w-full h-20 text-sm p-3 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none custom-scrollbar transition-colors ${errors.userComments ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                  ></textarea>
                </div>

                {/* 🟢 Image/PDF Upload Zone with Ctrl+V Support */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    Attach File{" "}
                    <span className="text-slate-400 font-normal lowercase">
                      (Optional)
                    </span>
                  </label>

                  <div
                    className="relative group rounded-xl outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
                    onPaste={handlePaste}
                    tabIndex={0}
                  >
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp, application/pdf"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all duration-200 cursor-pointer"
                    >
                      {file ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-indigo-600 truncate pr-4">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFile();
                            }}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 group-hover:text-indigo-600 text-center">
                          Click or{" "}
                          <span className="font-bold text-slate-700">
                            paste (Ctrl+V)
                          </span>{" "}
                          Image/PDF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={isSubmitting || isUploading}
                className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 mt-auto shadow-md disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Uploading{" "}
                    {uploadProgress}%
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Submit Support Ticket
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
