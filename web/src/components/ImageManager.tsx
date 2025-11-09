import { useState, useEffect } from "react";
import api from "../lib/api";
import { useToast } from "../hooks/useToast";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Spinner from "./ui/Spinner";
import Input from "./ui/Input";
import { theme } from "../styles/theme";

type Image = {
  id: string;
  name: string;
  mime: string;
  size_bytes: number;
  created_at: string;
};

type ImageManagerProps = {
  pageId: string;
  onInsert: (imageId: string, imageName: string) => void;
};

export default function ImageManager({ pageId, onInsert }: ImageManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (isOpen && pageId) {
      loadImages();
    }
  }, [isOpen, pageId]);

  async function loadImages() {
    setLoading(true);
    try {
      const response = await api.get(`/api/pages/${pageId}/images`);
      setImages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load images:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }

    setSelectedFile(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setImageName(nameWithoutExt);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Выберите файл");
      return;
    }

    if (!imageName.trim()) {
      toast.error("Введите название изображения");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const extension = selectedFile.name.split(".").pop();
      const fullName = extension ? `${imageName.trim()}.${extension}` : imageName.trim();

      const renamedFile = new File([selectedFile], fullName, { type: selectedFile.type });
      formData.append("file", renamedFile);

      await api.post(`/api/pages/${pageId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Изображение загружено");
      setSelectedFile(null);
      setImageName("");
      await loadImages();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Ошибка загрузки изображения");
    } finally {
      setUploading(false);
    }
  }

  function handleInsert(image: Image) {
    onInsert(image.id, image.name);
    setIsOpen(false);
    toast.success("Изображение вставлено");
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    maxHeight: "70vh",
  };

  const uploadSectionStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    background: theme.colors.neutral[50],
    border: `2px dashed ${theme.colors.neutral[300]}`,
  };

  const uploadFormStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  };

  const fileInputContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  };

  const listSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    overflowY: "auto",
    maxHeight: "400px",
  };

  const imageItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    background: "#fff",
    border: `1px solid ${theme.colors.neutral[200]}`,
    transition: "all 0.2s",
  };

  const imageInfoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  };

  const thumbnailStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    borderRadius: theme.borderRadius.sm,
    objectFit: "cover",
    border: `1px solid ${theme.colors.neutral[300]}`,
  };

  const imageDetailsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.xs,
  };

  const imageNameStyle: React.CSSProperties = {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    fontSize: theme.fontSize.base,
  };

  const imageMetaStyle: React.CSSProperties = {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: theme.spacing.xl,
    color: theme.colors.neutral[500],
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        🖼️ Изображение
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Управление изображениями"
      >
        <div style={containerStyle}>
          {/* Upload Section */}
          <div style={uploadSectionStyle}>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md }}>
              Загрузить новое изображение
            </h3>
            <div style={uploadFormStyle}>
              <div style={fileInputContainerStyle}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ flex: 1 }}
                />
                {selectedFile && (
                  <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.neutral[600] }}>
                    {formatSize(selectedFile.size)}
                  </span>
                )}
              </div>

              {selectedFile && (
                <>
                  <Input
                    label="Название изображения"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    placeholder="Введите название..."
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleUpload}
                    loading={uploading}
                    disabled={!imageName.trim()}
                  >
                    Загрузить
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Images List */}
          <div>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md }}>
              Загруженные изображения
            </h3>

            {loading ? (
              <div style={{ textAlign: "center", padding: theme.spacing.xl }}>
                <Spinner size={32} />
              </div>
            ) : images.length === 0 ? (
              <div style={emptyStateStyle}>
                📷 Изображения пока не загружены
              </div>
            ) : (
              <div style={listSectionStyle}>
                {images.map((image) => (
                  <div
                    key={image.id}
                    style={imageItemStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                      e.currentTarget.style.borderColor = theme.colors.primary[300];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = theme.colors.neutral[200];
                    }}
                  >
                    <div style={imageInfoStyle}>
                      <img
                        src={`${api.defaults.baseURL}/api/images/${image.id}`}
                        alt={image.name}
                        style={thumbnailStyle}
                      />
                      <div style={imageDetailsStyle}>
                        <div style={imageNameStyle}>{image.name}</div>
                        <div style={imageMetaStyle}>
                          {formatSize(image.size_bytes)} • {new Date(image.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleInsert(image)}
                    >
                      Вставить
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
