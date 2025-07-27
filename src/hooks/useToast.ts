import { useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

/**
 * Hook for managing toast notifications with queue support.
 *
 * Business Context: User actions like saving preferences or deleting data
 * need immediate feedback. Multiple toasts can stack for batch operations.
 *
 * User Experience: Automatic cleanup prevents UI clutter while ensuring
 * users see confirmation of their actions.
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = (toast: Omit<ToastProps, 'onClose'>) => {
    const id = crypto.randomUUID();
    const newToast = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Convenience methods for common toast types
  const success = (message: string) => showToast({ message, type: 'success' });
  const error = (message: string) => showToast({ message, type: 'error' });
  const info = (message: string) => showToast({ message, type: 'info' });
  const warning = (message: string) => showToast({ message, type: 'warning' });

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    warning,
  };
};
