import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../common/Card";

export const AnalyticsBarChart = ({ data }) => {
  // Premium Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200/60 shadow-xl rounded-xl text-sm min-w-[180px]">
          <p className="font-bold text-slate-900 mb-3 tracking-tight border-b border-slate-100 pb-2">
            {label} 2026
          </p>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex justify-between items-center gap-6 mb-2 last:mb-0"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{
                    backgroundColor:
                      entry.color === "url(#colorCreated)"
                        ? "#4f46e5"
                        : entry.color,
                  }}
                />
                <span className="text-slate-500 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full w-full rounded-2xl shadow-sm border border-slate-200/75 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
        <div>
          <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight">
            Ticket Volume Analytics
          </CardTitle>
          <p className="text-sm font-medium text-slate-500 mt-1">
            6-Month Trailing (Created vs. Resolved)
          </p>
        </div>
      </CardHeader>

      <CardContent className="h-[340px] px-2 pb-6">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                dy={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc", opacity: 0.6 }}
                content={<CustomTooltip />}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#475569",
                  paddingTop: "20px",
                }}
              />

              <Bar
                dataKey="total_created"
                name="Tickets Created"
                fill="url(#colorCreated)"
                radius={[6, 6, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="total_resolved"
                name="Tickets Resolved"
                fill="#cbd5e1"
                radius={[6, 6, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium">
            Not enough data to generate chart.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
