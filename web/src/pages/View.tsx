import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import MarkdownPreview from "../components/MarkdownPreview";
import Spinner from "../components/ui/Spinner";
import { theme } from "../styles/theme";

export default function View() {
  const { id } = useParams();
  const nav = useNavigate();
  const [body, setBody] = useState("");
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === "undefined") {
      setError("Неверный ID страницы");
      setLoading(false);
      setTimeout(() => nav("/"), 2000);
      return;
    }
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Требуется авторизация");
      setLoading(false);
      setTimeout(() => nav("/login"), 2000);
      return;
    }

    Promise.all([
      api.get(`/api/pages/${id}`),
      api.get("/api/pages")
    ])
      .then(([pageRes, pagesRes]) => {
        setBody(pageRes.data.body);
        setPages(Array.isArray(pagesRes.data) ? pagesRes.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        if (err?.response?.status === 401) {
          setError("Требуется авторизация");
          setTimeout(() => nav("/login"), 2000);
        } else if (err?.response?.status === 404) {
          setError("Страница не найдена");
          setTimeout(() => nav("/"), 2000);
        } else {
          setError("Ошибка загрузки страницы");
          setTimeout(() => nav("/"), 2000);
        }
      });
  }, [id, nav]);

  const containerStyle: React.CSSProperties = {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    background: theme.colors.neutral[50],
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    background: "#fff",
    boxShadow: theme.shadows.lg,
    minHeight: "500px",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <Spinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <div style={{
          fontSize: theme.fontSize.xl,
          color: theme.colors.danger[600],
          marginBottom: theme.spacing.md
        }}>
          ⚠️ {error}
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.neutral[500] }}>
          Перенаправление...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <MarkdownPreview content={body} pages={pages} />
      </div>
    </div>
  );
}
