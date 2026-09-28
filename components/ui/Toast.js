"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

const STYLES = {
  success: "bg-navy-900 border-success-500",
  error: "bg-navy-900 border-danger-500",
  info: "bg-navy-900 border-brand-500",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info") => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm w-full sm:w-auto text-white text-sm font-medium rounded-lg border-l-4 px-4 py-3 shadow-lifted ${STYLES[t.type] || STYLES.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Returns a `toast(message, type)` function. Falls back to a no-op if used
// outside the provider so it never crashes a page that forgets to wrap it.
export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}
