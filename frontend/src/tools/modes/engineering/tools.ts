import type { Tool, Stroke } from "../../types";
import {
  drawRect, drawLine, drawCircle, drawText, drawLabel, drawPolygon,
} from "../../utils/render-helpers";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
}

export const circuitElementTool: Tool = {
  id: "circuit-element", mode: "engineering", name: "Circuit Element", icon: "⚡",
  description: "Draw circuit symbols (resistor, capacitor, diode, etc.)",
  variants: ["resistor", "capacitor", "inductor", "diode", "ground", "voltage-source", "op-amp"],
  ui: { hasVariant: true },
  acceptsInput: (n) => n === 1,
  getDefaultData: () => ({ color: "#fff", width: 1, shapeVariant: "resistor" }),

  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { shapeVariant = "resistor", color = "#fff", width = 1 } = stroke.data;
    const ll = 12; // lead length

    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.fillStyle = color;

    switch (shapeVariant) {
      case "resistor":
        drawLine(ctx, p.x - ll, p.y, p.x - 8, p.y, color, width);
        ctx.beginPath(); ctx.moveTo(p.x - 8, p.y - 4);
        for (let i = 0; i < 6; i++) ctx.lineTo(p.x - 8 + (i + 1) * (16 / 6), p.y + (i % 2 === 0 ? 4 : -4));
        ctx.stroke();
        drawLine(ctx, p.x + 8, p.y, p.x + ll, p.y, color, width);
        break;

      case "capacitor":
        drawLine(ctx, p.x - ll, p.y, p.x - 2, p.y, color, width);
        drawLine(ctx, p.x - 2, p.y - 6, p.x - 2, p.y + 6, color, width);
        drawLine(ctx, p.x + 2, p.y - 6, p.x + 2, p.y + 6, color, width);
        drawLine(ctx, p.x + 2, p.y, p.x + ll, p.y, color, width);
        break;

      case "inductor":
        drawLine(ctx, p.x - ll, p.y, p.x - 12, p.y, color, width);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(p.x - 10 + i * 8, p.y, 4, 0, Math.PI, false); ctx.stroke();
        }
        drawLine(ctx, p.x + 12, p.y, p.x + ll, p.y, color, width);
        break;

      case "diode":
        drawLine(ctx, p.x - ll, p.y, p.x - 8, p.y, color, width);
        drawPolygon(ctx, [{ x: p.x - 8, y: p.y - 6 }, { x: p.x - 8, y: p.y + 6 }, { x: p.x + 2, y: p.y }], undefined, color, width);
        drawLine(ctx, p.x + 2, p.y - 6, p.x + 2, p.y + 6, color, width);
        drawLine(ctx, p.x + 2, p.y, p.x + ll, p.y, color, width);
        break;

      case "ground":
        drawLine(ctx, p.x, p.y - 8, p.x, p.y, color, width);
        drawLine(ctx, p.x - 6, p.y, p.x + 6, p.y, color, width);
        drawLine(ctx, p.x - 4, p.y + 4, p.x + 4, p.y + 4, color, width);
        drawLine(ctx, p.x - 2, p.y + 8, p.x + 2, p.y + 8, color, width);
        break;

      case "voltage-source":
        drawLine(ctx, p.x - ll, p.y, p.x - 10, p.y, color, width);
        drawCircle(ctx, p.x, p.y, 10, undefined, color, width);
        drawText(ctx, "+", p.x - 5, p.y, { color, size: 9, align: "center", baseline: "middle" });
        drawText(ctx, "−", p.x + 5, p.y, { color, size: 9, align: "center", baseline: "middle" });
        drawLine(ctx, p.x + 10, p.y, p.x + ll, p.y, color, width);
        break;

      case "op-amp": {
        const tw = 32, th = 28;
        ctx.beginPath();
        ctx.moveTo(p.x - tw / 2, p.y - th / 2);
        ctx.lineTo(p.x + tw / 2, p.y);
        ctx.lineTo(p.x - tw / 2, p.y + th / 2);
        ctx.closePath();
        ctx.stroke();
        drawLine(ctx, p.x - ll - tw / 2, p.y - 8, p.x - tw / 2, p.y - 8, color, width);
        drawLine(ctx, p.x - ll - tw / 2, p.y + 8, p.x - tw / 2, p.y + 8, color, width);
        drawLine(ctx, p.x + tw / 2, p.y, p.x + ll + tw / 2, p.y, color, width);
        drawText(ctx, "+", p.x - tw / 2 + 4, p.y - 8, { color, size: 9, align: "start", baseline: "middle" });
        drawText(ctx, "−", p.x - tw / 2 + 4, p.y + 8, { color, size: 9, align: "start", baseline: "middle" });
        break;
      }

      default:
        drawCircle(ctx, p.x, p.y, 8, undefined, color, width);
        drawText(ctx, shapeVariant, p.x, p.y, { size: 10, color, align: "center", baseline: "middle" });
    }

    drawLabel(ctx, stroke.data.label || shapeVariant, p.x, p.y - 20);
  },
};

export const wireConnectorTool: Tool = {
  id: "wire-connector", mode: "engineering", name: "Wire", icon: "〰️",
  description: "Draw orthogonal wires",
  ui: {},
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#fff", width: 1 }),

  render(ctx, stroke) {
    if (stroke.points.length < 2) return;
    const p0 = stroke.points[0], p1 = stroke.points[stroke.points.length - 1];
    const { color = "#fff", width = 1 } = stroke.data;
    const midX = (p0.x + p1.x) / 2;
    drawLine(ctx, p0.x, p0.y, midX, p0.y, color, width);
    drawLine(ctx, midX, p0.y, midX, p1.y, color, width);
    drawLine(ctx, midX, p1.y, p1.x, p1.y, color, width);
    drawCircle(ctx, p0.x, p0.y, 3, color);
    drawCircle(ctx, p1.x, p1.y, 3, color);
  },
};

export const logicGateTool: Tool = {
  id: "logic-gate", mode: "engineering", name: "Logic Gate", icon: "⊕",
  description: "Draw logic gates (AND, OR, NOT, NAND, NOR, XOR)",
  variants: ["and", "or", "not", "nand", "nor", "xor"],
  ui: { hasVariant: true },
  acceptsInput: (n) => n === 1,
  getDefaultData: () => ({ color: "#fff", width: 1, shapeVariant: "and" }),

  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { shapeVariant = "and", color = "#fff", width = 1 } = stroke.data;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.fillStyle = "transparent";
    const w = 40, h = 24;

    const drawBubble = (x: number, y: number) => {
      drawCircle(ctx, x + 4, y, 4, undefined, color, width);
    };

    switch (shapeVariant) {
      case "and":
      case "nand":
        ctx.beginPath();
        ctx.moveTo(p.x - w / 2, p.y - h / 2);
        ctx.lineTo(p.x, p.y - h / 2);
        ctx.arc(p.x, p.y, h / 2, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(p.x - w / 2, p.y + h / 2);
        ctx.closePath();
        ctx.stroke();
        if (shapeVariant === "nand") drawBubble(p.x + h / 2, p.y);
        break;

      case "or":
      case "nor":
        ctx.beginPath();
        ctx.moveTo(p.x - w / 2 + 4, p.y - h / 2);
        ctx.quadraticCurveTo(p.x - w / 2, p.y, p.x - w / 2 + 4, p.y + h / 2);
        ctx.lineTo(p.x, p.y + h / 2);
        ctx.arc(p.x, p.y, h / 2, -Math.PI / 2, Math.PI / 2, false);
        ctx.closePath();
        ctx.stroke();
        if (shapeVariant === "nor") drawBubble(p.x + h / 2, p.y);
        break;

      case "xor":
        ctx.beginPath();
        ctx.moveTo(p.x - w / 2 + 4, p.y - h / 2);
        ctx.quadraticCurveTo(p.x - w / 2, p.y, p.x - w / 2 + 4, p.y + h / 2);
        ctx.lineTo(p.x, p.y + h / 2);
        ctx.arc(p.x, p.y, h / 2, -Math.PI / 2, Math.PI / 2, false);
        ctx.closePath();
        ctx.stroke();
        // extra input-side curve for XOR
        ctx.beginPath();
        ctx.moveTo(p.x - w / 2, p.y - h / 2);
        ctx.quadraticCurveTo(p.x - w / 2 - 4, p.y, p.x - w / 2, p.y + h / 2);
        ctx.stroke();
        break;

      case "not":
        drawCircle(ctx, p.x + w / 3, p.y, 3, undefined, color, width);
        drawPolygon(ctx,
          [{ x: p.x - w / 2, y: p.y - h / 2 }, { x: p.x - w / 2, y: p.y + h / 2 }, { x: p.x + w / 3 - 4, y: p.y }],
          undefined, color, width,
        );
        break;
    }

    drawLabel(ctx, shapeVariant, p.x, p.y - h / 2 - 10);
  },
};

export const blockDiagramTool: Tool = {
  id: "block-diagram", mode: "engineering", name: "Block", icon: "▢",
  description: "Draw functional blocks with input/output leads",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#fff", backgroundColor: "#1e293b", text: "Block" }),

  render(ctx, stroke) {
    if (stroke.points.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#fff", backgroundColor = "#1e293b", text = "Block" } = stroke.data;
    drawRect(ctx, x, y, w, h, backgroundColor, color, 1);
    ctx.fillStyle = "#fff"; ctx.font = "13px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2);
    drawLine(ctx, x - 8, y + h / 2, x, y + h / 2, color, 1);
    drawLine(ctx, x + w, y + h / 2, x + w + 8, y + h / 2, color, 1);
  },
};

export const signalLabelTool: Tool = {
  id: "signal-label", mode: "engineering", name: "Signal", icon: "〜",
  description: "Signal label on a wire",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#fff", label: "V" }),

  render(ctx, stroke) {
    if (stroke.points.length < 2) return;
    const p0 = stroke.points[0], p1 = stroke.points[stroke.points.length - 1];
    const { color = "#fff", label = "V" } = stroke.data;
    const midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
    drawLine(ctx, p0.x, p0.y, p1.x, p1.y, color, 1);
    ctx.save();
    ctx.font = "10px sans-serif";
    const tw = ctx.measureText(label).width;
    const pw = tw + 8, ph = 16;
    drawRect(ctx, midX - pw / 2, midY - ph - 4, pw, ph, "#1e293b", color, 1);
    drawText(ctx, label, midX, midY - ph / 2 - 4, { color: "#cbd5e1", size: 10, align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const equationBlockTool: Tool = {
  id: "equation-block", mode: "engineering", name: "Equation", icon: "∫",
  description: "Math equation block",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#fff", text: "V = IR\nP = IV", label: "Ohm" }),

  render(ctx, stroke) {
    if (stroke.points.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#fff", text = "", label = "" } = stroke.data;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#0f172a", color, 1);
    ctx.fillStyle = color; ctx.fillRect(x, y, 3, h);
    if (label) drawText(ctx, label, x + 6, y + 4, { color: color + "99", size: 9, baseline: "top" });
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 6, y + 16, w - 10, h - 20); ctx.clip();
    (text || "").split("\n").forEach((line, i) => {
      drawText(ctx, line, x + 10, y + 16 + i * 16, { color: "#e2e8f0", size: 12, font: "monospace" });
    });
    ctx.restore();
    ctx.restore();
  },
};

export const engineeringTools: Tool[] = [
  circuitElementTool, wireConnectorTool, logicGateTool, blockDiagramTool,
  signalLabelTool, equationBlockTool,
];
