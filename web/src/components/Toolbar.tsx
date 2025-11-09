import Button from "./ui/Button";
import ImageManager from "./ImageManager";
import { theme } from "../styles/theme";

type Props = {
  value: string;
  onChange: (v: string) => void;
  target?: HTMLTextAreaElement | null;
  pageId?: string;
};

export default function Toolbar({ value, onChange, target, pageId }: Props) {
  function wrap(prefix: string, suffix = prefix) {
    if (!target) return;
    const { selectionStart: s, selectionEnd: e } = target;
    const before = value.slice(0, s);
    const sel = value.slice(s, e);
    const after = value.slice(e);

    const beforePrefix = value.slice(s - prefix.length, s);
    const afterSuffix = value.slice(e, e + suffix.length);

    if (beforePrefix === prefix && afterSuffix === suffix) {
      const newBefore = value.slice(0, s - prefix.length);
      const newAfter = value.slice(e + suffix.length);
      onChange(newBefore + sel + newAfter);
      setTimeout(() => {
        if (target) {
          target.focus();
          target.selectionStart = s - prefix.length;
          target.selectionEnd = e - prefix.length;
        }
      }, 0);
    } else {
      onChange(before + prefix + sel + suffix + after);
      setTimeout(() => {
        if (target) {
          target.focus();
          target.selectionStart = s + prefix.length;
          target.selectionEnd = e + prefix.length;
        }
      }, 0);
    }
  }

  function insertAtCursor(text: string) {
    if (!target) {
      onChange(value + text);
      return;
    }
    const { selectionStart: s } = target;
    const before = value.slice(0, s);
    const after = value.slice(s);
    onChange(before + text + after);
    setTimeout(() => {
      if (target) {
        target.focus();
        target.selectionStart = s + text.length;
        target.selectionEnd = s + text.length;
      }
    }, 0);
  }

  function handleImageInsert(imageId: string, imageName: string) {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8081";
    const imageUrl = `${baseURL}/api/images/${imageId}`;
    const markdown = `![${imageName}](${imageUrl})`;
    insertAtCursor(markdown);
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.sm,
    margin: `${theme.spacing.md}px 0`,
    padding: theme.spacing.md,
    background: "#fff",
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.sm,
    flexWrap: "wrap",
  };

  const groupStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.xs,
  };

  const dividerStyle: React.CSSProperties = {
    width: "1px",
    background: theme.colors.neutral[200],
    margin: `0 ${theme.spacing.xs}px`,
  };

  return (
    <div style={containerStyle}>
      <div style={groupStyle}>
        <Button size="sm" variant="ghost" onClick={() => wrap("**")} title="Жирный (Ctrl+B)">
          <strong>B</strong>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => wrap("_")} title="Курсив (Ctrl+I)">
          <em>I</em>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => wrap("~~")} title="Зачёркнутый">
          <s>S</s>
        </Button>
      </div>

      <div style={dividerStyle} />

      <div style={groupStyle}>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n# ")} title="Заголовок 1">
          H1
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n## ")} title="Заголовок 2">
          H2
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n### ")} title="Заголовок 3">
          H3
        </Button>
      </div>

      <div style={dividerStyle} />

      <div style={groupStyle}>
        <Button size="sm" variant="ghost" onClick={() => wrap("`")} title="Код">
          {"</>"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n```\n\n```")} title="Блок кода">
          {"{ }"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => wrap("[", "](url)")} title="Ссылка (Ctrl+K)">
          🔗
        </Button>
        {pageId && <ImageManager pageId={pageId} onInsert={handleImageInsert} />}
      </div>

      <div style={dividerStyle} />

      <div style={groupStyle}>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n- ")} title="Список">
          •
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n1. ")} title="Нумерованный список">
          1.
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n> ")} title="Цитата">
          "
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAtCursor("\n\n---\n\n")} title="Разделитель">
          —
        </Button>
      </div>
    </div>
  );
}
