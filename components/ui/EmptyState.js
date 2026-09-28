export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-navy-50 text-navy-400 flex items-center justify-center">
        {icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
          </svg>
        )}
      </div>
      <p className="font-display font-semibold text-navy-800">{title}</p>
      {message && <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
