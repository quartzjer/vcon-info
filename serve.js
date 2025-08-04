#!/usr/bin/env bun

// Simple static file server for testing
import { file, serve } from "bun";
import { join } from "path";

const PORT = process.env.PORT || 8080;
const DOCS_DIR = join(import.meta.dir, "docs");

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;
    
    // Default to index.html for root
    if (filePath === "/") {
      filePath = "/index.html";
    }
    
    // Serve files from docs directory
    const fullPath = join(DOCS_DIR, filePath);
    
    try {
      const fileContent = file(fullPath);
      
      // Check if file exists
      if (!(await fileContent.exists())) {
        return new Response("Not Found", { status: 404 });
      }
      
      return new Response(fileContent);
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`📁 Serving files from: ${DOCS_DIR}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.stop();
  process.exit(0);
});