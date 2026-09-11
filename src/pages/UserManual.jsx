// import { useState, useEffect, useCallback, useRef } from "react";
// import {
//   BookOpen,
//   ChevronLeft,
//   ChevronRight,
//   Grid3X3,
//   Monitor,
//   ZoomIn,
//   ZoomOut,
//   Maximize,
//   Minimize,
//   RotateCcw,
//   AlertCircle,
// } from "lucide-react";

// const MANUAL_PAGES = [
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ce8d7415-5b18-4404-9f10-693aa35b7437-ChatGPT-Image-Sep-8,-2026,-08_03_12-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/d5a34c5d-8a1e-4fc5-ba43-2cd28c71ffb7-ChatGPT-Image-Sep-8,-2026,-04_38_22-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/d9ecb07a-3eae-4a73-8e63-2b98284c3b9e-ChatGPT-Image-Sep-8,-2026,-04_48_26-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/dba52caa-34b3-4953-85cd-86d30076c927-ChatGPT-Image-Sep-8,-2026,-05_00_06-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/16d60baa-6b58-4460-b30e-0bb752aa9637-ChatGPT-Image-Sep-8,-2026,-05_04_44-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/73d91b89-753f-4efa-b730-897321f76675-ChatGPT-Image-Sep-8,-2026,-05_11_51-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ebe02a87-a899-493e-b480-77f6e7576747-ChatGPT-Image-Sep-8,-2026,-05_16_46-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/c7010189-b27c-4fe3-afad-64a243070d16-ChatGPT-Image-Sep-8,-2026,-05_25_58-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/4ede3c0c-3734-4d7c-94c9-406baa72d8eb-ChatGPT-Image-Sep-8,-2026,-07_42_30-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/1fbcb001-0a80-4bd0-aa11-1aab556916f1-ChatGPT-Image-Sep-8,-2026,-06_54_20-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ee085e2c-4877-46ae-9381-a93fb876bece-ChatGPT-Image-Sep-8,-2026,-06_55_59-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/6673f477-6a28-4ba0-ad7f-6232fe44c4c3-ChatGPT-Image-Sep-8,-2026,-07_18_10-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/fe636453-604e-4748-ab47-79e8db998962-ChatGPT-Image-Sep-8,-2026,-08_01_07-AM.png",
//   "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/5dea7ed9-c487-485e-a0f5-615cbe2bc4ee-ChatGPT-Image-Sep-8,-2026,-07_55_19-AM.png",
// ];

// export default function UserManual() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [viewMode, setViewMode] = useState("slides");
//   const [zoom, setZoom] = useState(100);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [loadedPages, setLoadedPages] = useState({});
//   const [errorPages, setErrorPages] = useState({});

//   const viewerRef = useRef(null);
//   const thumbnailRef = useRef(null);
//   const totalPages = MANUAL_PAGES.length;

//   const goToNext = useCallback(
//     () => setCurrentIndex((p) => Math.min(p + 1, totalPages - 1)),
//     [totalPages],
//   );
//   const goToPrev = useCallback(
//     () => setCurrentIndex((p) => Math.max(p - 1, 0)),
//     [],
//   );
//   const goToPage = useCallback(
//     (index) => {
//       if (index >= 0 && index < totalPages) {
//         setCurrentIndex(index);
//         setViewMode("slides");
//       }
//     },
//     [totalPages],
//   );

//   // Keyboard Navigation
//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       const tag = event.target?.tagName?.toLowerCase();
//       if (["input", "textarea", "select"].includes(tag)) return;

//       switch (event.key) {
//         case "ArrowRight":
//           event.preventDefault();
//           goToNext();
//           break;
//         case "ArrowLeft":
//           event.preventDefault();
//           goToPrev();
//           break;
//         case "Escape":
//           if (isFullscreen) {
//             document.exitFullscreen?.();
//             setIsFullscreen(false);
//           }
//           break;
//         case "+":
//         case "=":
//           event.preventDefault();
//           setZoom((p) => Math.min(p + 10, 250));
//           break;
//         case "-":
//           event.preventDefault();
//           setZoom((p) => Math.max(p - 10, 50));
//           break;
//         case "0":
//           event.preventDefault();
//           setZoom(100);
//           break;
//         default:
//           break;
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [goToNext, goToPrev, isFullscreen]);

//   // Reset zoom on page change & scroll active thumbnail into view
//   useEffect(() => {
//     setZoom(100);
//     const activeThumbnail = thumbnailRef.current?.querySelector(
//       `[data-page="${currentIndex}"]`,
//     );
//     activeThumbnail?.scrollIntoView({
//       behavior: "smooth",
//       block: "nearest",
//       inline: "center",
//     });
//   }, [currentIndex]);

//   // Fullscreen Management
//   const toggleFullscreen = async () => {
//     try {
//       if (!document.fullscreenElement)
//         await viewerRef.current?.requestFullscreen?.();
//       else await document.exitFullscreen?.();
//     } catch (error) {
//       console.error("Fullscreen error:", error);
//     }
//   };

//   useEffect(() => {
//     const handleFullscreenChange = () =>
//       setIsFullscreen(Boolean(document.fullscreenElement));
//     document.addEventListener("fullscreenchange", handleFullscreenChange);
//     return () =>
//       document.removeEventListener("fullscreenchange", handleFullscreenChange);
//   }, []);

//   const handleImageLoad = (index) =>
//     setLoadedPages((p) => ({ ...p, [index]: true }));
//   const handleImageError = (index) =>
//     setErrorPages((p) => ({ ...p, [index]: true }));
//   const preventContextMenu = (event) => event.preventDefault();

//   return (
//     <div className="flex w-full flex-col gap-6 font-sans text-slate-900 h-[calc(100vh-6rem)] min-h-[600px]">
//       {/* HEADER SECTION */}
//       <header className="flex shrink-0 flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex min-w-0 items-center gap-4">
//           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-md">
//             <BookOpen size={22} strokeWidth={2} />
//           </div>
//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
//                 Productivity Tracker Manual
//               </h1>
//               <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-300 sm:block" />
//               <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
//                 Documentation
//               </span>
//             </div>
//             <p className="mt-1 text-sm font-medium text-slate-500">
//               {viewMode === "slides"
//                 ? `Viewing Page ${currentIndex + 1} of ${totalPages}`
//                 : `${totalPages} Total Pages`}
//             </p>
//           </div>
//         </div>

//         {/* View Toggles */}
//         <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 p-1 border border-slate-200/60 shadow-inner">
//           <button
//             onClick={() => setViewMode("slides")}
//             aria-pressed={viewMode === "slides"}
//             className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
//               viewMode === "slides"
//                 ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5"
//                 : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
//             }`}
//           >
//             <Monitor size={16} />
//             <span className="hidden sm:inline">Viewer</span>
//           </button>
//           <button
//             onClick={() => setViewMode("grid")}
//             aria-pressed={viewMode === "grid"}
//             className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
//               viewMode === "grid"
//                 ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5"
//                 : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
//             }`}
//           >
//             <Grid3X3 size={16} />
//             <span className="hidden sm:inline">Grid</span>
//           </button>
//         </div>
//       </header>

//       {/* VIEWER / GRID AREA */}
//       <main
//         ref={viewerRef}
//         className={`relative flex min-h-0 flex-1 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all ${
//           isFullscreen
//             ? "h-screen w-screen rounded-none border-0 z-50 fixed inset-0"
//             : ""
//         }`}
//       >
//         {viewMode === "slides" ? (
//           <div className="flex h-full flex-col min-h-0 relative">
//             {/* Document Canvas Background */}
//             <div className="absolute inset-0 bg-slate-50/80 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 z-0 pointer-events-none" />

//             {/* Viewport */}
//             <section
//               className="relative z-10 flex min-h-0 flex-1 overflow-auto items-center justify-center p-4 sm:p-8"
//               onContextMenu={preventContextMenu}
//             >
//               {/* Navigation Arrows */}
//               <button
//                 onClick={goToPrev}
//                 disabled={currentIndex === 0}
//                 aria-label="Previous page"
//                 className="group absolute left-4 top-1/2 z-40 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-700 shadow-md ring-1 ring-slate-200 transition-all hover:scale-105 hover:bg-white disabled:opacity-0 focus-visible:ring-2 focus-visible:ring-blue-500"
//               >
//                 <ChevronLeft
//                   size={24}
//                   className="group-hover:-translate-x-0.5 transition-transform"
//                 />
//               </button>

//               <button
//                 onClick={goToNext}
//                 disabled={currentIndex === totalPages - 1}
//                 aria-label="Next page"
//                 className="group absolute right-4 top-1/2 z-40 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-700 shadow-md ring-1 ring-slate-200 transition-all hover:scale-105 hover:bg-white disabled:opacity-0 focus-visible:ring-2 focus-visible:ring-blue-500"
//               >
//                 <ChevronRight
//                   size={24}
//                   className="group-hover:translate-x-0.5 transition-transform"
//                 />
//               </button>

//               {/* Page Indicator Bubble */}
//               <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-lg">
//                 Page {currentIndex + 1} of {totalPages}
//               </div>

//               {/* Document Image Wrapper */}
//               <div
//                 className={`relative flex items-center justify-center transition-all duration-200 ${zoom > 100 ? "min-h-max min-w-max" : "h-full w-full"}`}
//               >
//                 {/* Loading State */}
//                 {!loadedPages[currentIndex] && !errorPages[currentIndex] && (
//                   <div className="absolute inset-0 z-20 flex items-center justify-center">
//                     <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
//                       <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
//                       <span className="text-sm font-semibold text-slate-500">
//                         Rendering page...
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 {/* Error State */}
//                 {errorPages[currentIndex] ? (
//                   <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50/90 backdrop-blur px-8 py-6 text-center shadow-sm border border-red-100">
//                     <AlertCircle className="text-red-500" size={32} />
//                     <p className="text-sm font-semibold text-red-700">
//                       Document failed to load
//                     </p>
//                     <button
//                       onClick={() => window.location.reload()}
//                       className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
//                     >
//                       Retry Connection
//                     </button>
//                   </div>
//                 ) : (
//                   <img
//                     key={currentIndex}
//                     src={MANUAL_PAGES[currentIndex]}
//                     alt={`Manual Page ${currentIndex + 1}`}
//                     draggable="false"
//                     onLoad={() => handleImageLoad(currentIndex)}
//                     onError={() => handleImageError(currentIndex)}
//                     className={`block select-none rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-opacity duration-300 ${loadedPages[currentIndex] ? "opacity-100" : "opacity-0"}`}
//                     style={{
//                       width: zoom === 100 ? "auto" : `${zoom}%`,
//                       maxWidth: zoom === 100 ? "100%" : "none",
//                       maxHeight: zoom === 100 ? "100%" : "none",
//                       height: "auto",
//                     }}
//                   />
//                 )}
//               </div>

//               {/* Floating Zoom Toolbar */}
//               <div className="absolute bottom-6 right-6 z-40 flex items-center gap-1 rounded-2xl bg-white/90 backdrop-blur-md p-1.5 shadow-lg ring-1 ring-slate-200">
//                 <button
//                   onClick={() => setZoom((p) => Math.max(p - 10, 50))}
//                   disabled={zoom <= 50}
//                   aria-label="Zoom out"
//                   className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors"
//                 >
//                   <ZoomOut size={18} />
//                 </button>
//                 <button
//                   onClick={() => setZoom(100)}
//                   aria-label="Reset zoom"
//                   className="min-w-[60px] rounded-xl px-2 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
//                 >
//                   {zoom}%
//                 </button>
//                 <button
//                   onClick={() => setZoom((p) => Math.min(p + 10, 250))}
//                   disabled={zoom >= 250}
//                   aria-label="Zoom in"
//                   className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors"
//                 >
//                   <ZoomIn size={18} />
//                 </button>
//                 <div className="mx-1 h-6 w-px bg-slate-200" />
//                 <button
//                   onClick={() => setZoom(100)}
//                   aria-label="Fit to screen"
//                   className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
//                 >
//                   <RotateCcw size={18} />
//                 </button>
//                 <button
//                   onClick={toggleFullscreen}
//                   aria-label="Toggle fullscreen"
//                   className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
//                 >
//                   {isFullscreen ? (
//                     <Minimize size={18} />
//                   ) : (
//                     <Maximize size={18} />
//                   )}
//                 </button>
//               </div>
//             </section>

//             {/* Thumbnail Strip */}
//             <nav
//               ref={thumbnailRef}
//               className="relative z-20 flex h-[116px] shrink-0 items-center gap-3 overflow-x-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md px-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300"
//             >
//               {MANUAL_PAGES.map((src, index) => {
//                 const active = currentIndex === index;
//                 return (
//                   <button
//                     key={src}
//                     data-page={index}
//                     onClick={() => goToPage(index)}
//                     aria-label={`Go to page ${index + 1}`}
//                     aria-current={active ? "page" : undefined}
//                     className={`group relative shrink-0 overflow-hidden rounded-lg outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
//                       active
//                         ? "w-[140px] shadow-md ring-2 ring-blue-600"
//                         : "w-[120px] ring-1 ring-slate-200 opacity-60 hover:opacity-100 hover:shadow-sm"
//                     }`}
//                   >
//                     <div className="aspect-video w-full bg-slate-100">
//                       <img
//                         src={src}
//                         alt=""
//                         loading="lazy"
//                         className="pointer-events-none h-full w-full object-contain"
//                       />
//                     </div>
//                     <div
//                       className={`absolute bottom-2 right-2 min-w-[28px] rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold shadow-sm transition-colors ${
//                         active
//                           ? "bg-blue-600 text-white"
//                           : "bg-slate-900/70 text-white"
//                       }`}
//                     >
//                       {index + 1}
//                     </div>
//                   </button>
//                 );
//               })}
//             </nav>
//           </div>
//         ) : (
//           /* GRID VIEW */
//           <div className="flex h-full flex-col overflow-y-auto bg-slate-50/50 p-6 sm:p-8">
//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
//               {MANUAL_PAGES.map((src, index) => (
//                 <button
//                   key={src}
//                   onClick={() => goToPage(index)}
//                   className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 ${
//                     currentIndex === index
//                       ? "border-blue-400 ring-1 ring-blue-400"
//                       : "border-slate-200"
//                   }`}
//                 >
//                   <div className="aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-100">
//                     <img
//                       src={src}
//                       alt={`Page ${index + 1}`}
//                       loading="lazy"
//                       className="pointer-events-none h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
//                     />
//                   </div>
//                   <div className="flex items-center justify-between px-5 py-4">
//                     <div>
//                       <p className="text-sm font-bold text-slate-900">
//                         Page {index + 1}
//                       </p>
//                       <p className="mt-0.5 text-xs font-medium text-slate-500">
//                         Manual segment
//                       </p>
//                     </div>
//                     <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
//                       <ChevronRight size={18} />
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }
import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Monitor,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

const MANUAL_PAGES = [
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ce8d7415-5b18-4404-9f10-693aa35b7437-ChatGPT-Image-Sep-8,-2026,-08_03_12-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/d5a34c5d-8a1e-4fc5-ba43-2cd28c71ffb7-ChatGPT-Image-Sep-8,-2026,-04_38_22-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/d9ecb07a-3eae-4a73-8e63-2b98284c3b9e-ChatGPT-Image-Sep-8,-2026,-04_48_26-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/dba52caa-34b3-4953-85cd-86d30076c927-ChatGPT-Image-Sep-8,-2026,-05_00_06-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/16d60baa-6b58-4460-b30e-0bb752aa9637-ChatGPT-Image-Sep-8,-2026,-05_04_44-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/73d91b89-753f-4efa-b730-897321f76675-ChatGPT-Image-Sep-8,-2026,-05_11_51-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ebe02a87-a899-493e-b480-77f6e7576747-ChatGPT-Image-Sep-8,-2026,-05_16_46-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/c7010189-b27c-4fe3-afad-64a243070d16-ChatGPT-Image-Sep-8,-2026,-05_25_58-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/4ede3c0c-3734-4d7c-94c9-406baa72d8eb-ChatGPT-Image-Sep-8,-2026,-07_42_30-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/1fbcb001-0a80-4bd0-aa11-1aab556916f1-ChatGPT-Image-Sep-8,-2026,-06_54_20-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/ee085e2c-4877-46ae-9381-a93fb876bece-ChatGPT-Image-Sep-8,-2026,-06_55_59-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/6673f477-6a28-4ba0-ad7f-6232fe44c4c3-ChatGPT-Image-Sep-8,-2026,-07_18_10-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/fe636453-604e-4748-ab47-79e8db998962-ChatGPT-Image-Sep-8,-2026,-08_01_07-AM.png",
  "https://productivity-tracker-uploads.s3.eu-north-1.amazonaws.com/5dea7ed9-c487-485e-a0f5-615cbe2bc4ee-ChatGPT-Image-Sep-8,-2026,-07_55_19-AM.png",
];

export default function UserManual() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("slides");
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedPages, setLoadedPages] = useState({});
  const [errorPages, setErrorPages] = useState({});

  const viewerRef = useRef(null);
  const thumbnailRef = useRef(null);
  const totalPages = MANUAL_PAGES.length;

  const goToNext = useCallback(
    () => setCurrentIndex((p) => Math.min(p + 1, totalPages - 1)),
    [totalPages],
  );
  const goToPrev = useCallback(
    () => setCurrentIndex((p) => Math.max(p - 1, 0)),
    [],
  );
  const goToPage = useCallback(
    (index) => {
      if (index >= 0 && index < totalPages) {
        setCurrentIndex(index);
        setViewMode("slides");
      }
    },
    [totalPages],
  );

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPrev();
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen?.();
            setIsFullscreen(false);
          }
          break;
        case "+":
        case "=":
          event.preventDefault();
          setZoom((p) => Math.min(p + 10, 250));
          break;
        case "-":
          event.preventDefault();
          setZoom((p) => Math.max(p - 10, 50));
          break;
        case "0":
          event.preventDefault();
          setZoom(100);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, isFullscreen]);

  // Reset zoom on page change & scroll active thumbnail into view
  useEffect(() => {
    setZoom(100);
    const activeThumbnail = thumbnailRef.current?.querySelector(
      `[data-page="${currentIndex}"]`,
    );
    activeThumbnail?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  // Fullscreen Management
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement)
        await viewerRef.current?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleImageLoad = (index) =>
    setLoadedPages((p) => ({ ...p, [index]: true }));
  const handleImageError = (index) =>
    setErrorPages((p) => ({ ...p, [index]: true }));
  const preventContextMenu = (event) => event.preventDefault();

  return (
    // ISOLATED FIX: w-full and max-w-[calc(100vw-20rem)] tightly contains the component
    <div className="flex w-full max-w-[calc(100vw-20rem)] flex-col gap-6 font-sans text-slate-900 h-[calc(100vh-8rem)] min-h-[600px]">
      {/* HEADER SECTION */}
      <header className="flex shrink-0 flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-md">
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                Productivity Tracker Manual
              </h1>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-300 sm:block" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Documentation
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {viewMode === "slides"
                ? `Viewing Page ${currentIndex + 1} of ${totalPages}`
                : `${totalPages} Total Pages`}
            </p>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1 border border-slate-200/60 shadow-inner">
          <button
            onClick={() => setViewMode("slides")}
            aria-pressed={viewMode === "slides"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              viewMode === "slides"
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Monitor size={16} />
            <span className="hidden sm:inline">Viewer</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              viewMode === "grid"
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Grid3X3 size={16} />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </header>

      {/* VIEWER / GRID AREA */}
      <main
        ref={viewerRef}
        className={`relative flex min-h-0 min-w-0 flex-1 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all ${
          isFullscreen
            ? "h-screen w-screen max-w-none rounded-none border-0 z-50 fixed inset-0"
            : ""
        }`}
      >
        {viewMode === "slides" ? (
          <div className="flex h-full w-full flex-col min-h-0 relative bg-slate-50">
            {/* Viewport */}
            <section
              className="relative z-10 flex min-h-0 flex-1 overflow-auto p-4 sm:p-8"
              onContextMenu={preventContextMenu}
            >
              {/* Navigation Arrows */}
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                aria-label="Previous page"
                className="group absolute left-4 top-1/2 z-40 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-lg ring-1 ring-slate-200 transition-all hover:scale-105 hover:bg-white disabled:opacity-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronLeft
                  size={24}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === totalPages - 1}
                aria-label="Next page"
                className="group absolute right-4 top-1/2 z-40 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-lg ring-1 ring-slate-200 transition-all hover:scale-105 hover:bg-white disabled:opacity-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronRight
                  size={24}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>

              {/* Page Indicator Bubble */}
              <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-lg pointer-events-none">
                Page {currentIndex + 1} of {totalPages}
              </div>

              {/* Document Image Wrapper */}
              <div className="m-auto flex items-center justify-center transition-all duration-200 h-full w-full">
                {/* Loading State */}
                {!loadedPages[currentIndex] && !errorPages[currentIndex] && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
                      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
                      <span className="text-sm font-semibold text-slate-500">
                        Rendering page...
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {errorPages[currentIndex] ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50/90 backdrop-blur px-8 py-6 text-center shadow-sm border border-red-100">
                    <AlertCircle className="text-red-500" size={32} />
                    <p className="text-sm font-semibold text-red-700">
                      Document failed to load
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: zoom === 100 ? "100%" : `${zoom}%`,
                      height: zoom === 100 ? "100%" : "auto",
                    }}
                  >
                    <img
                      key={currentIndex}
                      src={MANUAL_PAGES[currentIndex]}
                      alt={`Manual Page ${currentIndex + 1}`}
                      draggable="false"
                      onLoad={() => handleImageLoad(currentIndex)}
                      onError={() => handleImageError(currentIndex)}
                      className={`block select-none rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5 transition-opacity duration-300 max-w-full max-h-full object-contain ${
                        loadedPages[currentIndex] ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Floating Zoom Toolbar */}
              <div className="absolute bottom-6 right-6 z-40 flex items-center gap-1 rounded-2xl bg-white/90 backdrop-blur-md p-1.5 shadow-lg ring-1 ring-slate-200">
                <button
                  onClick={() => setZoom((p) => Math.max(p - 10, 50))}
                  disabled={zoom <= 50}
                  aria-label="Zoom out"
                  className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  aria-label="Reset zoom"
                  className="min-w-[60px] rounded-xl px-2 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {zoom}%
                </button>
                <button
                  onClick={() => setZoom((p) => Math.min(p + 10, 250))}
                  disabled={zoom >= 250}
                  aria-label="Zoom in"
                  className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-colors"
                >
                  <ZoomIn size={18} />
                </button>
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  onClick={() => setZoom(100)}
                  aria-label="Fit to screen"
                  className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen"
                  className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize size={18} />
                  ) : (
                    <Maximize size={18} />
                  )}
                </button>
              </div>
            </section>

            {/* Thumbnail Strip */}
            <nav
              ref={thumbnailRef}
              className="relative z-20 flex h-[116px] shrink-0 items-center gap-3 overflow-x-auto border-t border-slate-200 bg-white px-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300"
            >
              {MANUAL_PAGES.map((src, index) => {
                const active = currentIndex === index;
                return (
                  <button
                    key={src}
                    data-page={index}
                    onClick={() => goToPage(index)}
                    aria-label={`Go to page ${index + 1}`}
                    aria-current={active ? "page" : undefined}
                    className={`group relative shrink-0 overflow-hidden rounded-lg outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      active
                        ? "w-[140px] shadow-md ring-2 ring-indigo-600"
                        : "w-[120px] ring-1 ring-slate-200 opacity-60 hover:opacity-100 hover:shadow-sm"
                    }`}
                  >
                    <div className="aspect-video w-full bg-slate-50">
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="pointer-events-none h-full w-full object-contain"
                      />
                    </div>
                    <div
                      className={`absolute bottom-2 right-2 min-w-[28px] rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold shadow-sm transition-colors ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900/70 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="flex h-full flex-col overflow-y-auto bg-slate-50 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {MANUAL_PAGES.map((src, index) => (
                <button
                  key={src}
                  onClick={() => goToPage(index)}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4 ${
                    currentIndex === index
                      ? "border-indigo-400 ring-1 ring-indigo-400"
                      : "border-slate-200"
                  }`}
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                    <img
                      src={src}
                      alt={`Page ${index + 1}`}
                      loading="lazy"
                      className="pointer-events-none h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Page {index + 1}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Manual segment
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
