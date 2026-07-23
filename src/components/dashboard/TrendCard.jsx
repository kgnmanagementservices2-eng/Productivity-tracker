/* eslint-disable no-unused-vars */
import { Card, CardContent } from "../common/Card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

export const TrendCard = ({
  title,
  value,
  icon: Icon,
  trend,
  isPositive,
  onClick,
  theme = "indigo", // Default theme
}) => {
  // Dictionary of semantic color themes for the FULL card
  const themes = {
    indigo: {
      cardBg: "bg-indigo-50/50",
      borderTop: "border-t-indigo-500",
      iconBg: "bg-indigo-100/80",
      iconText: "text-indigo-600",
      hoverBorder: "hover:border-indigo-300",
      hoverShadow: "hover:shadow-indigo-500/15",
      hoverBg: "hover:bg-indigo-50",
    },
    amber: {
      cardBg: "bg-amber-50/50",
      borderTop: "border-t-amber-500",
      iconBg: "bg-amber-100/80",
      iconText: "text-amber-600",
      hoverBorder: "hover:border-amber-300",
      hoverShadow: "hover:shadow-amber-500/15",
      hoverBg: "hover:bg-amber-50",
    },
    blue: {
      cardBg: "bg-blue-50/50",
      borderTop: "border-t-blue-500",
      iconBg: "bg-blue-100/80",
      iconText: "text-blue-600",
      hoverBorder: "hover:border-blue-300",
      hoverShadow: "hover:shadow-blue-500/15",
      hoverBg: "hover:bg-blue-50",
    },
    emerald: {
      cardBg: "bg-emerald-50/50",
      borderTop: "border-t-emerald-500",
      iconBg: "bg-emerald-100/80",
      iconText: "text-emerald-600",
      hoverBorder: "hover:border-emerald-300",
      hoverShadow: "hover:shadow-emerald-500/15",
      hoverBg: "hover:bg-emerald-50",
    },
    rose: {
      cardBg: "bg-rose-50/50",
      borderTop: "border-t-rose-500",
      iconBg: "bg-rose-100/80",
      iconText: "text-rose-600",
      hoverBorder: "hover:border-rose-300",
      hoverShadow: "hover:shadow-rose-500/15",
      hoverBg: "hover:bg-rose-50",
    },
  };

  const activeTheme = themes[theme] || themes.indigo;

  return (
    <Card
      // Applied the full card background and removed bg-white
      className={`relative overflow-hidden shadow-sm border-x border-b border-t-4 border-slate-200/75 rounded-2xl group ${activeTheme.cardBg} ${activeTheme.borderTop} ${
        onClick
          ? `cursor-pointer hover:-translate-y-0.5 transition-all duration-300 ease-out ${activeTheme.hoverBorder} ${activeTheme.hoverShadow} ${activeTheme.hoverBg}`
          : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-6">
          <div
            className={`p-2.5 rounded-xl ring-1 ring-slate-900/5 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ${activeTheme.iconBg} ${activeTheme.iconText}`}
          >
            <Icon size={22} strokeWidth={2} />
          </div>

          <div
            className="text-slate-400 hover:text-slate-600 cursor-help transition-colors"
            title="Additional info"
          >
            <Info size={18} />
          </div>
        </div>

        {/* Data Area */}
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-1.5 tracking-tight">
            {title}
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </h3>

            {/* The Green/Red Trend Indicator */}
            {trend && (
              <span
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-white/80 shadow-sm backdrop-blur-sm ${
                  isPositive
                    ? "text-emerald-700 border-emerald-200"
                    : "text-rose-700 border-rose-200"
                }`}
              >
                {isPositive ? (
                  <TrendingUp size={14} strokeWidth={2.5} />
                ) : (
                  <TrendingDown size={14} strokeWidth={2.5} />
                )}
                {trend}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
