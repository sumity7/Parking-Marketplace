const STYLES = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
  confirmed: "badge-success",
  cancelled: "badge-danger",
  completed: "badge-info",
  paid: "badge-success",
  unpaid: "badge-warning",
};

export default function StatusBadge({ status }) {
  return <span className={STYLES[status] || "badge-neutral"}>{status}</span>;
}
