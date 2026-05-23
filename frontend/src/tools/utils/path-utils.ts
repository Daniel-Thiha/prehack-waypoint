import type { Point } from "../types";

export function orthogonalPath(
  start: Point,
  end: Point,
  horizontal: boolean = true
): Point[] {
  if (horizontal) {
    const midX = start.x + (end.x - start.x) / 2;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  } else {
    const midY = start.y + (end.y - start.y) / 2;
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  }
}

export function lShapedPath(start: Point, end: Point): Point[] {
  const midX = start.x + (end.x - start.x) / 2;
  return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

export function snapToGrid(point: Point, gridSize: number = 10): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function snapToOrtho(
  current: Point,
  start: Point,
  threshold: number = 10
): Point {
  const dx = Math.abs(current.x - start.x);
  const dy = Math.abs(current.y - start.y);

  if (dx > dy + threshold) {
    return { x: current.x, y: start.y };
  } else if (dy > dx + threshold) {
    return { x: start.x, y: current.y };
  }

  return current;
}

export function boundingBox(points: Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function lineIntersects(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const x1 = p1.x,
    y1 = p1.y;
  const x2 = p2.x,
    y2 = p2.y;
  const x3 = p3.x,
    y3 = p3.y;
  const x4 = p4.x,
    y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

export function pointInRect(
  point: Point,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}

export function distanceToPoint(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function angleFromPoints(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function pointAtDistance(
  start: Point,
  angle: number,
  distance: number
): Point {
  return {
    x: start.x + distance * Math.cos(angle),
    y: start.y + distance * Math.sin(angle),
  };
}

export function offsetPoint(
  point: Point,
  angle: number,
  distance: number
): Point {
  return pointAtDistance(point, angle, distance);
}
