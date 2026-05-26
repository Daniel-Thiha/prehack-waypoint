import type { Tool, Stroke } from "../../types";
import { drawRect, drawLine, drawCircle, drawText, drawLabel, drawArrowhead } from "../../utils/render-helpers";
import { angleFromPoints } from "../../utils/path-utils";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}

export const diagramTemplateTool: Tool = {
  id: "diagram-template", mode: "science", name: "Diagram", icon: "🔬",
  description: "Scientific diagram template",
  variants: ["atom", "cell", "dna", "ecosystem", "food-web", "circuit"],
  ui: { hasVariant: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#1D9E75", shapeVariant: "atom", label: "" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#1D9E75", shapeVariant = "atom", label = "" } = stroke.data;
    const r = 24;
    ctx.save();

    switch (shapeVariant) {
      case "atom":
        drawCircle(ctx, p.x, p.y, 6, color, undefined, 0);
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(i * Math.PI / 3);
          ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.restore();
        }
        break;
      case "cell":
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.fillStyle = color + "22";
        ctx.fill(); ctx.stroke();
        drawCircle(ctx, p.x + 5, p.y, 8, color + "44", color, 1);
        break;
      case "dna":
        for (let i = 0; i < 6; i++) {
          const y = p.y - 24 + i * 8, wave = Math.sin(i * 1.2) * 10;
          drawCircle(ctx, p.x + wave, y, 3, color, undefined, 0);
          drawCircle(ctx, p.x - wave, y, 3, color + "77", undefined, 0);
          if (i < 5) drawLine(ctx, p.x + wave, y, p.x - wave, y, color + "44", 1);
        }
        break;
      case "ecosystem":
        drawCircle(ctx, p.x, p.y, r, color + "22", color, 1.5);
        drawCircle(ctx, p.x, p.y, r * 0.55, color + "33", color, 1);
        drawCircle(ctx, p.x, p.y, 5, color, undefined, 0);
        break;
      case "food-web":
        [[0, -r], [r, 0], [0, r], [-r, 0]].forEach(([dx, dy]) => {
          drawCircle(ctx, p.x + dx, p.y + dy, 6, color, undefined, 0);
          drawLine(ctx, p.x, p.y, p.x + dx, p.y + dy, color + "88", 1);
        });
        drawCircle(ctx, p.x, p.y, 8, color + "55", color, 1.5);
        break;
      case "circuit":
        drawRect(ctx, p.x - 18, p.y - 14, 36, 28, "#1e293b", color, 1.5);
        drawLine(ctx, p.x - 18, p.y, p.x - 26, p.y, color, 1);
        drawLine(ctx, p.x + 18, p.y, p.x + 26, p.y, color, 1);
        break;
    }

    drawText(ctx, label || shapeVariant, p.x, p.y + r + 10, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const chemFormulaTool: Tool = {
  id: "chem-formula", mode: "science", name: "Formula", icon: "H₂O",
  description: "Chemical formula label",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#1D9E75", text: "H₂O", label: "water" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#1D9E75", text = "H₂O", label = "" } = stroke.data;
    ctx.save();
    ctx.font = "bold 16px monospace";
    const tw = ctx.measureText(text).width;
    const pw = tw + 16, ph = 28;
    drawRect(ctx, p.x - pw / 2, p.y - ph / 2, pw, ph, "#0f172a", color, 1.5, 4);
    drawText(ctx, text, p.x, p.y, { color, size: 15, font: "monospace", align: "center", baseline: "middle" });
    if (label) drawText(ctx, label, p.x, p.y + ph / 2 + 6, { color: "#64748b", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const reactionArrowTool: Tool = {
  id: "reaction-arrow", mode: "science", name: "Reaction", icon: "⇌",
  description: "Chemical reaction arrow (forward, reverse, equilibrium, resonance)",
  variants: ["forward", "reverse", "equilibrium", "resonance"],
  ui: { hasVariant: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#1D9E75", connectorType: "forward", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#1D9E75", connectorType = "forward", label = "" } = stroke.data;
    const midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
    const ang = angleFromPoints(p0, p1);
    ctx.save();

    if (connectorType === "equilibrium") {
      drawLine(ctx, p0.x, p0.y - 4, p1.x, p1.y - 4, color, 1.5);
      drawLine(ctx, p0.x, p0.y + 4, p1.x, p1.y + 4, color, 1.5);
      drawArrowhead(ctx, p1.x, p1.y - 4, ang, 7, color);
      drawArrowhead(ctx, p0.x, p0.y + 4, ang + Math.PI, 7, color);
    } else if (connectorType === "resonance") {
      drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
      drawArrowhead(ctx, p1.x, p1.y, ang, 8, color);
      drawArrowhead(ctx, p0.x, p0.y, ang + Math.PI, 8, color);
    } else if (connectorType === "reverse") {
      drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
      drawArrowhead(ctx, p0.x, p0.y, ang + Math.PI, 8, color);
    } else {
      drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
      drawArrowhead(ctx, p1.x, p1.y, ang, 8, color);
    }

    if (label) drawLabel(ctx, label, midX, midY - 12, { color: "#fff", bgColor: "#1e293b", size: 10 });
    ctx.restore();
  },
};

export const dataTableTool: Tool = {
  id: "data-table", mode: "science", name: "Table", icon: "📊",
  description: "Data table / spreadsheet",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#1D9E75", text: "A,B,C\n1,2,3\n4,5,6", label: "Data" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#1D9E75", text = "", label = "Data" } = stroke.data;
    const rows = (text || "A,B,C\n1,2,3").split("\n").map((r) => r.split(","));
    const numCols = Math.max(...rows.map((r) => r.length));
    const colW = w / numCols;
    const hdrH = 20, rowH = (h - hdrH) / Math.max(rows.length - 1, 1);
    ctx.save();
    drawRect(ctx, x, y, w, h, "#1e293b", color, 1);
    drawRect(ctx, x, y, w, hdrH, color + "33");
    rows[0]?.forEach((cell, ci) => {
      drawLine(ctx, x + ci * colW, y, x + ci * colW, y + h, color, 0.5);
      drawText(ctx, cell.trim(), x + ci * colW + 4, y + hdrH / 2, { color, size: 10, baseline: "middle" });
    });
    rows.slice(1).forEach((row, ri) => {
      const ry = y + hdrH + ri * rowH;
      drawLine(ctx, x, ry, x + w, ry, color, 0.5);
      row.forEach((cell, ci) => {
        drawText(ctx, cell.trim(), x + ci * colW + 4, ry + rowH / 2, { color: "#94a3b8", size: 10, baseline: "middle" });
      });
    });
    if (label) drawText(ctx, label, x + w / 2, y - 6, { color, size: 10, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const timelineTool: Tool = {
  id: "timeline", mode: "science", name: "Timeline", icon: "⏱️",
  description: "Chronological timeline bar",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#1D9E75", label: "Event" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#1D9E75", label = "Event" } = stroke.data;
    const ang = angleFromPoints(p0, p1);
    ctx.save();
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color + "66", 2);
    drawArrowhead(ctx, p1.x, p1.y, ang, 8, color);
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      const t = i / (steps + 1);
      const tx = p0.x + (p1.x - p0.x) * t, ty = p0.y + (p1.y - p0.y) * t;
      const px = Math.cos(ang + Math.PI / 2) * 6, py = Math.sin(ang + Math.PI / 2) * 6;
      drawLine(ctx, tx - px, ty - py, tx + px, ty + py, color, 1.5);
    }
    if (label) drawLabel(ctx, label, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - 14, { color: "#fff", bgColor: "#1e293b", size: 10 });
    ctx.restore();
  },
};

export const hypothesisTool: Tool = {
  id: "hypothesis", mode: "science", name: "Hypothesis", icon: "💡",
  description: "Hypothesis or note block",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#1D9E75", text: "If... then...", label: "H₁" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#1D9E75", text = "If... then...", label = "H₁" } = stroke.data;
    const w = 120, h = 50;
    ctx.save();
    drawRect(ctx, p.x - w / 2, p.y - h / 2, w, h, "#0f172a", color, 1.5, 4);
    drawRect(ctx, p.x - w / 2, p.y - h / 2, 24, h, color + "33");
    drawText(ctx, label, p.x - w / 2 + 12, p.y, { color, size: 11, align: "center", baseline: "middle" });
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x - w / 2 + 26, p.y - h / 2 + 2, w - 28, h - 4); ctx.clip();
    (text || "").split("\n").forEach((line, i) => {
      drawText(ctx, line, p.x - w / 2 + 30, p.y - h / 2 + 8 + i * 14, { color: "#cbd5e1", size: 11 });
    });
    ctx.restore();
    ctx.restore();
  },
};

export const graphSketchTool: Tool = {
  id: "graph-sketch", mode: "science", name: "Graph", icon: "📈",
  description: "Simple graph with axes and curve",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#1D9E75", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#1D9E75", label = "" } = stroke.data;
    const ox = x + 16, oy = y + h - 16;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#0f172a55", color + "33", 1);
    drawLine(ctx, ox, y + 8, ox, oy, color, 1.5);
    drawLine(ctx, ox, oy, x + w - 8, oy, color, 1.5);
    drawArrowhead(ctx, ox, y + 8, -Math.PI / 2, 6, color);
    drawArrowhead(ctx, x + w - 8, oy, 0, 6, color);
    ctx.beginPath();
    const aw = (x + w - 8) - ox, ah = oy - (y + 8);
    for (let i = 0; i <= 40; i++) {
      const px = ox + (i / 40) * aw;
      const py = oy - (Math.sin((i / 40) * Math.PI * 2) * 0.4 + 0.5) * ah;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    if (label) drawText(ctx, label, x + w / 2, y + 4, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const scaleBarTool: Tool = {
  id: "scale-bar", mode: "science", name: "Scale", icon: "↔️",
  description: "Scale measurement bar",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#1D9E75", label: "1 μm" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#1D9E75", label = "1 μm" } = stroke.data;
    const tickH = 6;
    ctx.save();
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 2);
    drawLine(ctx, p0.x, p0.y - tickH, p0.x, p0.y + tickH, color, 1.5);
    drawLine(ctx, p1.x, p1.y - tickH, p1.x, p1.y + tickH, color, 1.5);
    drawText(ctx, label, (p0.x + p1.x) / 2, p0.y - tickH - 2, { color, size: 11, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const scienceTools: Tool[] = [
  diagramTemplateTool, chemFormulaTool, reactionArrowTool, dataTableTool,
  timelineTool, hypothesisTool, graphSketchTool, scaleBarTool,
];
