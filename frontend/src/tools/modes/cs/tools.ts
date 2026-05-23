import type { Tool, Stroke } from "../../types";
import { drawRect, drawLine, drawCircle, drawText, drawLabel, drawArrowhead } from "../../utils/render-helpers";
import { angleFromPoints } from "../../utils/path-utils";

function twoPointBounds(stroke: Stroke) {
  const p0 = stroke.points[0];
  const p1 = stroke.points[stroke.points.length - 1];
  return {
    x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y),
    w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y),
  };
}

export const systemShapeTool: Tool = {
  id: "system-shape", mode: "cs", name: "System Shape", icon: "🖥️",
  description: "Server, database, client, load-balancer and more",
  variants: ["server","database","client","load-balancer","cache","api-gateway","queue","cdn"],
  ui: { hasVariant: true, hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#378ADD", shapeVariant: "server", label: "" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#378ADD", shapeVariant = "server", label } = stroke.data;
    const w = 50, h = 32;
    const x = p.x - w / 2, y = p.y - h / 2;
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    switch (shapeVariant) {
      case "server":
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill(); ctx.stroke();
        drawLine(ctx, x + 4, y + h / 3, x + w - 4, y + h / 3, color, 0.8);
        drawLine(ctx, x + 4, y + 2 * h / 3, x + w - 4, y + 2 * h / 3, color, 0.8);
        break;
      case "database":
        { const ew = w, eh = 10, by = y + eh / 2;
          ctx.beginPath(); ctx.ellipse(p.x, by, ew/2, eh/2, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, y+h); ctx.ellipse(p.x, y+h, ew/2, eh/2, 0, Math.PI, 0); ctx.lineTo(x+w, by); ctx.fillStyle="#1e293b"; ctx.fill(); ctx.stroke();
        } break;
      case "client":
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#0d1117";
        ctx.beginPath(); ctx.roundRect(x+3, y+3, w-6, h*0.6, 2); ctx.fill(); ctx.stroke();
        drawLine(ctx, x+w*0.3, y+h-5, x+w*0.7, y+h-5, color, 1);
        break;
      case "load-balancer":
        ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(x+w, p.y); ctx.lineTo(p.x, y+h); ctx.lineTo(x, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "cache":
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke();
        drawText(ctx, "⚡", p.x, p.y, { align: "center", baseline: "middle", size: 14, color });
        break;
      case "api-gateway":
        { const hw = w/2, hh = h/2;
          ctx.beginPath(); ctx.moveTo(p.x-hw*0.5, y); ctx.lineTo(p.x+hw*0.5, y); ctx.lineTo(x+w, p.y); ctx.lineTo(p.x+hw*0.5, y+h); ctx.lineTo(p.x-hw*0.5, y+h); ctx.lineTo(x, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
          void hh;
        } break;
      case "queue":
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const sx = x + 8 + i * 13; const sy = p.y - 5;
          ctx.fillStyle = color + "88"; ctx.beginPath(); ctx.rect(sx, sy, 9, 10); ctx.fill(); ctx.stroke();
        }
        break;
      case "cdn":
        { const r = 10;
          for (let i = 0; i < 3; i++) drawCircle(ctx, x+10+i*15, y+r, r, "#1e293b", color, 1);
          ctx.fillStyle="#1e293b"; ctx.beginPath(); ctx.rect(x+2, y+r*1.2, w-4, h-r*1.2); ctx.fill(); ctx.stroke();
        } break;
    }

    const lbl = label || shapeVariant || "server";
    drawText(ctx, lbl, p.x, y + h + 10, { color: "#94a3b8", size: 10, align: "center", baseline: "top" });
    ctx.restore();
  },
};

export const smartConnectorTool: Tool = {
  id: "smart-connector", mode: "cs", name: "Smart Connector", icon: "➜",
  description: "Directional connector with optional label and style",
  variants: ["default","dashed","extends","association"],
  ui: { hasVariant: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#378ADD", connectorType: "default", label: "" }),
  render(ctx, stroke) {
    const pts = stroke.points;
    if (pts.length < 2) return;
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const { color = "#378ADD", connectorType = "default", label } = stroke.data;
    const midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    const dashed = connectorType === "dashed" || connectorType === "implements";
    if (dashed) ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.setLineDash([]);
    const ang = angleFromPoints({ x: p1.x, y: p0.y }, p1);
    if (connectorType === "extends") {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x - 8 * Math.cos(ang - 0.4), p1.y - 8 * Math.sin(ang - 0.4)); ctx.lineTo(p1.x - 8 * Math.cos(ang + 0.4), p1.y - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.stroke(); ctx.restore();
    } else {
      drawArrowhead(ctx, p1.x, p1.y, ang, 8, color);
    }
    if (label) drawLabel(ctx, label, midX, midY - 8, { color: "#fff", bgColor: "#1e293b", size: 10 });
    ctx.restore();
  },
};

export const codeBlockTool: Tool = {
  id: "code-block", mode: "cs", name: "Code Block", icon: "</>",
  description: "Syntax-highlighted code snippet block",
  ui: { hasText: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#378ADD", text: "function hello() {\n  return 'world';\n}", label: "code" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#378ADD", text = "", label = "code" } = stroke.data;
    const barH = 22;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#0d1117", color, 1);
    drawRect(ctx, x, y, w, barH, "#161b22");
    drawText(ctx, label || "code", x + 8, y + barH / 2, { color: "#94a3b8", size: 10, baseline: "middle" });
    ctx.fillStyle = color; ctx.fillRect(x, y, 3, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 3, y + barH, w - 3, h - barH); ctx.clip();
    const lines = (text || "").split("\n");
    lines.forEach((line, i) => {
      drawText(ctx, line, x + 10, y + barH + 14 + i * 14, { color: "#e6edf3", size: 12, font: "monospace" });
    });
    ctx.restore(); ctx.restore();
  },
};

export const umlClassTool: Tool = {
  id: "uml-class", mode: "cs", name: "UML Class", icon: "⬜",
  description: "Class diagram block with name, attributes, methods",
  ui: { hasText: true, hasSubtext: true, hasLabel: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#378ADD", text: "MyClass", subtext: "+ name: string\n+ age: int", label: "+ getName()\n+ setAge()" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#378ADD", text = "Class", subtext = "", label = "" } = stroke.data;
    const secH = h / 3;
    ctx.save();
    drawRect(ctx, x, y, w, h, "#1e293b", color, 1);
    drawLine(ctx, x, y + secH, x + w, y + secH, color, 0.8);
    drawLine(ctx, x, y + secH * 2, x + w, y + secH * 2, color, 0.8);
    drawText(ctx, text || "Class", x + w / 2, y + secH / 2, { color: "#fff", size: 13, font: "sans-serif", align: "center", baseline: "middle" });
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y + secH, w, secH); ctx.clip();
    (subtext || "").split("\n").forEach((line, i) => {
      drawText(ctx, line, x + 6, y + secH + 4 + i * 13, { color: "#cbd5e1", size: 11 });
    });
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y + secH * 2, w, secH); ctx.clip();
    (label || "").split("\n").forEach((line, i) => {
      drawText(ctx, line, x + 6, y + secH * 2 + 4 + i * 13, { color: "#cbd5e1", size: 11 });
    });
    ctx.restore(); ctx.restore();
  },
};

export const graphNodeTool: Tool = {
  id: "graph-node", mode: "cs", name: "Graph Node", icon: "◯",
  description: "Graph/tree node circle",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#378ADD", text: "n" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#378ADD", text = "n" } = stroke.data;
    drawCircle(ctx, p.x, p.y, 20, "#1e293b", color, 2);
    drawText(ctx, text, p.x, p.y, { color: "#fff", size: 13, align: "center", baseline: "middle" });
  },
};

export const complexityStampTool: Tool = {
  id: "complexity-stamp", mode: "cs", name: "Complexity", icon: "O(n)",
  description: "Big-O complexity pill stamp",
  ui: { hasText: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#378ADD", text: "O(n)" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#378ADD", text = "O(n)" } = stroke.data;
    ctx.save();
    ctx.font = "13px monospace";
    const tw = ctx.measureText(text).width;
    const pw = tw + 16, ph = 20;
    drawRect(ctx, p.x - pw / 2, p.y - ph / 2, pw, ph, color + "33", color, 1, ph / 2);
    drawText(ctx, text, p.x, p.y, { color, size: 12, font: "monospace", align: "center", baseline: "middle" });
    ctx.restore();
  },
};

export const sequenceDiagramTool: Tool = {
  id: "sequence-diagram", mode: "cs", name: "Sequence", icon: "⇒",
  description: "Sequence diagram participant/lifeline",
  ui: { hasLabel: true },
  acceptsInput: (n) => n >= 1,
  getDefaultData: () => ({ color: "#378ADD", label: "Actor" }),
  render(ctx, stroke) {
    if (!stroke.points.length) return;
    const p = stroke.points[0];
    const { color = "#378ADD", label = "Actor" } = stroke.data;
    drawRect(ctx, p.x - 30, p.y - 14, 60, 28, "#1e293b", color, 1.5, 4);
    drawText(ctx, label, p.x, p.y, { color: "#fff", size: 11, align: "center", baseline: "middle" });
    drawLine(ctx, p.x, p.y + 14, p.x, p.y + 80, color, 1, [4, 4]);
  },
};

export const dbSchemaTool: Tool = {
  id: "db-schema", mode: "cs", name: "DB Schema", icon: "🗄️",
  description: "Database schema / ER table",
  ui: { hasText: true, hasSubtext: true },
  acceptsInput: (n) => n >= 2,
  getDefaultData: () => ({ color: "#378ADD", text: "users", subtext: "id: INT PK\nname: VARCHAR\nemail: VARCHAR" }),
  render(ctx, stroke) {
    const pts = stroke.points; if (pts.length < 2) return;
    const { x, y, w, h } = twoPointBounds(stroke);
    const { color = "#378ADD", text = "table", subtext = "" } = stroke.data;
    const hdrH = 24;
    drawRect(ctx, x, y, w, h, "#1e293b", color, 1.5);
    drawRect(ctx, x, y, w, hdrH, color + "33");
    drawText(ctx, text, x + w / 2, y + hdrH / 2, { color: "#fff", size: 12, align: "center", baseline: "middle" });
    drawLine(ctx, x, y + hdrH, x + w, y + hdrH, color, 0.8);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y + hdrH, w, h - hdrH); ctx.clip();
    (subtext || "").split("\n").forEach((line, i) => {
      const isPk = line.includes("PK");
      drawText(ctx, line, x + 8, y + hdrH + 6 + i * 14, { color: isPk ? color : "#94a3b8", size: 11 });
    });
    ctx.restore();
  },
};

export const csTools: Tool[] = [
  systemShapeTool, smartConnectorTool, codeBlockTool, umlClassTool,
  graphNodeTool, complexityStampTool, sequenceDiagramTool, dbSchemaTool,
];
