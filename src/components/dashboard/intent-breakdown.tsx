"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";

interface IntentBreakdownProps {
  buyer: number;
  seller: number;
  investor: number;
  unknown: number;
}

const COLORS = {
  Buyers: "#3b82f6",
  Sellers: "#10b981",
  Investors: "#8b5cf6",
  Unknown: "#d4d4d4",
};

export function IntentBreakdown({
  buyer,
  seller,
  investor,
  unknown,
}: IntentBreakdownProps) {
  const data = [
    { name: "Buyers", value: buyer },
    { name: "Sellers", value: seller },
    { name: "Investors", value: investor },
    { name: "Unknown", value: unknown },
  ].filter((d) => d.value > 0);

  const total = buyer + seller + investor + unknown;

  return (
    <Card>
      <CardTitle>Lead Intent</CardTitle>
      {total === 0 ? (
        <p className="text-sm text-neutral-400 mt-4">No leads yet</p>
      ) : (
        <div className="mt-4 flex items-center gap-6">
          <div className="w-[120px] h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      COLORS[entry.name as keyof typeof COLORS],
                  }}
                />
                <span className="text-xs text-neutral-600">
                  {entry.name}:{" "}
                  <span className="font-medium text-neutral-900">
                    {entry.value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
