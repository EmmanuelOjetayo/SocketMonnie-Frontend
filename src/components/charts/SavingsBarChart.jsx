import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { formatNaira } from "@/utils/format";

export function SavingsBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e6e9f4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9aa1c2" }} />
        <Tooltip
          formatter={(value) => formatNaira(value)}
          contentStyle={{ borderRadius: 12, border: "1px solid #e6e9f4", fontSize: 13 }}
        />
        <Bar dataKey="amount" fill="#5b76e1" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
