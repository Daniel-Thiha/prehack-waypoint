export interface Point {
  x: number;
  y: number;
}

export type ToolType = "select" | "pen" | "eraser" | "line" | "rect" | "circle" | "text" | "sticky" | "image";

export interface Stroke {
  id: string;
  tool: ToolType;
  color: string;
  width: number;
  points: Point[];
  text?: string;
  fontSize?: number;
  backgroundColor?: string;
  imageData?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}
