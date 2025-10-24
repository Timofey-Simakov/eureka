import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Toolbar from "../components/Toolbar";
import MarkdownPreview from "../components/MarkdownPreview";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import ToastContainer from "../components/ui/ToastContainer";
import { theme } from "../styles/theme";

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const toast = useToast();

  // Undo/redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const debouncedBody = useDebounce(body, 2000);
  const debouncedName = useDebounce(name, 2000);

  // Load page data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/pages/${id}`),
      api.get("/api/pages")
    ])
      .then(([pageRes, pagesRes]) => {
        setName(pageRes.data.name);
        setBody(pageRes.data.body);
        setPages(Array.isArray(pagesRes.data) ? pagesRes.data : []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Ошибка загрузки страницы");
        setLoading(false);
      });
  }, [id]);

  // Auto-save
  useEffect(() => {
    if (!hasChanges || loading) return;
    save(true);
  }, [debouncedBody, debouncedName]);

  // Track changes
  useEffect(() => {
    if (loading) return;
    setHasChanges(true);
  }, [name, body]);

  // Track body changes for undo/redo
  useEffect(() => {
    if (loading || isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Add to history when body changes
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(body);
      // Keep max 50 history entries
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [body]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBody(history[newIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBody(history[newIndex]);
    }
  }, [historyIndex, history]);

  const save = useCallback(
    async (isAutoSave = false) => {
      if (!id) return;
      setSaving(true);
      try {
        await api.put(`/api/pages/${id}`, { name, body });
        setHasChanges(false);
        if (!isAutoSave) {
          toast.success("Сохранено");
        }
      } catch (e) {
        toast.error("Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [id, name, body]
  );

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      // Ctrl+S / Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      // Ctrl+B - Bold
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        wrapText("**", "**");
      }
      // Ctrl+I - Italic
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        wrapText("_", "_");
      }
      // Ctrl+K - Link
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        wrapText("[", "](url)");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [body, save, undo, redo]);

  const wrapText = (prefix: string, suffix: string) => {
    if (!taRef.current) return;
    const { selectionStart: s, selectionEnd: e } = taRef.current;
    const before = body.slice(0, s);
    const sel = body.slice(s, e);
    const after = body.slice(e);
    setBody(before + prefix + sel + suffix + after);
    setTimeout(() => {
      if (taRef.current) {
        taRef.current.focus();
        taRef.current.selectionStart = s + prefix.length;
        taRef.current.selectionEnd = e + prefix.length;
      }
    }, 0);
  };

  const containerStyle: React.CSSProperties = {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    background: theme.colors.neutral[50],
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
    gap: theme.spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  const statusStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  };

  const editorAreaStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: "stretch",
  };

  const textareaStyle: React.CSSProperties = {
    height: "calc(100vh - 350px)",
    padding: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    fontFamily: "monospace",
    border: `1px solid ${theme.colors.neutral[200]}`,
    borderRadius: theme.borderRadius.lg,
    outline: "none",
    resize: "none",
    background: "#fff",
    color: theme.colors.neutral[900],
    boxSizing: "border-box",
    flex: 1,
  };

  const previewStyle: React.CSSProperties = {
    height: "calc(100vh - 350px)",
    padding: theme.spacing.lg,
    border: `1px solid ${theme.colors.neutral[200]}`,
    borderRadius: theme.borderRadius.lg,
    background: "#fff",
    overflowY: "auto",
    flex: 1,
    boxSizing: "border-box",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Редактор</h2>
          <div style={statusStyle}>
            {saving && (
              <>
                <Spinner size={16} />
                <span>Сохранение...</span>
              </>
            )}
            {!saving && hasChanges && <span>Есть несохранённые изменения</span>}
            {!saving && !hasChanges && <span style={{ color: theme.colors.success[600] }}>✓ Сохранено</span>}
          </div>
        </div>

        <div style={{ marginBottom: theme.spacing.lg }}>
          <Input
            placeholder="Название страницы"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Toolbar value={body} onChange={setBody} target={taRef.current} />

        <div style={editorAreaStyle}>
          <textarea
            ref={taRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={textareaStyle}
            placeholder="Начните писать... Используйте [[Название страницы]] для создания ссылок"
          />
          <div style={previewStyle}>
            <MarkdownPreview content={body} pages={pages} />
          </div>
        </div>

        <div style={actionsStyle}>
          <Button variant="primary" onClick={() => save()} loading={saving}>
            💾 Сохранить
          </Button>
          <Button variant="secondary" onClick={() => nav("/")}>
            ← Назад
          </Button>
          <Button variant="secondary" onClick={() => nav(`/view/${id}`)}>
            👁️ Режим чтения
          </Button>
        </div>

        <div style={{ marginTop: theme.spacing.lg, fontSize: theme.fontSize.sm, color: theme.colors.neutral[500] }}>
          <p style={{ margin: 0 }}>
            <strong>Горячие клавиши:</strong> Ctrl+S - сохранить, Ctrl+B - жирный, Ctrl+I - курсив, Ctrl+K - ссылка
          </p>
          <p style={{ margin: theme.spacing.sm + " 0 0 0" }}>
            <strong>Wiki-ссылки:</strong> Используйте <code>[[Название страницы]]</code> для создания ссылок между страницами
          </p>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}
