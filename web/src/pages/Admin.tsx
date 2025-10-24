import { useEffect, useState } from "react";
import api from "../lib/api";
import Spinner from "../components/ui/Spinner";
import { theme } from "../styles/theme";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Page {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
  updated_at: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "pages">("users");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, pagesRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/pages"),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setPages(Array.isArray(pagesRes.data) ? pagesRes.data : []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Удалить пользователя ${email}? Все его страницы будут удалены.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${id}`);
      await loadData();
    } catch (err) {
      alert("Ошибка при удалении пользователя");
      console.error(err);
    }
  }

  async function deletePage(id: string, name: string) {
    if (!confirm(`Удалить страницу "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/pages/${id}`);
      await loadData();
    } catch (err) {
      alert("Ошибка при удалении страницы");
      console.error(err);
    }
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: theme.spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xl,
    color: theme.colors.neutral[900],
  };

  const tabsStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderBottom: `2px solid ${theme.colors.neutral[200]}`,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: active ? theme.colors.primary[600] : theme.colors.neutral[600],
    borderBottom: active ? `3px solid ${theme.colors.primary[600]}` : "3px solid transparent",
    marginBottom: "-2px",
    transition: theme.transitions.normal,
  });

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#ffffff",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    boxShadow: theme.shadows.md,
  };

  const thStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    textAlign: "left",
    background: theme.colors.neutral[50],
    color: theme.colors.neutral[700],
    fontWeight: theme.fontWeight.semibold,
    borderBottom: `2px solid ${theme.colors.neutral[200]}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.neutral[100]}`,
  };

  const buttonStyle: React.CSSProperties = {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    background: theme.colors.danger[500],
    color: "#ffffff",
    border: "none",
    borderRadius: theme.borderRadius.md,
    cursor: "pointer",
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    transition: theme.transitions.normal,
  };

  const badgeStyle = (role: string): React.CSSProperties => ({
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: role === "adm" ? theme.colors.warning[100] : theme.colors.primary[100],
    color: role === "adm" ? theme.colors.warning[600] : theme.colors.primary[700],
    borderRadius: theme.borderRadius.full,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>⚙️ Панель администратора</h1>

      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === "users")}
          onClick={() => setActiveTab("users")}
          onMouseOver={(e) => {
            if (activeTab !== "users") {
              e.currentTarget.style.color = theme.colors.primary[500];
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== "users") {
              e.currentTarget.style.color = theme.colors.neutral[600];
            }
          }}
        >
          👥 Пользователи ({users.length})
        </button>
        <button
          style={tabStyle(activeTab === "pages")}
          onClick={() => setActiveTab("pages")}
          onMouseOver={(e) => {
            if (activeTab !== "pages") {
              e.currentTarget.style.color = theme.colors.primary[500];
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== "pages") {
              e.currentTarget.style.color = theme.colors.neutral[600];
            }
          }}
        >
          📄 Страницы ({pages.length})
        </button>
      </div>

      {activeTab === "users" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Роль</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <span style={badgeStyle(user.role)}>
                    {user.role === "adm" ? "Админ" : "Пользователь"}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: theme.fontSize.sm, color: theme.colors.neutral[500] }}>
                  {user.id}
                </td>
                <td style={tdStyle}>
                  {user.role !== "adm" && (
                    <button
                      style={buttonStyle}
                      onClick={() => deleteUser(user.id, user.email)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = theme.colors.danger[600];
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = theme.colors.danger[500];
                      }}
                    >
                      🗑️ Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "pages" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Владелец</th>
              <th style={thStyle}>Обновлено</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td style={tdStyle}>{page.name}</td>
                <td style={tdStyle}>{page.owner_email}</td>
                <td style={{ ...tdStyle, fontSize: theme.fontSize.sm, color: theme.colors.neutral[500] }}>
                  {new Date(page.updated_at).toLocaleString("ru-RU")}
                </td>
                <td style={tdStyle}>
                  <button
                    style={buttonStyle}
                    onClick={() => deletePage(page.id, page.name)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = theme.colors.danger[600];
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = theme.colors.danger[500];
                    }}
                  >
                    🗑️ Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
