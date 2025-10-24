import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ToastContainer from "../components/ui/ToastContainer";
import { theme } from "../styles/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  function validate() {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email обязателен";
    if (!password) newErrors.password = "Пароль обязателен";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await login(email, password);
      toast.success("Успешный вход!");
      nav("/");
    } catch (e: any) {
      toast.error("Ошибка входа. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.colors.neutral[50],
    padding: theme.spacing.lg,
  };

  const cardWrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "400px",
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  };

  const linkStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: theme.spacing.xl,
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  };

  const linkAnchorStyle: React.CSSProperties = {
    color: theme.colors.primary[600],
    textDecoration: "none",
    fontWeight: theme.fontWeight.medium,
  };

  return (
    <>
      <div style={containerStyle}>
        <div style={cardWrapperStyle}>
          <Card>
            <div style={headerStyle}>
              <h2 style={titleStyle}>Вход в Eureka</h2>
              <p style={subtitleStyle}>Добро пожаловать обратно!</p>
            </div>

            <form onSubmit={submit}>
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Войти
              </Button>
            </form>

            <div style={linkStyle}>
              Нет аккаунта?{" "}
              <Link to="/register" style={linkAnchorStyle}>
                Регистрация
              </Link>
            </div>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}