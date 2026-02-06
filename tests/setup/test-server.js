import { serve, file } from "bun";
import { join } from "path";

const DOCS_DIR = join(import.meta.dir, "../../docs");

export function startTestServer() {
  const server = serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      let filePath = url.pathname;

      if (filePath === "/") {
        filePath = "/index.html";
      }

      const fullPath = join(DOCS_DIR, filePath);

      try {
        const fileContent = file(fullPath);
        if (!(await fileContent.exists())) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(fileContent);
      } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  });

  const baseUrl = `http://localhost:${server.port}`;
  return { server, baseUrl };
}
