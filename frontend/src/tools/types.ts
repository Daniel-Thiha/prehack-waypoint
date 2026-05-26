export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface StrokeData {
  color: string;
  width: number;
  shapeVariant?: string;
  text?: string;
  subtext?: string;
  rows?: string[][];
  label?: string;
  isReversible?: boolean;
  connectorType?: "dashed" | "extends" | "association" | "solid" | "default" | "implements" | "forward" | "reverse" | "equilibrium" | "resonance";
  fontSize?: number;
  fontFamily?: string;
  [key: string]: any;
}

export interface Stroke {
  id: string;
  tool: string;
  mode: string;
  points: Point[];
  data: StrokeData;
  authorId: string;
  modeOrigin: string;
  updatedAt: string;
}

export interface ToolUIConfig {
  hasText?: boolean;
  hasVariant?: boolean;
  hasRows?: boolean;
  hasLabel?: boolean;
  hasSubtext?: boolean;
}

export interface Tool {
  id: string;
  mode: string;
  name: string;
  icon: string;
  color?: string;
  description?: string;

  render: (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    viewport: Viewport,
    asyncRenderer: any
  ) => void;

  variants?: string[];
  ui: ToolUIConfig;

  acceptsInput: (pointCount: number) => boolean;

  getDefaultData?: () => Partial<StrokeData>;
}

export interface ToolMode {
  id: string;
  name: string;
  accent: string;
  bg: string;
  icon: string;
  description?: string;
}

export const MODES: Record<string, ToolMode> = {
  engineering: {
    id: "engineering",
    name: "Engineering",
    accent: "#BA7517",
    bg: "#faeeda",
    icon: "⚡",
    description: "Circuit design, blocks, equations",
  },
  cs: {
    id: "cs",
    name: "CS & Software",
    accent: "#378ADD",
    bg: "#e6f1fb",
    icon: "💻",
    description: "System design, UML, code blocks",
  },
  arts: {
    id: "arts",
    name: "Arts & Design",
    accent: "#D4537E",
    bg: "#fbeaf0",
    icon: "🎨",
    description: "Brush, frames, typography, colors",
  },
  architecture: {
    id: "architecture",
    name: "Architecture",
    accent: "#888780",
    bg: "#f1efe8",
    icon: "🏗️",
    description: "Walls, floors, dimensions, sections",
  },
  science: {
    id: "science",
    name: "Science / BIO",
    accent: "#1D9E75",
    bg: "#e1f5ee",
    icon: "🔬",
    description: "Cells, reactions, diagrams, data",
  },
  business: {
    id: "business",
    name: "Business / Finance",
    accent: "#7F77DD",
    bg: "#eeedfe",
    icon: "📊",
    description: "Matrices, org charts, kanban, charts",
  },
  mathematics: {
    id: "mathematics",
    name: "Mathematics",
    accent: "#D85A30",
    bg: "#faece7",
    icon: "∑",
    description: "LaTeX, coordinates, proofs, matrices",
  },
};
