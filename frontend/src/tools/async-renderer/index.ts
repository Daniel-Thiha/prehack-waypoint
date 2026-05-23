export class AsyncRenderService {
  private cache = new Map<string, HTMLCanvasElement>();
  private rendering = new Map<string, Promise<HTMLCanvasElement>>();
  private failedRenders = new Set<string>();

  async renderKaTeX(
    latex: string,
    color: string,
    id: string,
    fontSize: number = 16
  ): Promise<HTMLCanvasElement> {
    if (this.failedRenders.has(id)) {
      return this.createPlaceholder("LaTeX Error", 100, 40);
    }

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    if (this.rendering.has(id)) {
      return this.rendering.get(id)!;
    }

    const promise = this._doRenderKaTeX(latex, color, id, fontSize);
    this.rendering.set(id, promise);

    try {
      const result = await promise;
      this.cache.set(id, result);
      this.rendering.delete(id);
      return result;
    } catch (e) {
      this.rendering.delete(id);
      this.failedRenders.add(id);
      console.error("KaTeX render failed:", e);
      return this.createPlaceholder("LaTeX Error", 100, 40);
    }
  }

  private async _doRenderKaTeX(
    latex: string,
    color: string,
    id: string,
    fontSize: number
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamically import KaTeX if available
        import("katex")
          .then((KaTeX) => {
            const html = KaTeX.renderToString(latex, { throwOnError: true });

            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 60;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Cannot get 2D context");

            ctx.fillStyle = color;
            ctx.font = `${fontSize}px KaTeX_Main, serif`;
            ctx.textBaseline = "middle";

            // Simple text rendering (fallback if SVG fails)
            ctx.fillText(latex, 10, 30);

            resolve(canvas);
          })
          .catch(() => {
            const canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 60;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = color;
              ctx.font = `12px monospace`;
              ctx.fillText(latex, 10, 30);
            }
            resolve(canvas);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  async renderChart(
    rows: string[][],
    id: string,
    width: number = 300,
    height: number = 200,
    color: string = "#fff"
  ): Promise<HTMLCanvasElement> {
    if (this.failedRenders.has(id)) {
      return this.createPlaceholder("Chart Error", width, height);
    }

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    if (this.rendering.has(id)) {
      return this.rendering.get(id)!;
    }

    const promise = this._doRenderChart(rows, id, width, height, color);
    this.rendering.set(id, promise);

    try {
      const result = await promise;
      this.cache.set(id, result);
      this.rendering.delete(id);
      return result;
    } catch (e) {
      this.rendering.delete(id);
      this.failedRenders.add(id);
      console.error("Chart render failed:", e);
      return this.createPlaceholder("Chart Error", width, height);
    }
  }

  private async _doRenderChart(
    rows: string[][],
    id: string,
    width: number,
    height: number,
    color: string
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      try {
        // Dynamically import Chart.js if available
        import("chart.js")
          .then(({ Chart }) => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const labels = rows[0] || [];
            const data = rows.slice(1).map((row) =>
              row.map((v) => {
                const num = parseFloat(v);
                return isNaN(num) ? 0 : num;
              })
            );

            const chartConfig = {
              type: "bar" as const,
              data: {
                labels,
                datasets: data.map((values, idx) => ({
                  label: `Series ${idx + 1}`,
                  data: values,
                  borderColor: color,
                  backgroundColor: color + "33",
                })),
              },
              options: {
                responsive: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true },
                },
              },
            };

            // @ts-ignore
            new Chart(canvas.getContext("2d"), chartConfig);
            resolve(canvas);
          })
          .catch(() => {
            resolve(this.createPlaceholder("Chart", width, height));
          });
      } catch (e) {
        resolve(this.createPlaceholder("Chart", width, height));
      }
    });
  }

  async renderDagre(
    nodes: Array<{ id: string; label: string }>,
    edges: Array<{ from: string; to: string }>,
    id: string,
    width: number = 300,
    height: number = 200,
    color: string = "#fff"
  ): Promise<HTMLCanvasElement> {
    if (this.failedRenders.has(id)) {
      return this.createPlaceholder("Graph Error", width, height);
    }

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    if (this.rendering.has(id)) {
      return this.rendering.get(id)!;
    }

    const promise = this._doRenderDagre(
      nodes,
      edges,
      id,
      width,
      height,
      color
    );
    this.rendering.set(id, promise);

    try {
      const result = await promise;
      this.cache.set(id, result);
      this.rendering.delete(id);
      return result;
    } catch (e) {
      this.rendering.delete(id);
      this.failedRenders.add(id);
      console.error("Dagre render failed:", e);
      return this.createPlaceholder("Graph Error", width, height);
    }
  }

  private async _doRenderDagre(
    nodes: Array<{ id: string; label: string }>,
    edges: Array<{ from: string; to: string }>,
    id: string,
    width: number,
    height: number,
    color: string
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      try {
        import("dagre")
          .then(({ graphlib, layout }) => {
            const g = new graphlib.Graph();
            g.setGraph({ rankdir: "LR", ranksep: 40, nodesep: 30 });
            g.setDefaultEdgeLabel(() => ({}));

            nodes.forEach((node) => {
              g.setNode(node.id, { label: node.label, width: 80, height: 40 });
            });

            edges.forEach((edge) => {
              g.setEdge(edge.from, edge.to);
            });

            layout(g);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;

            ctx.fillStyle = "#050d18";
            ctx.fillRect(0, 0, width, height);

            g.edges().forEach((e) => {
              const edge = g.edge(e);
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              if (edge.points && edge.points.length > 0) {
                ctx.moveTo(edge.points[0].x, edge.points[0].y);
                for (let i = 1; i < edge.points.length; i++) {
                  ctx.lineTo(edge.points[i].x, edge.points[i].y);
                }
              }
              ctx.stroke();
            });

            g.nodes().forEach((nodeId) => {
              const node = g.node(nodeId);
              ctx.fillStyle = "#1e293b";
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.fillRect(
                node.x - node.width / 2,
                node.y - node.height / 2,
                node.width,
                node.height
              );
              ctx.strokeRect(
                node.x - node.width / 2,
                node.y - node.height / 2,
                node.width,
                node.height
              );

              ctx.fillStyle = "#fff";
              ctx.font = "11px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(node.label, node.x, node.y);
            });

            resolve(canvas);
          })
          .catch(() => {
            resolve(this.createPlaceholder("Graph", width, height));
          });
      } catch (e) {
        resolve(this.createPlaceholder("Graph", width, height));
      }
    });
  }

  private createPlaceholder(
    label: string,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, width / 2, height / 2);

    return canvas;
  }

  clearCache() {
    this.cache.clear();
    this.rendering.clear();
    this.failedRenders.clear();
  }

  cacheSize(): number {
    return this.cache.size;
  }
}

export const asyncRenderService = new AsyncRenderService();
