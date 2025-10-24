import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import * as d3 from "d3";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import { theme } from "../styles/theme";

type GraphRow = { node_id: string; node_name: string; edge_from: string; edge_to: string; tag?: { String: string; Valid: boolean } };

export default function Graph() {
  const [graph, setGraph] = useState<GraphRow[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    api
      .get("/api/graph")
      .then((r) => {
        setGraph(Array.isArray(r.data) ? r.data : []);
        setLoading(false);
      })
      .catch(() => {
        setGraph([]);
        setLoading(false);
      });
  }, []);

  const containerStyle: React.CSSProperties = {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    background: theme.colors.neutral[50],
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
    flexWrap: "wrap",
    gap: theme.spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Граф связей</h2>
        <Button variant="secondary" onClick={() => nav("/")}>
          ← Назад
        </Button>
      </div>
      <GraphView rows={graph} />
    </div>
  );
}

function GraphView({ rows }: { rows: GraphRow[] }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const nav = useNavigate();

  const { nodes, links } = useMemo(() => {
    type NodeDatum = { id: string; name: string; x?: number; y?: number; outgoingLinks: number };
    const nodeMap = new Map<string, NodeDatum>();
    const edges: { source: string; target: string; tag?: string }[] = [];

    for (const r of rows) {
      if (!nodeMap.has(r.node_id)) {
        nodeMap.set(r.node_id, {
          id: r.node_id,
          name: r.node_name,
          x: 600 + Math.random() * 100,
          y: 350 + Math.random() * 100,
          outgoingLinks: 0
        });
      }
      if (r.edge_from && r.edge_to) {
        edges.push({ source: r.edge_from, target: r.edge_to, tag: r.tag?.Valid ? r.tag.String : undefined });
      }
    }

    const seen = new Set<string>();
    const uniq = edges.filter((e) => {
      const k = `${e.source}->${e.target}:${e.tag || ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const have = new Set(nodeMap.keys());
    const filtered = uniq.filter((e) => have.has(e.source) && have.has(e.target));

    // Count outgoing links for each node
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
    const width = 1200,
      height = 700;
    svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();

    if (nodes.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Граф пуст - создайте страницы и добавьте связи")
        .attr("fill", theme.colors.neutral[500])
        .attr("font-size", 16);
      return;
    }

    // Add arrow marker definitions for different node sizes
    const defs = svg.append("defs");

    // Small nodes (radius 20-25)
    defs.append("marker")
      .attr("id", "arrowhead-small")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[400]);

    // Medium nodes (radius 25-35)
    defs.append("marker")
      .attr("id", "arrowhead-medium")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 35)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[400]);

    // Large nodes (radius 35+)
    defs.append("marker")
      .attr("id", "arrowhead-large")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 45)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", theme.colors.neutral[400]);

    // Add zoom behavior
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom as any);

    const sim = d3
      .forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", theme.colors.neutral[300])
      .attr("stroke-width", 2)
      .attr("marker-end", (d: any) => {
        const targetNode = nodes.find(n => n.id === d.target.id || n.id === d.target);
        if (!targetNode) return "url(#arrowhead-small)";
        const radius = Math.min(20 + targetNode.outgoingLinks * 5, 40);
        if (radius <= 25) return "url(#arrowhead-small)";
        if (radius <= 35) return "url(#arrowhead-medium)";
        return "url(#arrowhead-large)";
      });

    // Nodes
    const nodeGroup = g.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll<SVGGElement, any>("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        nav(`/editor/${d.id}`);
      })
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            (d as any).fx = (d as any).x ?? width / 2;
            (d as any).fy = (d as any).y ?? height / 2;
          })
          .on("drag", (event, d) => {
            (d as any).fx = event.x;
            (d as any).fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            (d as any).fx = null;
            (d as any).fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", (d: any) => Math.min(20 + d.outgoingLinks * 5, 40))
      .attr("fill", "#ffffff")
      .attr("stroke", theme.colors.primary[500])
      .attr("stroke-width", 3)
      .on("mouseenter", function () {
        d3.select(this).attr("fill", theme.colors.primary[50]).attr("stroke", theme.colors.primary[600]);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#ffffff").attr("stroke", theme.colors.primary[500]);
      });

    node
      .append("text")
      .text((d: any) => d.name)
      .attr("font-size", 14)
      .attr("font-weight", theme.fontWeight.semibold)
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("fill", theme.colors.neutral[700])
      .attr("pointer-events", "none");

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x ?? 0)
        .attr("y1", (d: any) => d.source.y ?? 0)
        .attr("x2", (d: any) => d.target.x ?? 0)
        .attr("y2", (d: any) => d.target.y ?? 0);
      node.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  const cardStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    background: "#fff",
    boxShadow: theme.shadows.lg,
  };

  return (
    <div style={cardStyle}>
      <svg ref={ref} width="100%" height="700" />
    </div>
  );
}
