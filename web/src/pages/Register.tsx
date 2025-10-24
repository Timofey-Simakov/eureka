import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ToastContainer from "../components/ui/ToastContainer";
import { theme } from "../styles/theme";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  function validate() {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!email) newErrors.email = "Email обязателен";
    if (!password) newErrors.password = "Пароль обязателен";
    if (password && password.length < 6) newErrors.password = "Минимум 6 символов";
    if (password !== confirmPassword) newErrors.confirmPassword = "Пароли не совпадают";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await register(email, password);
      // Автоматически логиним после регистрации
      await login(email, password);
      toast.success("Регистрация успешна! Добро пожаловать!");
      nav("/");
    } catch (e: any) {
      toast.error("Ошибка регистрации. Email может быть занят.");
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
              <h2 style={titleStyle}>Регистрация</h2>
              <p style={subtitleStyle}>Создайте свой аккаунт</p>
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
                helperText="Минимум 6 символов"
                autoComplete="new-password"
              />

              <Input
                label="Подтверждение пароля"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Создать аккаунт
              </Button>
            </form>

            <div style={linkStyle}>
              Уже есть аккаунт?{" "}
              <Link to="/login" style={linkAnchorStyle}>
                Войти
              </Link>
            </div>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}