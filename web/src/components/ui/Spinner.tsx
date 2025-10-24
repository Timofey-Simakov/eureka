import { theme } from "../../styles/theme";

interface SpinnerProps {
  size?: number;
  color?: string;
}

export default function Spinner({ size = 24, color = theme.colors.primary[500] }: SpinnerProps) {
  const containerStyle: React.CSSProperties = {
    display: "inline-block",
    width: size,
    height: size,
    border: `3px solid ${theme.colors.neutral[200]}`,
    borderTop: `3px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={containerStyle} />
    </>
  );
}
