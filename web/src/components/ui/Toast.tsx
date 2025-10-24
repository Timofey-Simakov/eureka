import { useEffect } from "react";
import { theme } from "../../styles/theme";

export type ToastType = "success" | "error" | "info" | "warning";
export type { ToastType as ToastMessageType };

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const typeStyles: Record<ToastType, React.CSSProperties> = {
  success: {
    background: theme.colors.success[50],
    border: `1px solid ${theme.colors.success[500]}`,
    color: theme.colors.success[700],
  },
  error: {
    background: theme.colors.danger[50],
    border: `1px solid ${theme.colors.danger[500]}`,
    color: theme.colors.danger[700],
  },
  warning: {
    background: theme.colors.warning[50],
    border: `1px solid ${theme.colors.warning[500]}`,
    color: theme.colors.warning[600],
  },
  info: {
    background: theme.colors.primary[50],
    border: `1px solid ${theme.colors.primary[500]}`,
    color: theme.colors.primary[700],
  },
};

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export default function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const toastStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    marginBottom: theme.spacing.sm,
    minWidth: "300px",
    maxWidth: "500px",
    animation: "slideIn 0.3s ease-out",
    ...typeStyles[type],
  };

  const iconStyle: React.CSSProperties = {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  };

  const messageStyle: React.CSSProperties = {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  };

  const closeStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontSize: theme.fontSize.lg,
    opacity: 0.6,
    transition: theme.transitions.fast,
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={toastStyle}>
        <span style={iconStyle}>{icons[type]}</span>
        <span style={messageStyle}>{message}</span>
        <button
          style={closeStyle}
          onClick={() => onClose(id)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          onFocus={(e) => e.currentTarget.blur()}
        >
          ✕
        </button>
      </div>
    </>
  );
}
