export default function StatCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-navy-900",
    brand: "text-brand-600",
    success: "text-success-600",
    warning: "text-warning-600",
  }[tone];

  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`font-display text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}
