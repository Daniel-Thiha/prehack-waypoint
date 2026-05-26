import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "../store/useCanvasStore";
import { useToolStore } from "../store/useToolStore";
import { useRoomStore } from "../store/useRoomStore";
import { toolRegistry } from "../tools/registry";
import { asyncRenderService } from "../tools/async-renderer";
import { universalTools } from "../tools/universal/tools";
import { Stroke, Point, Viewport } from "../tools/types";
import { nanoid } from "nanoid";

interface KonvaCanvasProps {
  onReady?: (stage: Konva.Stage) => void;
}

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({ onReady }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRefs = useRef({
    background: React.createRef<Konva.Layer>(),
    elements: React.createRef<Konva.Layer>(),
    activeStroke: React.createRef<Konva.Layer>(),
    cursor: React.createRef<Konva.Layer>(),
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  const { strokes, inProgressStroke, setInProgressStroke, addStroke, viewport, setViewport } =
    useCanvasStore();
  const { activeTool } = useToolStore();
  const { room } = useRoomStore();

  // Register universal tools on mount
  useEffect(() => {
    toolRegistry.registerTools(universalTools);
  }, []);

  // Handle canvas size
  useEffect(() => {
    if (!stageRef.current) return;

    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        stageRef.current.width(container.offsetWidth);
        stageRef.current.height(container.offsetHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Render strokes
  useEffect(() => {
    const elementsLayer = layerRefs.current.elements.current;
    if (!elementsLayer) return;

    elementsLayer.destroyChildren();

    strokes.forEach((stroke) => {
      renderStrokeToKonva(elementsLayer, stroke);
    });

    elementsLayer.draw();
  }, [strokes]);

  // Render in-progress stroke
  useEffect(() => {
    const activeLayer = layerRefs.current.activeStroke.current;
    if (!activeLayer) return;

    activeLayer.destroyChildren();

    if (inProgressStroke) {
      renderStrokeToKonva(activeLayer, inProgressStroke);
    }

    activeLayer.draw();
  }, [inProgressStroke]);

  function renderStrokeToKonva(layer: Konva.Layer, stroke: Stroke) {
    const tool = toolRegistry.getTool(stroke.tool);
    if (!tool) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Estimate bounds and create appropriately-sized canvas
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    stroke.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const padding = 20;
    const w = Math.max(1, maxX - minX + padding * 2);
    const h = Math.max(1, maxY - minY + padding * 2);
    const x = minX - padding;
    const y = minY - padding;

    canvas.width = w;
    canvas.height = h;

    // Draw with offset
    ctx.save();
    ctx.translate(-x, -y);

    const adjustedStroke: Stroke = {
      ...stroke,
      points: stroke.points.map((p) => ({ x: p.x, y: p.y })),
    };

    tool.render(ctx, adjustedStroke, viewport, asyncRenderService);
    ctx.restore();

    const konvaImage = new Konva.Image({
      x,
      y,
      image: canvas,
    });

    layer.add(konvaImage);
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!activeTool) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setCurrentPoints([pos]);
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawing || !activeTool) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newPoints = [...currentPoints, pos];
    setCurrentPoints(newPoints);

    const newStroke: Stroke = {
      id: nanoid(),
      tool: activeTool.id,
      mode: activeTool.mode,
      points: newPoints,
      data: activeTool.getDefaultData?.() || {},
      authorId: "current-user",
      modeOrigin: activeTool.mode,
      updatedAt: new Date().toISOString(),
    };

    setInProgressStroke(newStroke);
  }

  function handleMouseUp() {
    if (!isDrawing || !activeTool || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      setInProgressStroke(null);
      return;
    }

    const stroke: Stroke = {
      id: nanoid(),
      tool: activeTool.id,
      mode: activeTool.mode,
      points: currentPoints,
      data: activeTool.getDefaultData?.() || {},
      authorId: "current-user",
      modeOrigin: activeTool.mode,
      updatedAt: new Date().toISOString(),
    };

    addStroke(stroke);
    setInProgressStroke(null);
    setIsDrawing(false);
    setCurrentPoints([]);
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();

    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = oldScale * Math.pow(1.1, e.deltaY < 0 ? 1 : -1);
    const newScale_clamped = Math.max(0.1, Math.min(5, newScale));

    stage.scale({ x: newScale_clamped, y: newScale_clamped });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale_clamped,
      y: pointer.y - mousePointTo.y * newScale_clamped,
    };

    stage.position(newPos);
    stage.batchDraw();
  }

  return (
    <div
      className="relative w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
      onWheel={handleWheel}
    >
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        draggable={true}
      >
        {/* Background layer */}
        <Layer ref={layerRefs.current.background}>
          <Rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="#050d18"
          />
        </Layer>

        {/* Elements layer */}
        <Layer ref={layerRefs.current.elements} />

        {/* Active stroke layer */}
        <Layer ref={layerRefs.current.activeStroke} />

        {/* Cursor layer */}
        <Layer ref={layerRefs.current.cursor} />
      </Stage>

      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-2 left-2 bg-slate-800/80 text-xs text-slate-300 p-2 rounded font-mono">
          <div>Tool: {activeTool?.name || "None"}</div>
          <div>Strokes: {strokes.length}</div>
          <div>Points: {currentPoints.length}</div>
        </div>
      )}
    </div>
  );
};
