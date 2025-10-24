import { theme } from "../../styles/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  const containerStyle: React.CSSProperties = {
    textAlign: "center",
    padding: `${theme.spacing["3xl"]}px ${theme.spacing.xl}px`,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: "48px",
    marginBottom: theme.spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.xl,
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      {description && <p style={descriptionStyle}>{description}</p>}
      {action}
    </div>
  );
}
