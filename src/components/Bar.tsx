export default function Bar({
  value,
  target,
  kind = "target",
  color = "bg-emerald-600",
}: {
  value: number;
  target: number;
  kind?: "min" | "max" | "target";
  color?: string;
}) {
  const ratio = target > 0 ? value / target : 0;
  const pct = Math.min(ratio, 1) * 100;
  let c = color;
  if (kind === "max" && ratio > 1) c = "bg-red-500";
  else if (kind === "target" && ratio > 1.1) c = "bg-amber-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
      <div className={`h-full rounded-full ${c} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
