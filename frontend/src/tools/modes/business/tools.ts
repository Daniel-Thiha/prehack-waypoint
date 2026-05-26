import type { Tool, Stroke } from "../../types";
import { drawRect, drawLine, drawCircle, drawText } from "../../utils/render-helpers";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}

export const matrixTemplateTool: Tool = {
  id: "matrix-template", mode: "business", name: "Matrix", icon: "⬜",
  description: "Business matrix template (SWOT, BCG, Ansoff, Porter)",
  variants: ["swot", "bcg", "ansoff", "porter"],
  ui: { hasVariant: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#7F77DD", shapeVariant: "swot" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#7F77DD", shapeVariant = "swot" } = stroke.data;
    const mx = x + w / 2, my = y + h / 2;
    const quadLabels: Record<string, [string, string, string, string]> = {
      swot:   ["Strengths", "Weaknesses", "Opportunities", "Threats"],
      bcg:    ["Stars", "Question Marks", "Cash Cows", "Dogs"],
      ansoff: ["Market\nPenetration", "Product\nDevelopment", "Market\nDevelopment", "Diversification"],
      porter: ["Rivalry", "Suppliers", "Buyers", "New Entrants"],
    };
    const labels = quadLabels[shapeVariant] ?? quadLabels.swot;
    const quadColors = [color + "33", color + "22", color + "22", color + "33"];
    const quads = [
      { qx: x,  qy: y,  qw: mx - x,     qh: my - y     },
      { qx: mx, qy: y,  qw: x + w - mx, qh: my - y     },
      { qx: x,  qy: my, qw: mx - x,     qh: y + h - my },
      { qx: mx, qy: my, qw: x + w - mx, qh: y + h - my },
    ] as const;
    ctx.save();
    quads.forEach(({ qx, qy, qw, qh }, i) => {
      drawRect(ctx, qx, qy, qw, qh, quadColors[i], color, 1);
      const lines = labels[i].split("\n");
      lines.forEach((line, li) => {
        drawText(ctx, line, qx + qw / 2, qy + qh / 2 - (lines.length - 1) * 7 + li * 14, {
          color: "#94a3b8", size: 10, align: "center", baseline: "middle",
        });
      });
    });
    drawLine(ctx, mx, y, mx, y + h, color, 1.5);
    drawLine(ctx, x, my, x + w, my, color, 1.5);
    ctx.restore();
  },
};

export const mindMapNodeTool: Tool = {
  id: "mind-map", mode: "business", name: "Mind Map", icon: "🧠",
  description: "Mind map central node with branches",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#7F77DD", text: "Idea" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#7F77DD", text = "Idea" } = stroke.data;
    const r = 24;
    ctx.save();
    const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
    angles.forEach((a) => {
      const bx = p.x + Math.cos(a) * (r + 30), by = p.y + Math.sin(a) * (r + 30);
      drawLine(ctx, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, bx, by, color + "88", 1.5);
      drawCircle(ctx, bx, by, 10, color + "22", color, 1);
    });
    drawCircle(ctx, p.x, p.y, r, color + "33", color, 2);
    drawText(ctx, text, p.x, p.y, { color: "#fff", size: 12, align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const kanbanColumnTool: Tool = {
  id: "kanban", mode: "business", name: "Kanban", icon: "📋",
  description: "Kanban column with placeholder cards",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#7F77DD", label: "To Do" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#7F77DD", label = "To Do" } = stroke.data;
    const hdrH = 28;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#1e293b", color, 1, 4);
    drawRect(ctx, x, y, w, hdrH, color + "44", undefined, 0, 4);
    drawText(ctx, label, x + w / 2, y + hdrH / 2, { color: "#fff", size: 12, align: "center", baseline: "middle" });
    const cardH = 30, cardGap = 8;
    for (let i = 0; i < 3; i++) {
      const cy = y + hdrH + cardGap + i * (cardH + cardGap);
      if (cy + cardH > y + h) break;
      drawRect(ctx, x + 8, cy, w - 16, cardH, "#0f172a", color + "66", 1, 3);
    }
    ctx.restore();
  },
};

export const orgNodeTool: Tool = {
  id: "org-chart", mode: "business", name: "Org Chart", icon: "👥",
  description: "Org chart node with role and name",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#7F77DD", text: "Role", label: "Name" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#7F77DD", text = "Role", label = "Name" } = stroke.data;
    const w = 80, h = 36;
    ctx.save();
    drawRect(ctx, p.x - w / 2, p.y - h / 2, w, h, "#1e293b", color, 1.5, 4);
    drawLine(ctx, p.x - w / 2, p.y, p.x + w / 2, p.y, color, 0.7);
    drawText(ctx, label, p.x, p.y - h / 4, { color: "#fff", size: 11, align: "center", baseline: "middle" });
    drawText(ctx, text, p.x, p.y + h / 4, { color: "#94a3b8", size: 10, align: "center", baseline: "middle" });
    drawLine(ctx, p.x, p.y - h / 2, p.x, p.y - h / 2 - 12, color, 1);
    ctx.restore();
  },
};

export const chartEmbedTool: Tool = {
  id: "chart-embed", mode: "business", name: "Chart", icon: "📊",
  description: "Embedded bar chart",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#7F77DD" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#7F77DD" } = stroke.data;
    const data = [0.6, 0.85, 0.4, 0.95, 0.7];
    const barW = (w - 20) / data.length;
    const maxH = h - 24;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#0f172a", color, 1);
    drawLine(ctx, x + 10, y + 8, x + 10, y + h - 16, color + "66", 1);
    drawLine(ctx, x + 10, y + h - 16, x + w - 10, y + h - 16, color + "66", 1);
    data.forEach((v, i) => {
      const bx = x + 10 + i * barW + barW * 0.15;
      const bh = maxH * v, by = y + h - 16 - bh, bw = barW * 0.7;
      drawRect(ctx, bx, by, bw, bh, color + "66", color, 1);
    });
    ctx.restore();
  },
};

export const timelineGanttTool: Tool = {
  id: "timeline-gantt", mode: "business", name: "Gantt", icon: "📅",
  description: "Gantt chart task bar",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#7F77DD", label: "Task" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#7F77DD", label = "Task" } = stroke.data;
    const barH = Math.min(h, 20), bary = y + (h - barH) / 2;
    ctx.save();
    drawRect(ctx, x, bary, w, barH, color + "44", color, 1, 3);
    drawRect(ctx, x, bary, w * 0.65, barH, color + "88", undefined, 0, 3);
    drawText(ctx, label, x + 6, bary + barH / 2, { color: "#fff", size: 11, baseline: "middle" });
    ctx.restore();
  },
};

export const stickyClusterTool: Tool = {
  id: "sticky-cluster", mode: "business", name: "Cluster", icon: "📝",
  description: "Sticky note cluster",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#7F77DD", text: "Note" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#7F77DD", text = "Note" } = stroke.data;
    const palette = [color, "#D4537E", "#1D9E75"];
    const offsets = [[0, 0], [28, -10], [-20, 12]] as const;
    ctx.save();
    offsets.forEach(([dx, dy], i) => {
      const c = palette[i % palette.length];
      drawRect(ctx, p.x + dx - 24, p.y + dy - 16, 48, 32, c + "33", c, 1, 3);
    });
    drawText(ctx, text, p.x, p.y, { color: "#fff", size: 11, align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const stakeholderMapTool: Tool = {
  id: "stakeholder-map", mode: "business", name: "Stakeholder", icon: "🎯",
  description: "Stakeholder influence/interest map (concentric rings)",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#7F77DD", label: "" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#7F77DD", label = "" } = stroke.data;
    ctx.save();
    ([32, 22, 12] as const).forEach((r, i) => {
      drawCircle(ctx, p.x, p.y, r, color + (["11", "22", "44"][i]), color + (["44", "66", "88"][i]), 1);
    });
    if (label) drawText(ctx, label, p.x, p.y + 38, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const businessTools: Tool[] = [
  matrixTemplateTool, mindMapNodeTool, kanbanColumnTool, orgNodeTool,
  chartEmbedTool, timelineGanttTool, stickyClusterTool, stakeholderMapTool,
];
