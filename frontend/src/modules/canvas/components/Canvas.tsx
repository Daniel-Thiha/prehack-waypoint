import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ToolType, Stroke, Point, CursorData } from "../types/canvas.types";
import CursorOverlay from "./CursorOverlay";

interface Viewport { x: number; y: number; scale: number; }
interface TextInputState {
  worldX: number; worldY: number;
  screenX: number; screenY: number;
  kind: "text" | "sticky";
  stickyBg?: string;
}
type UndoItem =
  | { action: "add"; stroke: Stroke }
  | { action: "delete"; stroke: Stroke }
  | { action: "clear"; strokes: Stroke[] }
  | { action: "move"; id: string; dx: number; dy: number };

interface DragState {
  strokeId: string;
  startWx: number; startWy: number;
  originalPoints: Point[];
}

interface CanvasProps {
  socket: Socket;
  roomId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  stickyBg: string;
  displayName: string;
  cursorColor: string;
  passcode?: string;
  onUndo: (cb: () => void) => void;
  onRedo: (cb: () => void) => void;
  onClearAll: (cb: () => void) => void;
  onImageInsert: (cb: (dataUrl: string) => void) => void;
  onStrokeAdded: (id: string) => void;
}

const MIN_SCALE = 0.05, MAX_SCALE = 20, GRID = 50;
const STICKY_W = 200, STICKY_H = 160;

// ── image helpers ────────────────────────────────────────────────────────────

function compressToDataUrl(img: HTMLImageElement, maxW = 1200, maxH = 900): string {
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.82);
}

// ── pure drawing helpers ─────────────────────────────────────────────────────

function s2w(sx: number, sy: number, vp: Viewport): Point {
  return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) { lines.push(""); continue; }
    let cur = "";
    for (const word of para.split(" ")) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = word; }
      else cur = test;
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, w: number, h: number) {
  const r = Math.max(0.5, Math.min(1.8, vp.scale * 0.9));
  const sx = Math.floor((-vp.x / vp.scale) / GRID) * GRID;
  const sy = Math.floor((-vp.y / vp.scale) / GRID) * GRID;
  const ex = sx + Math.ceil(w / vp.scale / GRID + 2) * GRID;
  const ey = sy + Math.ceil(h / vp.scale / GRID + 2) * GRID;
  ctx.fillStyle = "#374151";
  for (let wx = sx; wx <= ex; wx += GRID)
    for (let wy = sy; wy <= ey; wy += GRID) {
      ctx.beginPath();
      ctx.arc(wx * vp.scale + vp.x, wy * vp.scale + vp.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  imgCache?: Map<string, HTMLImageElement>,
  onLoad?: () => void,
) {
  const pts = stroke.points;
  if (!pts.length) return;
  ctx.save();

  if (stroke.tool === "image") {
    if (!stroke.imageData || pts.length < 2) { ctx.restore(); return; }
    const [p0, p1] = [pts[0], pts[pts.length - 1]];
    const x = Math.min(p0.x, p1.x), y = Math.min(p0.y, p1.y);
    const w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
    const cached = imgCache?.get(stroke.id);
    if (cached) {
      ctx.drawImage(cached, x, y, w, h);
    } else if (imgCache) {
      const img = new Image();
      img.onload = () => { imgCache.set(stroke.id, img); onLoad?.(); };
      img.src = stroke.imageData;
    }
    ctx.restore(); return;
  }

  if (stroke.tool === "sticky") {
    if (pts.length < 2) { ctx.restore(); return; }
    const [p0, p1] = [pts[0], pts[pts.length - 1]];
    const w = p1.x - p0.x, h = p1.y - p0.y;
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = stroke.backgroundColor ?? "#fef08a";
    ctx.fillRect(p0.x, p0.y, w, h);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.fillRect(p0.x, p0.y, w, 26);
    if (stroke.text) {
      ctx.fillStyle = "#1f2937";
      const fs = stroke.fontSize ?? 13;
      ctx.font = `${fs}px sans-serif`;
      const lines = wrapText(ctx, stroke.text, w - 16);
      lines.forEach((l, i) => ctx.fillText(l, p0.x + 8, p0.y + 26 + (i + 1) * (fs * 1.35)));
    }
    ctx.restore(); return;
  }

  if (stroke.tool === "text") {
    ctx.fillStyle = stroke.color;
    ctx.font = `${stroke.fontSize ?? 18}px sans-serif`;
    (stroke.text ?? "").split("\n").forEach((l, i) =>
      ctx.fillText(l, pts[0].x, pts[0].y + i * (stroke.fontSize ?? 18) * 1.3));
    ctx.restore(); return;
  }

  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  if (stroke.tool === "pen") {
    if (pts.length === 1) {
      ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const m = { x: (pts[i-1].x+pts[i].x)/2, y: (pts[i-1].y+pts[i].y)/2 };
        ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, m.x, m.y);
      }
      ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y); ctx.stroke();
    }
  } else if (stroke.tool === "line" && pts.length >= 2) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y); ctx.stroke();
  } else if (stroke.tool === "rect" && pts.length >= 2) {
    const [p0, p1] = [pts[0], pts[pts.length-1]];
    ctx.beginPath(); ctx.strokeRect(Math.min(p0.x,p1.x), Math.min(p0.y,p1.y), Math.abs(p1.x-p0.x), Math.abs(p1.y-p0.y));
  } else if (stroke.tool === "circle" && pts.length >= 2) {
    const [p0, p1] = [pts[0], pts[pts.length-1]];
    ctx.beginPath();
    ctx.ellipse((p0.x+p1.x)/2, (p0.y+p1.y)/2, Math.abs(p1.x-p0.x)/2, Math.abs(p1.y-p0.y)/2, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
}

function getBBox(stroke: Stroke) {
  const pts = stroke.points;
  if (!pts.length) return { x: 0, y: 0, w: 1, h: 1 };
  if ((stroke.tool === "sticky" || stroke.tool === "image") && pts.length >= 2) {
    const [p0, p1] = [pts[0], pts[pts.length-1]];
    return { x: Math.min(p0.x,p1.x), y: Math.min(p0.y,p1.y), w: Math.abs(p1.x-p0.x), h: Math.abs(p1.y-p0.y) };
  }
  if (stroke.tool === "text") {
    const fs = stroke.fontSize ?? 18;
    const lines = (stroke.text ?? "").split("\n");
    return { x: pts[0].x, y: pts[0].y - fs, w: Math.max(...lines.map(l => l.length)) * fs * 0.6 + 16, h: lines.length * fs * 1.3 + 8 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) { minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y); }
  const pad = stroke.width + 4;
  return { x: minX-pad, y: minY-pad, w: maxX-minX+pad*2, h: maxY-minY+pad*2 };
}

function hitTest(s: Stroke, wx: number, wy: number) {
  const b = getBBox(s);
  return wx >= b.x && wx <= b.x+b.w && wy >= b.y && wy <= b.y+b.h;
}

function redrawAll(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  vp: Viewport,
  w: number,
  h: number,
  selId: string | null | undefined,
  imgCache: Map<string, HTMLImageElement>,
  onLoad: () => void,
) {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = "#111827"; ctx.fillRect(0,0,w,h);
  drawGrid(ctx, vp, w, h);
  ctx.setTransform(vp.scale,0,0,vp.scale,vp.x,vp.y);
  for (const s of strokes) drawStroke(ctx, s, imgCache, onLoad);
  if (selId) {
    const sel = strokes.find(s => s.id === selId);
    if (sel) {
      const b = getBBox(sel);
      ctx.save();
      ctx.strokeStyle="#3b82f6"; ctx.lineWidth=2/vp.scale;
      ctx.setLineDash([6/vp.scale,3/vp.scale]);
      ctx.strokeRect(b.x-2/vp.scale, b.y-2/vp.scale, b.w+4/vp.scale, b.h+4/vp.scale);
      ctx.restore();
    }
  }
  ctx.setTransform(1,0,0,1,0,0);
}

// ── component ────────────────────────────────────────────────────────────────

const Canvas = ({ socket, roomId, tool, color, strokeWidth, stickyBg, displayName, cursorColor, passcode, onUndo, onRedo, onClearAll, onImageInsert, onStrokeAdded }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  const [zoomPct, setZoomPct] = useState(100);

  const vpRef = useRef<Viewport>({ x: 0, y: 0, scale: 1 });
  const strokesRef = useRef<Stroke[]>([]);
  const undoRef = useRef<UndoItem[]>([]);
  const redoRef = useRef<UndoItem[]>([]);
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);
  const panRef = useRef<{ active: boolean; lx: number; ly: number }>({ active: false, lx: 0, ly: 0 });
  const selectedRef = useRef<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const isSpaceDownRef = useRef(false);
  const cursorNames = useRef(new Map<string, string>());
  const cursorColors = useRef(new Map<string, string>());
  const lastCursorEmit = useRef(0);
  const sizeRef = useRef({ w: 800, h: 600 });
  const redrawRef = useRef<(selId?: string | null) => void>(() => {});

  // Tracks space-pan cursor so React doesn't stomp it on re-render
  const [spaceDown, setSpaceDown] = useState(false);

  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const widthRef = useRef(strokeWidth);
  const stickyBgRef = useRef(stickyBg);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { widthRef.current = strokeWidth; }, [strokeWidth]);
  useEffect(() => { stickyBgRef.current = stickyBg; }, [stickyBg]);

  const updateViewport = useCallback((vp: Viewport) => {
    vpRef.current = vp;
    setViewport({ ...vp });
    setZoomPct(Math.round(vp.scale * 100));
  }, []);

  // Keep redrawRef fresh
  useEffect(() => {
    redrawRef.current = (selId?: string | null) => {
      const c = canvasRef.current; if (!c) return;
      // null = explicitly clear selection; undefined = use current selection
      const effectiveSel = selId !== undefined ? selId : selectedRef.current;
      redrawAll(
        c.getContext("2d")!, strokesRef.current, vpRef.current,
        sizeRef.current.w, sizeRef.current.h,
        effectiveSel,
        imgCacheRef.current,
        () => redrawRef.current(),
      );
    };
  });

  // ── undo / redo / clear ──────────────────────────────────────────────────

  const doUndo = useCallback(() => {
    const item = undoRef.current.pop();
    if (!item) return;
    switch (item.action) {
      case "add":
        strokesRef.current = strokesRef.current.filter(s => s.id !== item.stroke.id);
        socket.emit("canvas:undo", item.stroke.id);
        break;
      case "delete":
        strokesRef.current.push(item.stroke);
        socket.emit("canvas:stroke", item.stroke);
        break;
      case "clear":
        strokesRef.current = [...item.strokes];
        for (const s of item.strokes) socket.emit("canvas:stroke", s);
        break;
      case "move": {
        const s = strokesRef.current.find(x => x.id === item.id);
        if (s) { s.points = s.points.map(p => ({ x: p.x-item.dx, y: p.y-item.dy })); socket.emit("canvas:move", { id: item.id, dx: -item.dx, dy: -item.dy }); }
        break;
      }
    }
    redoRef.current.push(item);
    selectedRef.current = null;
    redrawRef.current(null);
  }, [socket]);

  const doRedo = useCallback(() => {
    const item = redoRef.current.pop();
    if (!item) return;
    switch (item.action) {
      case "add":
        strokesRef.current.push(item.stroke);
        socket.emit("canvas:stroke", item.stroke);
        break;
      case "delete":
        strokesRef.current = strokesRef.current.filter(s => s.id !== item.stroke.id);
        socket.emit("canvas:undo", item.stroke.id);
        break;
      case "clear":
        strokesRef.current = [];
        socket.emit("canvas:clear");
        break;
      case "move": {
        const s = strokesRef.current.find(x => x.id === item.id);
        if (s) { s.points = s.points.map(p => ({ x: p.x+item.dx, y: p.y+item.dy })); socket.emit("canvas:move", { id: item.id, dx: item.dx, dy: item.dy }); }
        break;
      }
    }
    undoRef.current.push(item);
    selectedRef.current = null;
    redrawRef.current(null);
  }, [socket]);

  const doClearAll = useCallback(() => {
    undoRef.current.push({ action: "clear", strokes: [...strokesRef.current] });
    redoRef.current = [];
    strokesRef.current = [];
    socket.emit("canvas:clear");
    redrawRef.current();
  }, [socket]);

  useEffect(() => { onUndo(doUndo); }, [onUndo, doUndo]);
  useEffect(() => { onRedo(doRedo); }, [onRedo, doRedo]);
  useEffect(() => { onClearAll(doClearAll); }, [onClearAll, doClearAll]);

  // ── image insert ─────────────────────────────────────────────────────────

  const insertImage = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const compressed = compressToDataUrl(img);
      const vp = vpRef.current;
      const { w, h } = sizeRef.current;
      const cx = (w / 2 - vp.x) / vp.scale;
      const cy = (h / 2 - vp.y) / vp.scale;
      const maxW = 500 / vp.scale, maxH = 400 / vp.scale;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const iw = img.width * ratio, ih = img.height * ratio;

      const finalImg = new Image();
      finalImg.onload = () => {
        const stroke: Stroke = {
          id: crypto.randomUUID(), tool: "image", color: "#000", width: 1,
          imageData: compressed,
          points: [{ x: cx - iw/2, y: cy - ih/2 }, { x: cx + iw/2, y: cy + ih/2 }],
        };
        imgCacheRef.current.set(stroke.id, finalImg);
        strokesRef.current.push(stroke);
        undoRef.current.push({ action: "add", stroke });
        redoRef.current = [];
        onStrokeAdded(stroke.id);
        socket.emit("canvas:stroke", stroke);
        redrawRef.current();
      };
      finalImg.src = compressed;
    };
    img.src = dataUrl;
  }, [socket, onStrokeAdded]);

  useEffect(() => { onImageInsert(insertImage); }, [onImageInsert, insertImage]);

  // ── paste handler ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) insertImage(dataUrl);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [insertImage]);

  // ── resize ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      sizeRef.current = { w: width, h: height };
      setCanvasSize({ w: width, h: height });
      redrawRef.current();
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { redrawRef.current(); }, [canvasSize]);

  // ── socket ───────────────────────────────────────────────────────────────

  useEffect(() => {
    socket.emit("room:join", { code: roomId, displayName, color: cursorColor, passcode });

    const onState = (s: Stroke[]) => { strokesRef.current = s; redrawRef.current(); };
    const onStroke = (s: Stroke) => { strokesRef.current.push(s); redrawRef.current(); };
    const onClear = () => { strokesRef.current = []; redrawRef.current(); };
    const onMove = ({ id, dx, dy }: { id: string; dx: number; dy: number }) => {
      const s = strokesRef.current.find(x => x.id === id);
      if (s) { s.points = s.points.map(p => ({ x: p.x+dx, y: p.y+dy })); redrawRef.current(); }
    };
    const onCursorMove = (d: { socketId: string; wx: number; wy: number }) => {
      setCursors(prev => { const n = new Map(prev); n.set(d.socketId, { socketId: d.socketId, username: cursorNames.current.get(d.socketId) ?? "…", color: cursorColors.current.get(d.socketId) ?? "#888", wx: d.wx, wy: d.wy }); return n; });
    };
    const onJoined = (d: { socketId: string; username: string; color: string }) => { cursorColors.current.set(d.socketId, d.color); cursorNames.current.set(d.socketId, d.username); };
    const onPeers = (d: { peers: Array<{ socketId: string; username: string; color: string }> }) => { for (const p of d.peers) { cursorColors.current.set(p.socketId, p.color); cursorNames.current.set(p.socketId, p.username); } };
    const onLeft = (d: { socketId: string }) => { setCursors(prev => { const n = new Map(prev); n.delete(d.socketId); return n; }); };

    socket.on("canvas:state", onState); socket.on("canvas:stroke", onStroke);
    socket.on("canvas:clear", onClear); socket.on("canvas:move", onMove);
    socket.on("cursor:move", onCursorMove); socket.on("room:user-joined", onJoined);
    socket.on("room:peers", onPeers); socket.on("room:user-left", onLeft);

    return () => {
      socket.off("canvas:state", onState); socket.off("canvas:stroke", onStroke);
      socket.off("canvas:clear", onClear); socket.off("canvas:move", onMove);
      socket.off("cursor:move", onCursorMove); socket.off("room:user-joined", onJoined);
      socket.off("room:peers", onPeers); socket.off("room:user-left", onLeft);
      socket.emit("room:leave");
    };
  }, [socket, roomId, displayName, cursorColor, passcode]);

  // ── wheel + keyboard (non-passive) ───────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current!;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vp = vpRef.current;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      // Normalize pixel/line/page delta so wheel feels the same across devices
      const norm = e.deltaMode === 0 ? 1 : e.deltaMode === 1 ? 16 : 600;
      if (e.ctrlKey || e.metaKey) {
        // Smooth exponential zoom — proportional to deltaY so trackpads don't jump
        const dy = e.deltaY * norm;
        const zoomFactor = Math.exp(-dy * 0.002);
        const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, vp.scale * zoomFactor));
        updateViewport({ x: mx - (mx - vp.x) * (ns / vp.scale), y: my - (my - vp.y) * (ns / vp.scale), scale: ns });
      } else {
        updateViewport({ ...vp, x: vp.x - e.deltaX * norm, y: vp.y - e.deltaY * norm });
      }
      // Draw immediately — updateViewport only schedules a React re-render which is too late
      redrawRef.current();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (textAreaRef.current && document.activeElement === textAreaRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpaceDownRef.current) { isSpaceDownRef.current = true; setSpaceDown(true); }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current) {
        const sel = strokesRef.current.find(s => s.id === selectedRef.current);
        if (sel) { undoRef.current.push({ action: "delete", stroke: sel }); redoRef.current = []; strokesRef.current = strokesRef.current.filter(s => s.id !== sel.id); socket.emit("canvas:undo", sel.id); }
        selectedRef.current = null; redrawRef.current(null);
      }
      if ((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key==="z") { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey||e.metaKey) && (e.key==="y"||(e.shiftKey&&e.key==="z"))) { e.preventDefault(); doRedo(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") { isSpaceDownRef.current = false; setSpaceDown(false); }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [updateViewport, doUndo, doRedo, socket]);

  // ── pointer helpers ──────────────────────────────────────────────────────

  const getScreen = (e: React.PointerEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const applySnap = (wc: Point, p0: Point, t: ToolType, shiftKey: boolean): Point => {
    if (!shiftKey) return wc;
    if (t === "line") {
      const angle = Math.atan2(wc.y-p0.y, wc.x-p0.x);
      const snapped = Math.round(angle/(Math.PI/4))*(Math.PI/4);
      const dist = Math.hypot(wc.x-p0.x, wc.y-p0.y);
      return { x: p0.x + Math.cos(snapped)*dist, y: p0.y + Math.sin(snapped)*dist };
    }
    if (t === "rect" || t === "circle" || t === "sticky") {
      const d = Math.max(Math.abs(wc.x-p0.x), Math.abs(wc.y-p0.y));
      return { x: p0.x + Math.sign(wc.x-p0.x||1)*d, y: p0.y + Math.sign(wc.y-p0.y||1)*d };
    }
    return wc;
  };

  const eraseAt = (wx: number, wy: number) => {
    const r = widthRef.current * 4;
    let erased = false;
    strokesRef.current = strokesRef.current.filter(s => {
      const hit = s.points.some(p => Math.hypot(p.x-wx, p.y-wy) < r) || (() => { const b = getBBox(s); return wx>=b.x && wx<=b.x+b.w && wy>=b.y && wy<=b.y+b.h; })();
      if (hit) { undoRef.current.push({ action: "delete", stroke: s }); redoRef.current = []; socket.emit("canvas:undo", s.id); erased = true; }
      return !hit;
    });
    if (erased) redrawRef.current();
  };

  // ── pointer events ───────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const sc = getScreen(e);
    const vp = vpRef.current;

    // Middle-click or Space+left-click → pan
    if (e.button === 1 || (e.button === 0 && isSpaceDownRef.current)) {
      panRef.current = { active: true, lx: e.clientX, ly: e.clientY };
      return;
    }
    if (e.button !== 0) return;

    const wc = s2w(sc.x, sc.y, vp);
    const t = toolRef.current;

    if (t === "image") return; // image tool is handled via upload/paste

    if (t === "text") {
      setTextInput({ worldX: wc.x, worldY: wc.y - 18, screenX: sc.x, screenY: sc.y - 18 * vp.scale, kind: "text" });
      setTimeout(() => textAreaRef.current?.focus(), 30);
      return;
    }

    if (t === "sticky") {
      setTextInput({ worldX: wc.x, worldY: wc.y, screenX: sc.x, screenY: sc.y, kind: "sticky", stickyBg: stickyBgRef.current });
      setTimeout(() => textAreaRef.current?.focus(), 30);
      return;
    }

    if (t === "eraser") { drawingRef.current = true; eraseAt(wc.x, wc.y); return; }

    if (t === "select") {
      let found: string | null = null;
      for (let i = strokesRef.current.length - 1; i >= 0; i--) {
        if (hitTest(strokesRef.current[i], wc.x, wc.y)) { found = strokesRef.current[i].id; break; }
      }
      selectedRef.current = found;
      if (found) {
        const s = strokesRef.current.find(x => x.id === found)!;
        dragRef.current = { strokeId: found, startWx: wc.x, startWy: wc.y, originalPoints: s.points.map(p => ({ ...p })) };
      } else {
        dragRef.current = null;
      }
      redrawRef.current();
      return;
    }

    drawingRef.current = true;
    currentRef.current = { id: crypto.randomUUID(), tool: t, color: colorRef.current, width: widthRef.current, points: [wc] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const sc = getScreen(e);
    const vp = vpRef.current;

    const now = Date.now();
    if (now - lastCursorEmit.current > 40) {
      const wc = s2w(sc.x, sc.y, vp);
      socket.emit("cursor:move", { wx: wc.x, wy: wc.y });
      lastCursorEmit.current = now;
    }

    if (panRef.current.active) {
      updateViewport({ ...vp, x: vp.x + e.clientX - panRef.current.lx, y: vp.y + e.clientY - panRef.current.ly });
      panRef.current.lx = e.clientX; panRef.current.ly = e.clientY;
      redrawRef.current();
      return;
    }

    if (toolRef.current === "select" && dragRef.current && selectedRef.current) {
      const wc = s2w(sc.x, sc.y, vp);
      const { strokeId, startWx, startWy, originalPoints } = dragRef.current;
      const dx = wc.x - startWx, dy = wc.y - startWy;
      const s = strokesRef.current.find(x => x.id === strokeId);
      if (s) { s.points = originalPoints.map(p => ({ x: p.x + dx, y: p.y + dy })); redrawRef.current(); }
      return;
    }

    if (!drawingRef.current) return;
    let wc = s2w(sc.x, sc.y, vp);
    const t = toolRef.current;
    if (t === "eraser") { eraseAt(wc.x, wc.y); return; }
    if (!currentRef.current) return;

    wc = applySnap(wc, currentRef.current.points[0], t, e.shiftKey);

    if (t === "pen") currentRef.current.points.push(wc);
    else currentRef.current.points = [currentRef.current.points[0], wc];

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    redrawAll(ctx, strokesRef.current, vp, sizeRef.current.w, sizeRef.current.h, selectedRef.current, imgCacheRef.current, () => redrawRef.current());
    ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.x, vp.y);
    drawStroke(ctx, currentRef.current, imgCacheRef.current, () => redrawRef.current());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    panRef.current.active = false;

    if (toolRef.current === "select" && dragRef.current) {
      const { strokeId, startWx, startWy, originalPoints } = dragRef.current;
      const s = strokesRef.current.find(x => x.id === strokeId);
      if (s && s.points.length) {
        const dx = s.points[0].x - originalPoints[0].x;
        const dy = s.points[0].y - originalPoints[0].y;
        if (Math.hypot(dx, dy) > 0.5) {
          socket.emit("canvas:move", { id: strokeId, dx, dy });
          undoRef.current.push({ action: "move", id: strokeId, dx, dy });
          redoRef.current = [];
        }
      }
      dragRef.current = null;
      return;
    }

    if (!drawingRef.current || !currentRef.current) return;
    drawingRef.current = false;
    const stroke = currentRef.current;
    currentRef.current = null;
    if (stroke.points.length < 1) return;
    strokesRef.current.push(stroke);
    undoRef.current.push({ action: "add", stroke });
    redoRef.current = [];
    onStrokeAdded(stroke.id);
    socket.emit("canvas:stroke", stroke);
    redrawRef.current();
    void e;
  };

  // ── text / sticky confirm ────────────────────────────────────────────────

  const commitTextInput = (text: string) => {
    setTextInput(null);
    if (!text.trim() || !textInput) return;
    if (textInput.kind === "sticky") {
      const stroke: Stroke = {
        id: crypto.randomUUID(), tool: "sticky", color: "#1f2937",
        width: 1, fontSize: 13, text,
        backgroundColor: textInput.stickyBg ?? "#fef08a",
        points: [
          { x: textInput.worldX, y: textInput.worldY },
          { x: textInput.worldX + STICKY_W, y: textInput.worldY + STICKY_H },
        ],
      };
      strokesRef.current.push(stroke);
      undoRef.current.push({ action: "add", stroke });
      redoRef.current = [];
      onStrokeAdded(stroke.id);
      socket.emit("canvas:stroke", stroke);
      redrawRef.current();
    } else {
      const stroke: Stroke = {
        id: crypto.randomUUID(), tool: "text", color: colorRef.current,
        width: 1, fontSize: 18, text,
        points: [{ x: textInput.worldX, y: textInput.worldY + 18 }],
      };
      strokesRef.current.push(stroke);
      undoRef.current.push({ action: "add", stroke });
      redoRef.current = [];
      onStrokeAdded(stroke.id);
      socket.emit("canvas:stroke", stroke);
      redrawRef.current();
    }
  };

  // ── zoom ─────────────────────────────────────────────────────────────────

  const applyZoom = (factor: number) => {
    const vp = vpRef.current;
    const cx = sizeRef.current.w/2, cy = sizeRef.current.h/2;
    const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, vp.scale*factor));
    updateViewport({ x: cx-(cx-vp.x)*(ns/vp.scale), y: cy-(cy-vp.y)*(ns/vp.scale), scale: ns });
  };

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: "#111827" }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w} height={canvasSize.h}
        className="absolute inset-0 touch-none"
        style={{ cursor: spaceDown ? "grab" : tool === "eraser" ? "cell" : tool === "select" ? "default" : tool === "text" ? "text" : tool === "image" ? "default" : "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Text input overlay */}
      {textInput && textInput.kind === "text" && (
        <textarea
          ref={textAreaRef}
          className="absolute bg-transparent border border-blue-500 outline-none resize-none overflow-hidden min-w-24 rounded px-1"
          style={{ left: textInput.screenX, top: textInput.screenY, fontSize: `${18*viewport.scale}px`, fontFamily: "sans-serif", lineHeight: 1.3, color: color, caretColor: color }}
          rows={1}
          autoFocus
          onInput={e => { const el = e.currentTarget; el.style.height="auto"; el.style.height=el.scrollHeight+"px"; }}
          onKeyDown={e => { if (e.key==="Escape") setTextInput(null); if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); commitTextInput(e.currentTarget.value); } }}
          onBlur={e => commitTextInput(e.currentTarget.value)}
        />
      )}

      {/* Sticky note input overlay */}
      {textInput && textInput.kind === "sticky" && (
        <div className="absolute shadow-2xl rounded overflow-hidden" style={{
          left: textInput.screenX, top: textInput.screenY,
          width: STICKY_W * viewport.scale, height: STICKY_H * viewport.scale,
          backgroundColor: textInput.stickyBg ?? "#fef08a",
        }}>
          <div className="w-full" style={{ height: 24*viewport.scale, background: "rgba(0,0,0,0.08)" }} />
          <textarea
            ref={textAreaRef}
            className="w-full outline-none resize-none bg-transparent"
            style={{ height: (STICKY_H-26)*viewport.scale, padding: `${4*viewport.scale}px ${8*viewport.scale}px`, fontSize: `${13*viewport.scale}px`, fontFamily: "sans-serif", color: "#1f2937", lineHeight: 1.35 }}
            autoFocus
            onKeyDown={e => { if (e.key==="Escape") setTextInput(null); if (e.key==="Enter"&&!e.shiftKey&&!e.ctrlKey) { e.preventDefault(); commitTextInput(e.currentTarget.value); } }}
            onBlur={e => commitTextInput(e.currentTarget.value)}
          />
        </div>
      )}

      <CursorOverlay cursors={cursors} viewport={viewport} />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-gray-900/90 border border-gray-700 rounded-xl px-2 py-1.5 backdrop-blur-sm select-none">
        <button onClick={() => applyZoom(0.8)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg text-xl font-light transition-colors leading-none">−</button>
        <button onClick={() => updateViewport({ x: 0, y: 0, scale: 1 })} className="min-w-12 text-center text-xs text-gray-400 hover:text-white transition-colors font-mono">{zoomPct}%</button>
        <button onClick={() => applyZoom(1.25)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg text-xl font-light transition-colors leading-none">+</button>
      </div>
    </div>
  );
};

export default Canvas;
