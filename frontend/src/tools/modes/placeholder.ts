import type { Tool } from "../types";

const createPlaceholderTool = (id: string, mode: string, name: string, icon: string): Tool => ({
  id,
  mode,
  name,
  icon,
  render: (ctx) => {
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText(`[${name}]`, 10, 20);
  },
  ui: {},
  acceptsInput: () => false,
});

export const csTools: Tool[] = [
  createPlaceholderTool("system-shape", "cs", "System Shape", "🖥️"),
  createPlaceholderTool("smart-connector", "cs", "Smart Connector", "➜"),
  createPlaceholderTool("code-block", "cs", "Code Block", "</"),
  createPlaceholderTool("uml-class", "cs", "UML Class", "⬜"),
  createPlaceholderTool("graph-node", "cs", "Graph Node", "◯"),
  createPlaceholderTool("complexity-stamp", "cs", "Complexity", "O(n)"),
  createPlaceholderTool("sequence-diagram", "cs", "Sequence", "⇒"),
  createPlaceholderTool("db-schema", "cs", "DB Schema", "🗄️"),
];

export const artsTools: Tool[] = [
  createPlaceholderTool("pressure-brush", "arts", "Brush", "🖌️"),
  createPlaceholderTool("annotation-pin", "arts", "Pin", "📌"),
  createPlaceholderTool("frame-artboard", "arts", "Frame", "🖼️"),
  createPlaceholderTool("grid-overlay", "arts", "Grid", "⊞"),
  createPlaceholderTool("typography", "arts", "Typography", "𝐀"),
  createPlaceholderTool("eyedropper", "arts", "Eyedropper", "🎨"),
  createPlaceholderTool("reference-image", "arts", "Reference", "🖼️"),
  createPlaceholderTool("color-palette", "arts", "Palette", "🌈"),
];

export const architectureTools: Tool[] = [
  createPlaceholderTool("wall-tool", "architecture", "Wall", "🧱"),
  createPlaceholderTool("floor-symbol", "architecture", "Floor", "🚪"),
  createPlaceholderTool("dimension-tool", "architecture", "Dimension", "📏"),
  createPlaceholderTool("north-arrow", "architecture", "North", "⬆️"),
  createPlaceholderTool("section-marker", "architecture", "Section", "✂️"),
  createPlaceholderTool("grid-snap", "architecture", "Grid", "⊞"),
  createPlaceholderTool("freehand-sketch", "architecture", "Sketch", "✏️"),
  createPlaceholderTool("guides", "architecture", "Guides", "┃"),
];

export const scienceTools: Tool[] = [
  createPlaceholderTool("diagram-template", "science", "Diagram", "🔬"),
  createPlaceholderTool("chem-formula", "science", "Formula", "H₂O"),
  createPlaceholderTool("reaction-arrow", "science", "Reaction", "⇌"),
  createPlaceholderTool("data-table", "science", "Table", "📊"),
  createPlaceholderTool("timeline", "science", "Timeline", "⏱️"),
  createPlaceholderTool("hypothesis", "science", "Hypothesis", "💡"),
  createPlaceholderTool("graph-sketch", "science", "Graph", "📈"),
  createPlaceholderTool("scale-bar", "science", "Scale", "↔️"),
];

export const businessTools: Tool[] = [
  createPlaceholderTool("matrix-template", "business", "Matrix", "⬜"),
  createPlaceholderTool("mind-map", "business", "Mind Map", "🧠"),
  createPlaceholderTool("kanban", "business", "Kanban", "📋"),
  createPlaceholderTool("org-chart", "business", "Org Chart", "👥"),
  createPlaceholderTool("chart-embed", "business", "Chart", "📊"),
  createPlaceholderTool("timeline-gantt", "business", "Gantt", "📅"),
  createPlaceholderTool("sticky-cluster", "business", "Cluster", "📝"),
  createPlaceholderTool("stakeholder-map", "business", "Stakeholder", "🎯"),
];

export const mathematicsTools: Tool[] = [
  createPlaceholderTool("latex-block", "mathematics", "LaTeX", "∑"),
  createPlaceholderTool("coord-plane", "mathematics", "Coordinates", "📐"),
  createPlaceholderTool("proof-block", "mathematics", "Proof", "∴"),
  createPlaceholderTool("number-line", "mathematics", "Number Line", "←→"),
  createPlaceholderTool("matrix-grid", "mathematics", "Matrix", "⬜"),
  createPlaceholderTool("geometric-construction", "mathematics", "Geometry", "📐"),
  createPlaceholderTool("statistics-plot", "mathematics", "Statistics", "📊"),
  createPlaceholderTool("set-notation", "mathematics", "Sets", "∅"),
];
