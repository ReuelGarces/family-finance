"use client";

import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { expenseCategories } from "@/components/dashboard/overview-data";

const balanceData = [
  { day: "20 set", balance: 3420 }, { day: "24 set", balance: 3310 },
  { day: "28 set", balance: 3580 }, { day: "02 out", balance: 3515 },
  { day: "06 out", balance: 3720 }, { day: "10 out", balance: 3660 },
  { day: "14 out", balance: 3925 }, { day: "19 out", balance: 4286 },
];
const movementData = [
  { day: "Seg", income: 680, expense: 410 },
  { day: "Ter", income: 520, expense: 570 },
  { day: "Qua", income: 790, expense: 490 },
  { day: "Qui", income: 930, expense: 610 },
  { day: "Sex", income: 610, expense: 720 },
  { day: "Sáb", income: 880, expense: 560 },
  { day: "Dom", income: 1020, expense: 690 },
];
const tooltipStyle = {
  backgroundColor: "#1c1c1e", border: "1px solid #39393c",
  borderRadius: 10, color: "#f4f4f5", fontSize: 11,
};
const axisStyle = { fill: "#909096", fontSize: 10 };

export function CashFlowChart() {
  return (
    <div className="chart-canvas" role="img" aria-label="Gráfico demonstrativo da evolução do saldo">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={balanceData} margin={{ top: 10, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4c4c4" stopOpacity={0.13} />
              <stop offset="100%" stopColor="#c4c4c4" stopOpacity={0.005} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#29292c" strokeDasharray="2 6" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisStyle}
            tickMargin={15} interval="preserveStartEnd" />
          <YAxis hide domain={["dataMin - 180", "dataMax + 120"]} />
          <Tooltip cursor={{ stroke: "#535357", strokeDasharray: "3 4" }}
            contentStyle={tooltipStyle} labelStyle={{ color: "#a4a4aa", marginBottom: 4 }}
            formatter={(value) => formatCurrency(Number(value))} />
          <Area type="monotone" dataKey="balance" name="Saldo" stroke="#c8c8c8"
            strokeWidth={1.8} fill="url(#balanceFill)"
            activeDot={{ r: 4, fill: "#f0f0f0", stroke: "#151515", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MovementChart() {
  return (
    <div className="chart-canvas compact" role="img" aria-label="Gráfico demonstrativo de receitas e despesas">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={movementData} margin={{ top: 7, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#29292c" strokeDasharray="2 6" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisStyle}
            tickMargin={12} interval={1} />
          <YAxis hide />
          <Tooltip contentStyle={tooltipStyle}
            labelStyle={{ color: "#a4a4aa", marginBottom: 4 }}
            formatter={(value) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey="income" name="Receitas" stroke="#d7d7d9"
            strokeWidth={1.8} dot={false}
            activeDot={{ r: 3, fill: "#f0f0f0", stroke: "#151515", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="expense" name="Despesas" stroke="#77777c"
            strokeWidth={1.7} dot={false}
            activeDot={{ r: 3, fill: "#bcbcc0", stroke: "#151515", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart() {
  return (
    <div className="category-chart" role="img" aria-label="Distribuição demonstrativa das despesas por categoria">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={expenseCategories} dataKey="value" nameKey="category"
            innerRadius="56%" outerRadius="82%" paddingAngle={2} stroke="none">
            {expenseCategories.map((entry) => <Cell key={entry.category} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle}
            formatter={(value) => [`${Number(value)}%`, "Distribuição"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

