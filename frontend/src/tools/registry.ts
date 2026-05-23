import type { Tool } from "./types";

type ToolRegistry = Map<string, Tool>;
type ModeTools = Map<string, Tool[]>;

class ToolRegistryService {
  private registry: ToolRegistry = new Map();
  private modeTools: ModeTools = new Map();
  private loadedModes: Set<string> = new Set();

  registerTool(tool: Tool) {
    this.registry.set(tool.id, tool);

    if (!this.modeTools.has(tool.mode)) {
      this.modeTools.set(tool.mode, []);
    }

    const modeArray = this.modeTools.get(tool.mode)!;
    if (!modeArray.some((t) => t.id === tool.id)) {
      modeArray.push(tool);
    }
  }

  registerTools(tools: Tool[]) {
    tools.forEach((tool) => this.registerTool(tool));
  }

  getTool(toolId: string): Tool | undefined {
    return this.registry.get(toolId);
  }

  getToolsByMode(mode: string): Tool[] {
    return this.modeTools.get(mode) || [];
  }

  getAllTools(): Tool[] {
    return Array.from(this.registry.values());
  }

  async loadModeTools(mode: string): Promise<Tool[]> {
    if (this.loadedModes.has(mode)) {
      return this.getToolsByMode(mode);
    }

    try {
      // Dynamically import mode tools based on mode ID
      const moduleMap: Record<string, () => Promise<any>> = {
        engineering: () =>
          import("./modes/engineering/tools").then((m) => m.engineeringTools),
        cs: () =>
          import("./modes/cs/tools").then((m) => m.csTools),
        arts: () =>
          import("./modes/arts/tools").then((m) => m.artsTools),
        architecture: () =>
          import("./modes/architecture/tools").then(
            (m) => m.architectureTools
          ),
        science: () =>
          import("./modes/science/tools").then((m) => m.scienceTools),
        business: () =>
          import("./modes/business/tools").then((m) => m.businessTools),
        mathematics: () =>
          import("./modes/mathematics/tools").then((m) => m.mathematicsTools),
      };

      const loader = moduleMap[mode];
      if (loader) {
        const tools = await loader();
        this.registerTools(tools);
        this.loadedModes.add(mode);
      }

      return this.getToolsByMode(mode);
    } catch (e) {
      console.error(`Failed to load mode tools for "${mode}":`, e);
      return [];
    }
  }

  async loadAllModes(): Promise<void> {
    const modes = [
      "engineering",
      "cs",
      "arts",
      "architecture",
      "science",
      "business",
      "mathematics",
    ];
    await Promise.all(modes.map((m) => this.loadModeTools(m)));
  }

  isModeLoaded(mode: string): boolean {
    return this.loadedModes.has(mode);
  }

  clear() {
    this.registry.clear();
    this.modeTools.clear();
    this.loadedModes.clear();
  }
}

export const toolRegistry = new ToolRegistryService();
