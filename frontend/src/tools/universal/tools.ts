import type { Tool, Stroke } from "../types";
import { drawBezier, drawRect, drawCircle, drawLine } from "../utils/render-helpers";

export const penTool: Tool = {
  id: "pen",
  mode: "universal",
  name: "Pen",
  icon: "✏️",
  description: "Freehand drawing",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    const { color = "#fff", width = 2 } = stroke.data;

    drawBezier(ctx, stroke.points, color, width);
  },

  ui: {
    hasText: false,
    hasVariant: false,
  },

  acceptsInput: (pointCount: number) => pointCount >= 2,

  getDefaultData: () => ({
    color: "#fff",
    width: 2,
  }),
};

export const eraserTool: Tool = {
  id: "eraser",
  mode: "universal",
  name: "Eraser",
  icon: "🧹",
  description: "Erase (universal - also available in Arts mode)",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    const { width = 20 } = stroke.data;

    ctx.clearRect(
      stroke.points[0].x - width / 2,
      stroke.points[0].y - width / 2,
      width,
      width
    );
  },

  ui: {
    hasText: false,
    hasVariant: false,
  },

  acceptsInput: (pointCount: number) => pointCount >= 2,

  getDefaultData: () => ({
    width: 20,
  }),
};

export const shapesTool: Tool = {
  id: "shapes",
  mode: "universal",
  name: "Shapes",
  icon: "⬜",
  description: "Draw rectangles, circles, lines, triangles",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    const p0 = stroke.points[0];
    const p1 = stroke.points[stroke.points.length - 1];
    const { color = "#fff", width = 1, shapeVariant = "rect", backgroundColor } = stroke.data;

    const x = Math.min(p0.x, p1.x);
    const y = Math.min(p0.y, p1.y);
    const w = Math.abs(p1.x - p0.x);
    const h = Math.abs(p1.y - p0.y);

    switch (shapeVariant) {
      case "rect":
        drawRect(ctx, x, y, w, h, backgroundColor || "transparent", color, width);
        break;
      case "circle":
        const radius = Math.max(w, h) / 2;
        drawCircle(
          ctx,
          x + w / 2,
          y + h / 2,
          radius,
          backgroundColor || "transparent",
          color,
          width
        );
        break;
      case "line":
        drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, width);
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fill();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        break;
    }
  },

  variants: ["rect", "circle", "line", "triangle"],
  ui: {
    hasText: false,
    hasVariant: true,
  },

  acceptsInput: (pointCount: number) => pointCount >= 2,

  getDefaultData: () => ({
    color: "#fff",
    width: 1,
    shapeVariant: "rect",
  }),
};

export const textTool: Tool = {
  id: "text",
  mode: "universal",
  name: "Text",
  icon: "𝐀",
  description: "Add text blocks",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    const p = stroke.points[0];
    const { color = "#fff", fontSize = 16, text = "" } = stroke.data;

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "top";

    const lines = text.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, p.x, p.y + i * (fontSize + 4));
    });
  },

  ui: {
    hasText: true,
    hasVariant: false,
  },

  acceptsInput: (pointCount: number) => pointCount === 1,

  getDefaultData: () => ({
    color: "#fff",
    fontSize: 16,
    text: "Click to edit",
  }),
};

export const stickyNoteTool: Tool = {
  id: "sticky-note",
  mode: "universal",
  name: "Sticky Note",
  icon: "📝",
  description: "Add colored sticky notes",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    const p0 = stroke.points[0];
    const p1 = stroke.points[stroke.points.length - 1];
    const {
      color = "#fff",
      backgroundColor = "#fbbf24",
      fontSize = 12,
      text = "",
    } = stroke.data;

    const x = Math.min(p0.x, p1.x);
    const y = Math.min(p0.y, p1.y);
    const w = Math.abs(p1.x - p0.x);
    const h = Math.abs(p1.y - p0.y);

    drawRect(ctx, x, y, w, h, backgroundColor, color, 1, 4);

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const padding = 8;
    const maxWidth = w - padding * 2;
    const lines = text.split("\n");

    lines.forEach((line, i) => {
      ctx.fillText(line, x + padding, y + padding + i * (fontSize + 4), maxWidth);
    });
  },

  ui: {
    hasText: true,
    hasVariant: false,
  },

  acceptsInput: (pointCount: number) => pointCount >= 2,

  getDefaultData: () => ({
    color: "#000",
    backgroundColor: "#fbbf24",
    fontSize: 12,
    text: "Note",
  }),
};

export const selectTool: Tool = {
  id: "select",
  mode: "universal",
  name: "Select",
  icon: "👆",
  description: "Select and delete elements",

  render: (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    const p0 = stroke.points[0];
    const p1 = stroke.points[stroke.points.length - 1];

    const x = Math.min(p0.x, p1.x);
    const y = Math.min(p0.y, p1.y);
    const w = Math.abs(p1.x - p0.x);
    const h = Math.abs(p1.y - p0.y);

    drawRect(ctx, x, y, w, h, "transparent", "#4f46e5", 1, 0);

    ctx.setLineDash([4, 4]);
    drawRect(ctx, x, y, w, h, "transparent", "#4f46e5", 1, 0);
    ctx.setLineDash([]);
  },

  ui: {
    hasText: false,
    hasVariant: false,
  },

  acceptsInput: (pointCount: number) => pointCount >= 2,

  getDefaultData: () => ({
    color: "#4f46e5",
  }),
};

export const universalTools: Tool[] = [
  selectTool,
  penTool,
  eraserTool,
  shapesTool,
  textTool,
  stickyNoteTool,
];
