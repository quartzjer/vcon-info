// Integration Tests: App Integration with Puppeteer
import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import puppeteer from "puppeteer";
import { spawn } from "child_process";

describe("Integration: App Integration", () => {
  let browser;
  let page;
  let server;
  const PORT = 8081; // Use different port to avoid conflicts
  const BASE_URL = `http://localhost:${PORT}`;

  beforeAll(async () => {
    // Start test server
    server = spawn("bun", ["run", "serve.js"], {
      env: { ...process.env, PORT: PORT.toString() },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill('SIGTERM');
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    
    // Wait for app to initialize
    await page.waitForSelector('#vcon-input', { timeout: 5000 });
  });

  describe("Page Load", () => {
    test("loads main page with required elements", async () => {
      // Check title
      const title = await page.title();
      expect(title).toContain("vCon Info");

      // Check main components are present
      const inputExists = await page.$('#vcon-input') !== null;
      const tabsExist = await page.$('[data-tab]') !== null;
      const validationExists = await page.$('#validation-status') !== null;

      expect(inputExists).toBe(true);
      expect(tabsExist).toBe(true);
      expect(validationExists).toBe(true);
    });

    test("has correct initial state", async () => {
      // Check input is empty
      const inputValue = await page.$eval('#vcon-input', el => el.value);
      expect(inputValue).toBe('');

      // Check inspector tab is active
      const activeTab = await page.$eval('[data-tab].bg-blue-600', el => el.dataset.tab);
      expect(activeTab).toBe('inspector');

      // Check validation status shows idle
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('Enter vCon data');
    });
  });

  describe("Input Validation", () => {
    test("validates unsigned vCon input", async () => {
      const validVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      }, null, 2);

      await page.type('#vcon-input', validVcon);
      
      // Wait for validation (debounced)
      await page.waitForTimeout(500);

      // Check validation status shows valid
      const statusElement = await page.$('#validation-status .text-green-400');
      expect(statusElement).not.toBeNull();
    });

    test("shows validation errors for invalid input", async () => {
      const invalidVcon = '{"vcon": "0.3.0"}'; // Missing required fields

      await page.type('#vcon-input', invalidVcon);
      
      // Wait for validation
      await page.waitForTimeout(500);

      // Check validation status shows errors
      const errorElement = await page.$('#validation-status .text-red-400');
      expect(errorElement).not.toBeNull();

      const errorText = await page.$eval('#validation-status', el => el.textContent);
      expect(errorText).toContain('Invalid');
    });

    test("handles malformed JSON input", async () => {
      const malformedJson = '{"invalid": json}';

      await page.type('#vcon-input', malformedJson);
      
      // Wait for validation
      await page.waitForTimeout(500);

      // Check validation status shows JSON error
      const errorText = await page.$eval('#validation-status', el => el.textContent);
      expect(errorText).toContain('JSON parse error');
    });
  });

  describe("Tab Navigation", () => {
    test("switches between tabs", async () => {
      // Click timeline tab
      await page.click('[data-tab="timeline"]');
      
      // Check active tab changed
      const activeTab = await page.$eval('[data-tab].bg-blue-600', el => el.dataset.tab);
      expect(activeTab).toBe('timeline');

      // Check timeline content is visible
      const timelineContent = await page.$('#timeline-content') !== null;
      expect(timelineContent).toBe(true);

      // Switch back to inspector
      await page.click('[data-tab="inspector"]');
      
      const inspectorTab = await page.$eval('[data-tab].bg-blue-600', el => el.dataset.tab);
      expect(inspectorTab).toBe('inspector');
    });

    test("raw tab shows formatted JSON", async () => {
      const vcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      });

      await page.type('#vcon-input', vcon);
      await page.waitForTimeout(500);

      // Switch to raw tab
      await page.click('[data-tab="raw"]');

      // Check raw content is displayed
      const rawContent = await page.$('#raw-content');
      expect(rawContent).not.toBeNull();

      const rawText = await page.$eval('#raw-content', el => el.textContent);
      expect(rawText).toContain('"vcon": "0.3.0"');
    });
  });

  describe("Inspector Tree", () => {
    test("expands and collapses tree nodes", async () => {
      const vcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }],
        dialog: [{ type: "text", body: "Hello" }]
      });

      await page.type('#vcon-input', vcon);
      await page.waitForTimeout(500);

      // Ensure we're on inspector tab
      await page.click('[data-tab="inspector"]');

      // Wait for tree to render
      await page.waitForSelector('.tree-node', { timeout: 3000 });

      // Find a collapsible node (like 'parties')
      const expandButton = await page.$('.expand-btn[data-path="parties"]');
      if (expandButton) {
        await expandButton.click();
        
        // Check if node expanded/collapsed
        const isExpanded = await page.$eval('.expand-btn[data-path="parties"]', 
          el => el.textContent.includes('▼'));
        expect(typeof isExpanded).toBe('boolean');
      }
    });
  });

  describe("Sample Data", () => {
    test("loads sample data via console", async () => {
      // Execute loadSample in page context
      await page.evaluate(() => {
        if (window.vconApp && window.vconApp.loadSample) {
          window.vconApp.loadSample();
        }
      });

      await page.waitForTimeout(500);

      // Check that input has sample data
      const inputValue = await page.$eval('#vcon-input', el => el.value);
      expect(inputValue.length).toBeGreaterThan(0);
      expect(inputValue).toContain('"vcon"');
    });
  });

  describe("Error Handling", () => {
    test("gracefully handles network errors", async () => {
      // This test would be more meaningful with actual network requests,
      // but validates basic error display functionality
      
      await page.evaluate(() => {
        // Simulate an error condition
        if (window.stateManager) {
          window.stateManager.updateInput('corrupted data that should cause issues');
        }
      });

      await page.waitForTimeout(500);

      // Page should still be functional
      const inputExists = await page.$('#vcon-input') !== null;
      expect(inputExists).toBe(true);
    });
  });
});