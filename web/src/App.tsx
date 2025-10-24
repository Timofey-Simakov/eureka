import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function NavLinkBtn({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`
        inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border
        text-gray-900 no-underline cursor-pointer font-medium outline-none
        transition-all duration-200 ease-in-out
        ${active
          ? 'bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200 text-sky-700 shadow-[0_2px_8px_rgba(14,165,233,0.15),0_1px_3px_rgba(0,0,0,0.08)]'
          : 'bg-white border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-slate-50 hover:border-gray-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
        }
      `}
      onMouseDown={(e) => e.preventDefault()}
      onFocus={(e) => e.currentTarget.blur()}
    >
      {children}
    </Link>
  );
}

function NavActionBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-gray-200
        bg-white text-gray-900 cursor-pointer font-medium outline-none
        shadow-[0_1px_2px_rgba(0,0,0,0.06)]
        hover:bg-red-50 hover:border-red-200 hover:text-red-600
        transition-all duration-200 ease-in-out
      "
      onMouseDown={(e) => e.preventDefault()}
      onFocus={(e) => e.currentTarget.blur()}
    >
      {children}
    </button>
  );
}

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!localStorage.getItem("token"));
  }, [loc.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    nav("/login");
  };

  return (
    <div className="p-4">
      <nav className="flex items-center gap-2 p-2 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] mb-4 flex-wrap">
        <NavLinkBtn to="/" active={loc.pathname === "/"}>
          <span aria-hidden>⌂</span> Домой
        </NavLinkBtn>
        <NavLinkBtn to="/reading" active={loc.pathname.startsWith("/reading")}>
          <span aria-hidden>📖</span> Чтение
        </NavLinkBtn>
        <NavLinkBtn to="/editing" active={loc.pathname.startsWith("/editing")}>
          <span aria-hidden>✏️</span> Редактирование
        </NavLinkBtn>
        <NavLinkBtn to="/graph" active={loc.pathname.startsWith("/graph")}>
          <span aria-hidden>◎</span> Граф
        </NavLinkBtn>
        {!authed ? (
          <NavLinkBtn to="/login" active={loc.pathname.startsWith("/login")}>
            <span aria-hidden>⤶</span> Логин
          </NavLinkBtn>
        ) : (
          <NavActionBtn onClick={logout}>
            <span aria-hidden>⎋</span> Выйти
          </NavActionBtn>
        )}
      </nav>

      <div className="p-4 rounded-2xl bg-[#fafafa]">
        <Outlet />
      </div>
    </div>
  );
}