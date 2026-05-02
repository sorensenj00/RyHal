const listeners = new Set();
let toastCounter = 0;

const defaultDuration = 3500;

const normalizeToast = (toast) => ({
  id: toast.id ?? `toast-${Date.now()}-${toastCounter++}`,
  type: toast.type || 'info',
  title: toast.title || '',
  message: toast.message || '',
  duration: Number.isFinite(toast.duration) ? toast.duration : defaultDuration,
});

export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const pushToast = (toast) => {
  const nextToast = normalizeToast(toast || {});
  listeners.forEach((listener) => {
    listener(nextToast);
  });
  return nextToast.id;
};

export const notifySuccess = (message, options = {}) => pushToast({
  type: 'success',
  message,
  ...options,
});

export const notifyError = (message, options = {}) => pushToast({
  type: 'error',
  message,
  ...options,
});

export const notifyInfo = (message, options = {}) => pushToast({
  type: 'info',
  message,
  ...options,
});

export const notifyWarning = (message, options = {}) => pushToast({
  type: 'warning',
  message,
  ...options,
});
