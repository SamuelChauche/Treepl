import React from "react";
import { C, FONT } from "../../config/theme";

interface SparkProps {
  data: number[];
  color: string;
  h?: number;
  /** Message shown when data is empty */
  emptyLabel?: string;
}

export const Spark: React.FC<SparkProps> = ({ data, color, h = 36, emptyLabel }) => {
  if (data.length === 0) {
    return (
      <div style={{
        height: h, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: C.textTertiary, fontFamily: FONT,
      }}>
        {emptyLabel ?? "No activity yet"}
      </div>
    );
  }
  const mx = Math.max(...data);
  if (mx === 0) {
    return (
      <div style={{
        height: h, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: C.textTertiary, fontFamily: FONT,
      }}>
        {emptyLabel ?? "No activity yet"}
      </div>
    );
  }
  return (
    <div style={{ height: h, display: "flex", alignItems: "flex-end", gap: 2 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v / mx) * 100}%`, borderRadius: 2,
          background: color, opacity: 0.25 + (i / data.length) * 0.75,
        }} />
      ))}
    </div>
  );
};
