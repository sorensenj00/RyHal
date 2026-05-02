import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { pushToast, subscribeToToasts } from './toastBus';
import './Toast.css';

const ToastContext = createContext({
  notify: pushToast,
});

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
    });

    return unsubscribe;
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const contextValue = useMemo(() => ({
    notify: pushToast,
  }), []);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose(toast.id);
    }, toast.duration);

    return () => window.clearTimeout(timeoutId);
  }, [toast.duration, toast.id, onClose]);

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <div className="toast-content">
        {toast.title ? <strong className="toast-title">{toast.title}</strong> : null}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Luk notifikation"
        onClick={() => onClose(toast.id)}
      >
        ×
      </button>
      <span
        className="toast-progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
