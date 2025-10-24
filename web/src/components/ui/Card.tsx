import { theme } from "../../styles/theme";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  padding?: keyof typeof theme.spacing;
  style?: React.CSSProperties;
}

export default function Card({ children, title, padding = "lg", style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    padding: theme.spacing[padding],
    ...style,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.lg,
    marginTop: 0,
  };

  return (
    <div style={cardStyle}>
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </div>
  );
}
