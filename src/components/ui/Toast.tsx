import { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast notification component using DaisyUI alert classes.
 *
 * Features:
 * - Auto-dismiss after specified duration (default 4 seconds)
 * - Manual dismiss via close button
 * - Semantic colors for different message types
 * - Accessible with proper ARIA roles
 *
 * User Experience: Provides immediate feedback for user actions without
 * disrupting workflow. Positioned to avoid blocking critical UI elements.
 */
export const Toast = ({
  message,
  type,
  duration = 4000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Handle manual dismiss
  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  // Map toast types to DaisyUI alert classes
  const alertClasses = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning',
  };

  // Icons for different toast types
  const icons = {
    success: <FaCheckCircle className="shrink-0 h-6 w-6" />,
    error: <FaTimesCircle className="shrink-0 h-6 w-6" />,
    info: <FaInfoCircle className="shrink-0 h-6 w-6" />,
    warning: <FaExclamationTriangle className="shrink-0 h-6 w-6" />,
  };

  return (
    <div className={`alert ${alertClasses[type]} shadow-lg mb-4`} role="alert">
      {icons[type]}
      <span>{message}</span>
      <div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
