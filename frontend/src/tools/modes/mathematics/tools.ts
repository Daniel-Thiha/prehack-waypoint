import type { Tool, Stroke } from "../../types";
import { drawRect, drawLine, drawCircle, drawText, drawArrowhead } from "../../utils/render-helpers";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}

export const latexBlockTool: Tool = {
  id: "latex-block", mode: "mathematics", name: "LaTeX", icon: "∑",
  description: "LaTeX equation block",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D85A30", text: "E = mc²" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#D85A30", text = "E = mc²" } = stroke.data;
    ctx.save();
    const w = 140, h = 40;
    drawRect(ctx, p.x - w / 2, p.y - h / 2, w, h, "#0f172a", color, 1.5, 4);
    drawText(ctx, text, p.x, p.y, { color, size: 15, font: "serif", align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const coordPlaneTool: Tool = {
  id: "coord-plane", mode: "mathematics", name: "Coordinates", icon: "📐",
  description: "Cartesian coordinate plane with grid",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D85A30" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D85A30" } = stroke.data;
    const cx = x + w / 2, cy = y + h / 2;
    const gridStep = Math.min(w, h) / 6;
    ctx.save();
    ctx.strokeStyle = color + "22"; ctx.lineWidth = 0.5;
    for (let gx = cx; gx <= x + w; gx += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
    }
    for (let gx = cx - gridStep; gx >= x; gx -= gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
    }
    for (let gy = cy; gy <= y + h; gy += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }
    for (let gy = cy - gridStep; gy >= y; gy -= gridStep) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }
    drawLine(ctx, x + 8, cy, x + w - 8, cy, color, 1.5);
    drawLine(ctx, cx, y + 8, cx, y + h - 8, color, 1.5);
    drawArrowhead(ctx, x + w - 8, cy, 0, 7, color);
    drawArrowhead(ctx, cx, y + 8, -Math.PI / 2, 7, color);
    drawText(ctx, "x", x + w - 4, cy - 4, { color, size: 11 });
    drawText(ctx, "y", cx + 4, y + 10, { color, size: 11 });
    ctx.restore();
  },
};

export const proofBlockTool: Tool = {
  id: "proof-block", mode: "mathematics", name: "Proof", icon: "∴",
  description: "Logical proof step block",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D85A30", text: "Let x ∈ ℝ...", label: "1" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#D85A30", text = "Let x ∈ ℝ", label = "1" } = stroke.data;
    const w = 160, h = 44;
    ctx.save();
    drawRect(ctx, p.x - w / 2, p.y - h / 2, w, h, "#0f172a", color, 1.5, 3);
    drawLine(ctx, p.x - w / 2 + 26, p.y - h / 2, p.x - w / 2 + 26, p.y + h / 2, color, 0.8);
    drawText(ctx, label, p.x - w / 2 + 13, p.y, { color, size: 13, font: "monospace", align: "center", baseline: "middle" });
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x - w / 2 + 30, p.y - h / 2 + 2, w - 32, h - 4); ctx.clip();
    (text || "").split("\n").forEach((line, i) => {
      drawText(ctx, line, p.x - w / 2 + 34, p.y - h / 2 + 8 + i * 14, { color: "#e2e8f0", size: 12, font: "serif" });
    });
    ctx.restore();
    ctx.restore();
  },
};

export const numberLineTool: Tool = {
  id: "number-line", mode: "mathematics", name: "Number Line", icon: "←→",
  description: "Number line with tick marks and labels",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D85A30", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#D85A30", label = "" } = stroke.data;
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const ticks = 8;
    ctx.save();
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
    drawArrowhead(ctx, p1.x, p1.y, ang, 7, color);
    drawArrowhead(ctx, p0.x, p0.y, ang + Math.PI, 7, color);
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const tx = p0.x + (p1.x - p0.x) * t, ty = p0.y + (p1.y - p0.y) * t;
      const px = Math.cos(ang + Math.PI / 2) * 6, py = Math.sin(ang + Math.PI / 2) * 6;
      drawLine(ctx, tx - px, ty - py, tx + px, ty + py, color, 1);
      drawText(ctx, String(i - ticks / 2), tx, ty + 10, { color: "#94a3b8", size: 9, align: "center", baseline: "top" });
    }
    if (label) drawText(ctx, label, (p0.x + p1.x) / 2, p0.y - 14, { color, size: 10, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const matrixGridTool: Tool = {
  id: "matrix-grid", mode: "mathematics", name: "Matrix", icon: "⬜",
  description: "Matrix with bracket notation",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D85A30", text: "1,0\n0,1" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D85A30", text = "1,0\n0,1" } = stroke.data;
    const rows = (text || "").split("\n").map((r) => r.split(","));
    const numCols = Math.max(...rows.map((r) => r.length));
    const cellW = (w - 20) / numCols, cellH = (h - 8) / rows.length;
    ctx.save();
    // brackets
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 4); ctx.lineTo(x + 2, y + 4); ctx.lineTo(x + 2, y + h - 4); ctx.lineTo(x + 7, y + h - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - 7, y + 4); ctx.lineTo(x + w - 2, y + 4); ctx.lineTo(x + w - 2, y + h - 4); ctx.lineTo(x + w - 7, y + h - 4);
    ctx.stroke();
    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const cx = x + 10 + ci * cellW + cellW / 2;
        const cy = y + 4 + ri * cellH + cellH / 2;
        drawText(ctx, cell.trim(), cx, cy, { color, size: 12, font: "monospace", align: "center", baseline: "middle" });
      });
    });
    ctx.restore();
  },
};

export const geometricConstructionTool: Tool = {
  id: "geometric-construction", mode: "mathematics", name: "Geometry", icon: "📐",
  description: "Geometric construction (circle/diagonals)",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D85A30", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D85A30", label = "" } = stroke.data;
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 4;
    ctx.save();
    drawCircle(ctx, cx, cy, r, undefined, color, 1);
    drawLine(ctx, cx - r, cy, cx + r, cy, color + "66", 1);
    drawLine(ctx, cx, cy - r, cx, cy + r, color + "66", 1);
    ctx.setLineDash([3, 3]);
    drawLine(ctx, x, y, x + w, y + h, color + "55", 1);
    drawLine(ctx, x + w, y, x, y + h, color + "55", 1);
    ctx.setLineDash([]);
    if (label) drawText(ctx, label, cx, y - 4, { color, size: 10, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const statisticsPlotTool: Tool = {
  id: "statistics-plot", mode: "mathematics", name: "Statistics", icon: "📊",
  description: "Normal distribution / bell curve plot",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D85A30" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D85A30" } = stroke.data;
    ctx.save();
    drawLine(ctx, x + 8, y + h - 12, x + w - 8, y + h - 12, color + "66", 1);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const px = x + 8 + t * (w - 16);
      const nz = (t - 0.5) * 6;
      const bell = Math.exp(-nz * nz / 2) / Math.sqrt(2 * Math.PI);
      const py = y + h - 12 - bell * (h - 20) * 2.5;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.lineTo(x + w - 8, y + h - 12); ctx.lineTo(x + 8, y + h - 12); ctx.closePath();
    ctx.fillStyle = color + "22"; ctx.fill();
    drawText(ctx, "μ", x + w / 2, y + h - 2, { color, size: 10, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const setNotationTool: Tool = {
  id: "set-notation", mode: "mathematics", name: "Sets", icon: "∅",
  description: "Set / Venn diagram",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D85A30", label: "A ∩ B" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#D85A30", label = "A ∩ B" } = stroke.data;
    const r = 22;
    ctx.save();
    ctx.globalAlpha = 0.3;
    drawCircle(ctx, p.x - 10, p.y, r, color, undefined, 0);
    drawCircle(ctx, p.x + 10, p.y, r, "#7F77DD", undefined, 0);
    ctx.globalAlpha = 1;
    drawCircle(ctx, p.x - 10, p.y, r, undefined, color, 1.5);
    drawCircle(ctx, p.x + 10, p.y, r, undefined, "#7F77DD", 1.5);
    drawText(ctx, "A", p.x - 24, p.y, { color: "#e2e8f0", size: 11, align: "center", baseline: "middle" });
    drawText(ctx, "B", p.x + 24, p.y, { color: "#e2e8f0", size: 11, align: "center", baseline: "middle" });
    if (label) drawText(ctx, label, p.x, p.y + r + 8, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const mathematicsTools: Tool[] = [
  latexBlockTool, coordPlaneTool, proofBlockTool, numberLineTool,
  matrixGridTool, geometricConstructionTool, statisticsPlotTool, setNotationTool,
];
