import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";

export const DistributionDonut = ({ data }) => {
  // Richer, slightly brighter hex codes for better contrast
  const COLORS = {
    EMERGENCY: "#ef4444", // Red 500
    IMPORTANT: "#f97316", // Orange 500
    STANDARD: "#4f46e5", // Indigo 600
  };

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col gap-3 mt-4 px-2">
        {payload.map((entry, index) => (
          <li
            key={`item-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-slate-600 font-medium capitalize">
                {entry.value.toLowerCase()}
              </span>
            </div>
            <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              {entry.payload.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="col-span-1 shadow-sm border border-slate-200/75 rounded-2xl bg-white h-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight">
          Priority Distribution
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[340px] flex flex-col items-center justify-center pb-6">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || "#cbd5e1"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(226, 232, 240, 0.6)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                }}
                itemStyle={{ color: "#0f172a", fontWeight: "700" }}
              />
              <Legend content={renderCustomLegend} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            No active tickets to distribute.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
