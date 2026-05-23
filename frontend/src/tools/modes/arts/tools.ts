import type { Tool, Stroke } from "../../types";
import { drawRect, drawCircle, drawText, drawBezier } from "../../utils/render-helpers";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}

export const pressureBrushTool: Tool = {
  id: "pressure-brush", mode: "arts", name: "Brush", icon: "🖌️",
  description: "Freehand pressure-sensitive brush stroke",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D4537E", width: 3 }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { color = "#D4537E", width = 3 } = stroke.data;
    drawBezier(ctx, pts, color, width);
  },
};

export const annotationPinTool: Tool = {
  id: "annotation-pin", mode: "arts", name: "Pin", icon: "📌",
  description: "Annotation pin marker",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D4537E", label: "" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#D4537E", label = "" } = stroke.data;
    const r = 10;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y - r, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x - r * 0.6, p.y - r);
    ctx.lineTo(p.x, p.y + r);
    ctx.lineTo(p.x + r * 0.6, p.y - r);
    ctx.fillStyle = color; ctx.fill();
    drawCircle(ctx, p.x, p.y - r, r * 0.45, "#fff");
    if (label) drawText(ctx, label, p.x, p.y + r + 6, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const frameArtboardTool: Tool = {
  id: "frame-artboard", mode: "arts", name: "Frame", icon: "🖼️",
  description: "Artboard / frame boundary",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D4537E", label: "Frame" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D4537E", label = "Frame" } = stroke.data;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    drawText(ctx, label || "Frame", x + 4, y - 14, { color, size: 11, baseline: "top" });
    ctx.restore();
  },
};

export const gridOverlayTool: Tool = {
  id: "grid-overlay", mode: "arts", name: "Grid", icon: "⊞",
  description: "Toggle grid overlay (no stroke rendered)",
  ui: {},
  acceptsInput: () => false,
  getDefaultData: () => ({}),
  render() {},
};

export const typographyBlockTool: Tool = {
  id: "typography", mode: "arts", name: "Typography", icon: "𝐀",
  description: "Text block with font controls",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D4537E", text: "Text", label: "sans-serif" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#D4537E", text = "Text", label = "sans-serif" } = stroke.data;
    ctx.save();
    ctx.font = `24px ${label || "sans-serif"}`;
    ctx.fillStyle = color;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(text || "Text", p.x, p.y);
    ctx.restore();
  },
};

export const eyedropperTool: Tool = {
  id: "eyedropper", mode: "arts", name: "Eyedropper", icon: "🎨",
  description: "Sample color from canvas",
  ui: {},
  acceptsInput: () => false,
  getDefaultData: () => ({}),
  render() {},
};

export const referenceImageTool: Tool = {
  id: "reference-image", mode: "arts", name: "Reference", icon: "🖼️",
  description: "Reference image placeholder",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#D4537E", label: "Reference" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#D4537E", label = "Reference" } = stroke.data;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#1e293b", color, 1);
    ctx.strokeStyle = color + "55"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
    ctx.stroke();
    drawText(ctx, label || "Reference", x + w / 2, y + h / 2, { color, size: 11, align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const colorPaletteTool: Tool = {
  id: "color-palette", mode: "arts", name: "Palette", icon: "🌈",
  description: "Color palette swatch strip",
  ui: {},
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#D4537E" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const swatches = ["#D4537E", "#378ADD", "#1D9E75", "#BA7517", "#7F77DD", "#f97316", "#e2e8f0"];
    const r = 8, spacing = r * 2 + 3;
    const startX = p.x - (swatches.length * spacing) / 2 + r;
    ctx.save();
    swatches.forEach((c, i) => drawCircle(ctx, startX + i * spacing, p.y, r, c, "#334155", 1));
    ctx.restore();
  },
};

export const artsTools: Tool[] = [
  pressureBrushTool, annotationPinTool, frameArtboardTool, gridOverlayTool,
  typographyBlockTool, eyedropperTool, referenceImageTool, colorPaletteTool,
];
