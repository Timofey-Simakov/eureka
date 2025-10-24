import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { setToken, getUserRole } from "../lib/api";
import { useEffect, useState } from "react";

const styles = {
  container: { maxWidth: 900, margin: "0 auto", padding: 16 },
  nav: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: 16,
    flexWrap: "wrap" as const,
  },
  navLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "8px 14px",
    background: "#ffffff",
    color: "#111827",
    textDecoration: "none",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    outline: "none",
    fontWeight: 500,
  } as React.CSSProperties,
  navLinkActive: {
    background: "linear-gradient(to bottom right, #f0f9ff, #e0f2fe)",
    borderColor: "#bae6fd",
    color: "#0369a1",
    boxShadow: "0 2px 8px rgba(14,165,233,0.15), 0 1px 3px rgba(0,0,0,0.08)",
  } as React.CSSProperties,
  btnLogout: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "8px 14px",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    outline: "none",
    fontWeight: 500,
  } as React.CSSProperties,
  outlet: {
    borderRadius: 16,
    padding: 16,
    background: "#fafafa",
  },
};

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setAuthed(!!localStorage.getItem("token"));
    setIsAdmin(getUserRole() === "adm");
  }, [loc.pathname]);

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setAuthed(false);
    nav("/login");
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <Link
          to="/"
          style={{
            ...styles.navLink,
            ...(loc.pathname === "/" ? styles.navLinkActive : {}),
          }}
          onFocus={(e) => e.currentTarget.blur()}
        >
          <span aria-hidden>⌂</span> Домой
        </Link>
        <Link
          to="/reading"
          style={{
            ...styles.navLink,
            ...(loc.pathname.startsWith("/reading") ? styles.navLinkActive : {}),
          }}
          onFocus={(e) => e.currentTarget.blur()}
        >
          <span aria-hidden>📖</span> Чтение
        </Link>
        <Link
          to="/editing"
          style={{
            ...styles.navLink,
            ...(loc.pathname.startsWith("/editing") ? styles.navLinkActive : {}),
          }}
          onFocus={(e) => e.currentTarget.blur()}
        >
          <span aria-hidden>✏️</span> Редактирование
        </Link>
        <Link
          to="/graph"
          style={{
            ...styles.navLink,
            ...(loc.pathname.startsWith("/graph") ? styles.navLinkActive : {}),
          }}
          onFocus={(e) => e.currentTarget.blur()}
        >
          <span aria-hidden>◎</span> Граф
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            style={{
              ...styles.navLink,
              ...(loc.pathname.startsWith("/admin") ? styles.navLinkActive : {}),
            }}
            onFocus={(e) => e.currentTarget.blur()}
          >
            <span aria-hidden>⚙️</span> Админ
          </Link>
        )}
        {!authed ? (
          <Link
            to="/login"
            style={{
              ...styles.navLink,
              ...(loc.pathname.startsWith("/login") ? styles.navLinkActive : {}),
            }}
            onFocus={(e) => e.currentTarget.blur()}
          >
            <span aria-hidden>⤶</span> Логин
          </Link>
        ) : (
          <button style={styles.btnLogout} onClick={logout} onFocus={(e) => e.currentTarget.blur()}>
            <span aria-hidden>⎋</span> Выйти
          </button>
        )}
      </nav>
      <div style={styles.outlet}>
        <Outlet />
      </div>
    </div>
  );
}