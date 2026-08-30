// Indian Rupees, Indian digit grouping.
export const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const compact = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e7) return sign + "₹" + (a / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (a >= 1e5) return sign + "₹" + (a / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  if (a >= 1e3) return sign + "₹" + (a / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return sign + "₹" + Math.round(a);
};

// Signed percent for deltas, e.g. "+4.2%" / "-1.8%".
export const signedPct = (fraction: number) => {
  const p = fraction * 100;
  const s = p > 0 ? "+" : p < 0 ? "" : "";
  return s + p.toFixed(1) + "%";
};
