import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Spinner from "../components/ui/Spinner";
import { theme } from "../styles/theme";

interface Page {
  id: string;
  name: string;
}

export default function Editing() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }

    api
      .get("/api/pages")
      .then((res) => {
        setPages(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        if (err?.response?.status === 401) {
          nav("/login");
        }
      });
  }, [nav]);

  const containerStyle: React.CSSProperties = {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    background: theme.colors.neutral[50],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.xl,
  };

  const listStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  };

  const pageItemStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    background: "#fff",
    boxShadow: theme.shadows.sm,
    textDecoration: "none",
    color: theme.colors.neutral[900],
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
    transition: theme.transitions.normal,
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>✏️ Режим редактирования</h1>
      <div style={listStyle}>
        {pages.length === 0 ? (
          <p style={{ textAlign: "center", color: theme.colors.neutral[500] }}>
            Нет страниц для отображения
          </p>
        ) : (
          pages.filter((page) => page.id).map((page) => (
            <Link
              key={page.id}
              to={`/editor/${page.id}`}
              style={pageItemStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = theme.shadows.md;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = theme.shadows.sm;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "24px" }}>📝</span>
              <span style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.medium }}>
                {page.name}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
