export default function StatCard({ label, value, tone = "default" }) {
  const theme = {
    default: { text: "text-navy-900", bar: "bg-navy-300" },
    brand: { text: "text-brand-600", bar: "bg-brand-500" },
    success: { text: "text-success-600", bar: "bg-success-500" },
    warning: { text: "text-warning-600", bar: "bg-warning-500" },
  }[tone];

  return (
    <div className="card-hover relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <span className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`} aria-hidden="true" />
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`font-display text-2xl font-bold mt-1.5 ${theme.text}`}>{value}</p>
    </div>
  );
}
