import type { Point } from "../types";

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill?: string,
  stroke?: string,
  lineWidth: number = 1
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill?: string,
  stroke?: string,
  lineWidth: number = 1,
  radius: number = 0
) {
  if (radius > 0) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
  }

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  lineWidth: number = 1,
  lineDash?: number[]
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;

  if (lineDash) {
    ctx.setLineDash(lineDash);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.stroke();
  }
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    size?: number;
    font?: string;
    align?: "start" | "center" | "end";
    baseline?: "top" | "middle" | "bottom";
  } = {}
) {
  const {
    color = "#fff",
    size = 12,
    font = "sans-serif",
    align = "start",
    baseline = "top",
  } = options;

  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    size?: number;
    bgColor?: string;
    padding?: number;
  } = {}
) {
  const { color = "#fff", size = 10, bgColor = "#1e293b", padding = 4 } =
    options;

  ctx.font = `${size}px sans-serif`;
  const metrics = ctx.measureText(text);
  const width = metrics.width + padding * 2;
  const height = size + padding * 2;

  drawRect(ctx, x - width / 2, y - height / 2, width, height, bgColor);
  drawText(ctx, text, x, y, {
    color,
    size,
    align: "center",
    baseline: "middle",
  });
}

export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number = 8,
  fill: string = "#fff"
) {
  const headlen = size;
  const angle1 = angle + (Math.PI * 5) / 6;
  const angle2 = angle - (Math.PI * 5) / 6;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - headlen * Math.cos(angle1), y - headlen * Math.sin(angle1));
  ctx.moveTo(x, y);
  ctx.lineTo(x - headlen * Math.cos(angle2), y - headlen * Math.sin(angle2));
  ctx.strokeStyle = fill;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fill?: string,
  stroke?: string,
  lineWidth: number = 1
) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  lineWidth: number = 1,
  dashLength: number = 6,
  gapLength: number = 3
) {
  drawLine(ctx, x1, y1, x2, y2, stroke, lineWidth, [dashLength, gapLength]);
}

export function drawBezier(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  stroke: string,
  lineWidth: number = 1
) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
