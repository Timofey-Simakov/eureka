import { useEffect, useRef } from "react";
import { theme } from "../../styles/theme";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeMap = {
    sm: "400px",
    md: "600px",
    lg: "800px",
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: theme.spacing.lg,
    animation: "fadeIn 0.2s ease-out",
  };

  const modalStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.xl,
    width: "100%",
    maxWidth: sizeMap[size],
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    animation: "slideUp 0.3s ease-out",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: theme.spacing.xs,
    color: theme.colors.neutral[500],
    transition: theme.transitions.fast,
    lineHeight: 1,
  };

  const bodyStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    overflowY: "auto",
    flex: 1,
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.sm,
    justifyContent: "flex-end",
    padding: theme.spacing.lg,
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div ref={overlayRef} style={overlayStyle} onClick={handleOverlayClick}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            <button
              style={closeButtonStyle}
              onClick={onClose}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.neutral[900])}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.neutral[500])}
              onFocus={(e) => e.currentTarget.blur()}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div style={bodyStyle}>{children}</div>
          {footer && <div style={footerStyle}>{footer}</div>}
        </div>
      </div>
    </>
  );
}
