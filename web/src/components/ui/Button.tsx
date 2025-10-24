import { theme } from "../../styles/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(to bottom right, ${theme.colors.primary[500]}, ${theme.colors.primary[600]})`,
    color: "#fff",
    border: "none",
    boxShadow: theme.shadows.md,
  },
  secondary: {
    background: "#fff",
    color: theme.colors.neutral[900],
    border: `1px solid ${theme.colors.neutral[200]}`,
    boxShadow: theme.shadows.sm,
  },
  danger: {
    background: theme.colors.danger[500],
    color: "#fff",
    border: "none",
    boxShadow: theme.shadows.sm,
  },
  ghost: {
    background: "transparent",
    color: theme.colors.neutral[700],
    border: "none",
    boxShadow: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "6px 12px",
    fontSize: theme.fontSize.sm,
    borderRadius: theme.borderRadius.md,
  },
  md: {
    padding: "8px 16px",
    fontSize: theme.fontSize.base,
    borderRadius: theme.borderRadius.lg,
  },
  lg: {
    padding: "12px 24px",
    fontSize: theme.fontSize.lg,
    borderRadius: theme.borderRadius.lg,
  },
};

export default function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  style,
  onFocus,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: theme.transitions.normal,
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled || loading ? 0.6 : 1,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={baseStyle}
      onFocus={(e) => {
        e.currentTarget.blur();
        onFocus?.(e);
      }}
    >
      {loading && <span>⟳</span>}
      {children}
    </button>
  );
}
