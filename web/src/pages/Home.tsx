import { useEffect, useMemo, useRef, useState } from "react";
import api, { setToken } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import ToastContainer from "../components/ui/ToastContainer";
import Modal from "../components/ui/Modal";
import { theme } from "../styles/theme";

type PageRow = { p_id?: string; id?: string; name: string; owner_email?: string; updated_at: string; owner_id?: string };
type GraphRow = { node_id: string; node_name: string; edge_from: string; edge_to: string; tag?: { String: string; Valid: boolean } };

const styles = {
  container: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, background: theme.colors.neutral[50] },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.xl, flexWrap: "wrap" as const, gap: theme.spacing.md },
  title: { fontSize: theme.fontSize["2xl"], fontWeight: theme.fontWeight.bold, color: theme.colors.neutral[900], margin: 0 },
  sectionCard: { padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, background: "#fff", boxShadow: theme.shadows.lg, marginBottom: theme.spacing.xl },
  chipLink: {
    display: "inline-block", border: `1px solid ${theme.colors.neutral[200]}`, borderRadius: theme.borderRadius.lg, padding: "6px 12px",
    textDecoration: "none", color: theme.colors.neutral[900], background: "#fff", boxShadow: theme.shadows.sm, outline: "none",
    fontWeight: theme.fontWeight.medium, transition: theme.transitions.fast,
  } as React.CSSProperties,
  searchBar: { marginBottom: theme.spacing.lg, maxWidth: "100%", overflow: "hidden" },
  pageItem: { marginBottom: theme.spacing.md, display: "flex", alignItems: "center", gap: theme.spacing.sm },
};

export default function Home() {
  const nav = useNavigate();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [graph, setGraph] = useState<GraphRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const toast = useToast();

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, g] = await Promise.all([
        api.get("/api/pages"),
        api.get("/api/graph"),
      ]);
      setPages(Array.isArray(p.data) ? p.data : []);
      setGraph(Array.isArray(g.data) ? g.data : []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        nav("/login");
        return;
      }
      toast.error("Ошибка загрузки данных");
      setPages([]);
      setGraph([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    if (!debouncedSearch) return pages;
    const query = debouncedSearch.toLowerCase();
    return pages.filter((p) => p.name.toLowerCase().includes(query));
  }, [pages, debouncedSearch]);

  const openCreateModal = () => {
    setNewPageName("");
    setIsCreateModalOpen(true);
  };

  const createPage = async () => {
    if (!newPageName.trim()) {
      toast.warning("Введите название страницы");
      return;
    }
    setCreating(true);
    try {
      await api.post("/api/pages", { name: newPageName, body: "" });
      toast.success("Страница создана");
      setIsCreateModalOpen(false);
      setNewPageName("");
      refresh();
    } catch {
      toast.error("Ошибка создания страницы");
    } finally {
      setCreating(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Удалить страницу?")) return;
    try {
      await api.delete(`/api/pages/${id}`);
      toast.success("Страница удалена");
      refresh();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Мои страницы</h2>
          <Button variant="primary" onClick={openCreateModal} onFocus={(e)=>e.currentTarget.blur()}>
            <span aria-hidden>＋</span>
            Создать страницу
          </Button>
        </div>

        <section style={styles.sectionCard}>
          <div style={styles.searchBar}>
            <Input
              placeholder="🔍 Поиск страниц..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: theme.spacing.xl }}>
              <Spinner size={32} />
            </div>
          ) : filteredPages.length === 0 ? (
            <EmptyState
              icon={searchQuery ? "🔍" : "📝"}
              title={searchQuery ? "Ничего не найдено" : "Нет страниц"}
              description={searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : "Создайте свою первую страницу"}
              action={!searchQuery ? <Button variant="primary" onClick={openCreateModal}>Создать страницу</Button> : undefined}
            />
          ) : (
            <ul style={{ paddingLeft: 0, marginTop: theme.spacing.md, listStyle: "none" }}>
              {filteredPages.map((p) => {
                const id = p.p_id || p.id!;
                return (
                  <li key={id} style={styles.pageItem}>
                    <Link
                      to={`/view/${id}`}
                      style={styles.chipLink}
                      onFocus={(e) => e.currentTarget.blur()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.primary[500];
                        e.currentTarget.style.background = theme.colors.primary[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.neutral[200];
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      📄 {p.name}
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePage(id)}
                      onFocus={(e)=>e.currentTarget.blur()}
                      title="Удалить страницу"
                      style={{ color: theme.colors.danger[600] }}
                    >
                      Удалить
                    </Button>
                    {p.owner_email && <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.neutral[500] }}>· {p.owner_email}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 style={{ fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold, marginBottom: theme.spacing.md }}>Граф связей</h3>
          <GraphView rows={graph} />
        </section>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать новую страницу"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={createPage} loading={creating}>
              Создать
            </Button>
          </>
        }
      >
        <Input
          label="Название страницы"
          placeholder="Моя новая страница"
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !creating) {
              createPage();
            }
          }}
          autoFocus
        />
      </Modal>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}

function GraphView({ rows }: { rows: GraphRow[] }) {
  const ref = useRef<SVGSVGElement | null>(null);

  const { nodes, links } = useMemo(() => {
    type NodeDatum = { id: string; name: string; x?: number; y?: number; outgoingLinks: number };
    const nodeMap = new Map<string, NodeDatum>();
    const edges: { source: string; target: string; tag?: string }[] = [];

    for (const r of rows) {
      if (!nodeMap.has(r.node_id)) {
        nodeMap.set(r.node_id, {
          id: r.node_id,
          name: r.node_name,
          x: 480 + Math.random() * 100,
          y: 210 + Math.random() * 100,
          outgoingLinks: 0
        });
      }
      if (r.edge_from && r.edge_to) {
        edges.push({ source: r.edge_from, target: r.edge_to, tag: r.tag?.Valid ? r.tag.String : undefined });
      }
    }

    const seen = new Set<string>();
    const uniq = edges.filter((e) => { const k = `${e.source}->${e.target}:${e.tag || ""}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const have = new Set(nodeMap.keys());
    const filtered = uniq.filter((e) => have.has(e.source) && have.has(e.target));

    filtered.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      if (sourceNode) {
        sourceNode.outgoingLinks += 1;
      }
    });

    return { nodes: Array.from(nodeMap.values()), links: filtered };
  }, [rows]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 960, height = 420;
    svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();

    if (nodes.length === 0) {
      svg.append("text").attr("x", 16).attr("y", 24).text("граф пуст").attr("fill", theme.colors.neutral[500]);
      return;
    }

    const defs = svg.append("defs");

    defs.append("marker")
      .attr("id", "arrowhead-small")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[300]);

    defs.append("marker")
      .attr("id", "arrowhead-medium")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 35)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[300]);

    defs.append("marker")
      .attr("id", "arrowhead-large")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 45)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[300]);

    const sim = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").selectAll("line")
      .data(links).enter().append("line")
      .attr("stroke", theme.colors.neutral[200])
      .attr("stroke-width", 2)
      .attr("marker-end", (d: any) => {
        const targetNode = nodes.find(n => n.id === d.target.id || n.id === d.target);
        if (!targetNode) return "url(#arrowhead-small)";
        const radius = Math.min(20 + targetNode.outgoingLinks * 5, 40);
        if (radius <= 25) return "url(#arrowhead-small)";
        if (radius <= 35) return "url(#arrowhead-medium)";
        return "url(#arrowhead-large)";
      });

    const node = svg.append("g").selectAll<SVGGElement, any>("g")
      .data(nodes).enter().append("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); (d as any).fx = (d as any).x ?? width / 2; (d as any).fy = (d as any).y ?? height / 2; })
        .on("drag", (event, d) => { (d as any).fx = event.x; (d as any).fy = event.y; })
        .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); (d as any).fx = null; (d as any).fy = null; })
      );

    node.append("circle")
      .attr("r", (d: any) => Math.min(20 + d.outgoingLinks * 5, 40))
      .attr("fill", "#ffffff")
      .attr("stroke", theme.colors.primary[500])
      .attr("stroke-width", 2.5);

    node.append("text")
      .text((d: any) => d.name)
      .attr("font-size", 13)
      .attr("font-weight", theme.fontWeight.semibold)
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", theme.colors.neutral[700]);

    sim.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x ?? 0).attr("y1", (d: any) => d.source.y ?? 0).attr("x2", (d: any) => d.target.x ?? 0).attr("y2", (d: any) => d.target.y ?? 0);
      node.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, [nodes, links]);

  return (
    <div style={styles.sectionCard}>
      <svg ref={ref} width="100%" height="420" />
    </div>
  );
}
