import type { Tool } from "../../types";
import { drawRect, drawLine, drawCircle, drawText, drawBezier } from "../../utils/render-helpers";
import { angleFromPoints } from "../../utils/path-utils";

export const wallTool: Tool = {
  id: "wall-tool", mode: "architecture", name: "Wall", icon: "🧱",
  description: "Structural wall line",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#888780", width: 6 }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#888780", width = 6 } = stroke.data;
    const ang = angleFromPoints(p0, p1);
    const len = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "square";
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    // hatch lines inside wall
    ctx.save();
    ctx.translate(p0.x, p0.y); ctx.rotate(ang);
    ctx.strokeStyle = color + "66"; ctx.lineWidth = 0.8;
    const hw = width / 2;
    for (let x = 0; x < len; x += 6) {
      ctx.beginPath(); ctx.moveTo(x, -hw); ctx.lineTo(x + hw, hw); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    void len;
  },
};

export const floorSymbolTool: Tool = {
  id: "floor-symbol", mode: "architecture", name: "Floor", icon: "🚪",
  description: "Floor plan symbol (door, window, stair, column, room, slab)",
  variants: ["door", "window", "stair", "column", "room", "slab"],
  ui: { hasVariant: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#888780", shapeVariant: "door", label: "" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#888780", shapeVariant = "door", label = "" } = stroke.data;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;

    switch (shapeVariant) {
      case "door":
        ctx.beginPath();
        ctx.moveTo(p.x - 16, p.y); ctx.lineTo(p.x - 16, p.y - 30);
        ctx.lineTo(p.x + 16, p.y - 30); ctx.lineTo(p.x + 16, p.y);
        ctx.stroke();
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(p.x - 16, p.y - 30, 32, 0, Math.PI / 2); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case "window":
        ctx.beginPath(); ctx.rect(p.x - 20, p.y - 6, 40, 12); ctx.stroke();
        drawLine(ctx, p.x - 20, p.y, p.x + 20, p.y, color, 0.8);
        break;
      case "stair":
        for (let i = 0; i < 5; i++) {
          drawLine(ctx, p.x - 16 + i * 8, p.y - 20, p.x - 16 + i * 8, p.y + 20, color, 1);
          drawLine(ctx, p.x - 16, p.y - 20 + i * 10, p.x + 16, p.y - 20 + i * 10, color, 1);
        }
        break;
      case "column":
        drawRect(ctx, p.x - 8, p.y - 8, 16, 16, "#1e293b", color, 1.5);
        drawCircle(ctx, p.x, p.y, 10, undefined, color, 1);
        break;
      case "room":
        drawRect(ctx, p.x - 30, p.y - 20, 60, 40, "#1e293b55", color, 1);
        break;
      case "slab":
        drawRect(ctx, p.x - 25, p.y - 8, 50, 16, color + "33", color, 1);
        drawLine(ctx, p.x - 20, p.y, p.x + 20, p.y, color, 0.5);
        break;
    }

    if (label) drawText(ctx, label, p.x, p.y + 32, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const dimensionTool: Tool = {
  id: "dimension-tool", mode: "architecture", name: "Dimension", icon: "📏",
  description: "Dimension line with measurement",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#888780", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#888780", label = "" } = stroke.data;
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx);
    const midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
    const tickH = 8;
    const perpX = Math.cos(ang + Math.PI / 2) * tickH;
    const perpY = Math.sin(ang + Math.PI / 2) * tickH;
    ctx.save();
    drawLine(ctx, p0.x - perpX, p0.y - perpY, p0.x + perpX, p0.y + perpY, color, 1.5);
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
    drawLine(ctx, p1.x - perpX, p1.y - perpY, p1.x + perpX, p1.y + perpY, color, 1.5);
    const hl = 7;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p0.x + hl * Math.cos(ang + Math.PI - 0.35), p0.y + hl * Math.sin(ang + Math.PI - 0.35));
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p0.x + hl * Math.cos(ang + Math.PI + 0.35), p0.y + hl * Math.sin(ang + Math.PI + 0.35));
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x + hl * Math.cos(ang - 0.35), p1.y + hl * Math.sin(ang - 0.35));
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x + hl * Math.cos(ang + 0.35), p1.y + hl * Math.sin(ang + 0.35));
    ctx.stroke();
    drawText(ctx, label || `${Math.round(len)}`, midX, midY - 10, { color, size: 10, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const northArrowTool: Tool = {
  id: "north-arrow", mode: "architecture", name: "North", icon: "⬆️",
  description: "North direction indicator",
  ui: {},
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#888780" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#888780" } = stroke.data;
    const r = 20;
    ctx.save();
    drawCircle(ctx, p.x, p.y, r, undefined, color, 1.5);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r + 4); ctx.lineTo(p.x - 7, p.y + 6); ctx.lineTo(p.x, p.y + 2); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r + 4); ctx.lineTo(p.x + 7, p.y + 6); ctx.lineTo(p.x, p.y + 2); ctx.closePath();
    ctx.fillStyle = color + "44"; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
    drawText(ctx, "N", p.x, p.y - r - 4, { color, size: 11, align: "center", baseline: "bottom" });
    ctx.restore();
  },
};

export const sectionMarkerTool: Tool = {
  id: "section-marker", mode: "architecture", name: "Section", icon: "✂️",
  description: "Section cut line with end labels",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#888780", label: "A" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#888780", label = "A" } = stroke.data;
    ctx.save();
    ctx.setLineDash([8, 4]);
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1.5);
    ctx.setLineDash([]);
    drawCircle(ctx, p0.x, p0.y, 10, "#1e293b", color, 1.5);
    drawCircle(ctx, p1.x, p1.y, 10, "#1e293b", color, 1.5);
    drawText(ctx, label, p0.x, p0.y, { color: "#fff", size: 10, align: "center", baseline: "middle" });
    drawText(ctx, label, p1.x, p1.y, { color: "#fff", size: 10, align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const gridSnapTool: Tool = {
  id: "grid-snap", mode: "architecture", name: "Grid", icon: "⊞",
  description: "Snap-to-grid overlay toggle",
  ui: {},
  acceptsInput: () => false,
  getDefaultData: () => ({}),
  render() {},
};

export const freehandSketchTool: Tool = {
  id: "freehand-sketch", mode: "architecture", name: "Sketch", icon: "✏️",
  description: "Freehand sketch line",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#888780", width: 1.5 }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { color = "#888780", width = 1.5 } = stroke.data;
    drawBezier(ctx, pts, color, width);
  },
};

export const guidesTool: Tool = {
  id: "guides", mode: "architecture", name: "Guides", icon: "┃",
  description: "Reference guide line",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#888780" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#888780" } = stroke.data;
    ctx.save();
    ctx.setLineDash([4, 4]);
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color + "aa", 1);
    ctx.setLineDash([]);
    ctx.restore();
  },
};

export const architectureTools: Tool[] = [
  wallTool, floorSymbolTool, dimensionTool, northArrowTool, sectionMarkerTool,
  gridSnapTool, freehandSketchTool, guidesTool,
];
