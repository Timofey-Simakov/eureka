import { theme } from "../../styles/theme";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  fullWidth = true,
  style,
  ...props
}: InputProps) {
  const inputStyle: React.CSSProperties = {
    width: fullWidth ? "100%" : "auto",
    padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
    fontSize: theme.fontSize.base,
    border: `1px solid ${error ? theme.colors.danger[500] : theme.colors.neutral[200]}`,
    borderRadius: theme.borderRadius.lg,
    outline: "none",
    transition: theme.transitions.fast,
    background: "#fff",
    color: theme.colors.neutral[900],
    boxSizing: "border-box",
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
  };

  const errorStyle: React.CSSProperties = {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.danger[600],
  };

  const helperStyle: React.CSSProperties = {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  };

  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        {...props}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? theme.colors.danger[500]
            : theme.colors.primary[500];
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? theme.colors.danger[500]
            : theme.colors.neutral[200];
        }}
      />
      {error && <div style={errorStyle}>{error}</div>}
      {helperText && !error && <div style={helperStyle}>{helperText}</div>}
    </div>
  );
}
