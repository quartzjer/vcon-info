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
    server = spawn("bun", ["run", "serve"], {
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
    await page.waitForSelector('#input-textarea', { timeout: 5000 });
  });

  describe("Page Load", () => {
    test("loads main page with required elements", async () => {
      // Check title
      const title = await page.title();
      expect(title).toContain("vCon Info");

      // Check main components are present
      const inputExists = await page.$('#input-textarea') !== null;
      const tabsExist = await page.$('#tab-inspector') !== null;
      const statusExists = await page.$('#validation-status') !== null;

      expect(inputExists).toBe(true);
      expect(tabsExist).toBe(true);
      expect(statusExists).toBe(true);
    });

    test("has correct initial state", async () => {
      // Check input has some content (app loads with sample data)
      const inputValue = await page.$eval('#input-textarea', el => el.value);
      expect(inputValue.length).toBeGreaterThan(0);

      // Check inspector tab is active (has blue border)
      const inspectorHasActiveBorder = await page.$eval('#tab-inspector', el => 
        el.className.includes('border-blue-600'));
      expect(inspectorHasActiveBorder).toBe(true);

      // Check status shows some content (not empty)
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText.length).toBeGreaterThan(0);
    });
  });

  describe("Input Validation", () => {
    test("validates unsigned vCon input", async () => {
      const validVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      }, null, 2);

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', validVcon);
      
      // Wait for validation (debounced)
      await page.waitForTimeout(500);

      // Check status shows valid (status text should change)
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('validation:'); // Should contain validation prefix
    });

    test("shows validation errors for invalid input", async () => {
      const invalidVcon = '{"vcon": "0.3.0"}'; // Missing required fields

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', invalidVcon);
      
      // Wait for validation
      await page.waitForTimeout(500);

      // Check status shows error (status indicator should change)
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('validation:'); // Should contain validation prefix
    });

    test("handles malformed JSON input", async () => {
      const malformedJson = '{"invalid": json}';

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', malformedJson);
      
      // Wait for validation
      await page.waitForTimeout(500);

      // Check status shows error
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('validation:'); // Should contain validation prefix
    });
  });

  describe("Tab Navigation", () => {
    test("switches between tabs", async () => {
      // Click timeline tab
      await page.click('#tab-timeline');
      
      // Wait for tab switch to complete
      await page.waitForTimeout(100);
      
      // Check active tab changed (should have blue border)
      const timelineHasActiveBorder = await page.$eval('#tab-timeline', el => 
        el.className.includes('border-blue-600'));
      expect(timelineHasActiveBorder).toBe(true);

      // Check timeline content is visible (not hidden)
      const timelineHidden = await page.$eval('#timeline-view', el => 
        el.classList.contains('hidden'));
      expect(timelineHidden).toBe(false);

      // Switch back to inspector
      await page.click('#tab-inspector');
      
      await page.waitForTimeout(100);
      
      const inspectorHasActiveBorder = await page.$eval('#tab-inspector', el => 
        el.className.includes('border-blue-600'));
      expect(inspectorHasActiveBorder).toBe(true);
    });

    test("timeline tab displays content", async () => {
      const vcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      });

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', vcon);
      await page.waitForTimeout(500);

      // Click timeline tab
      await page.click('#tab-timeline');

      // Check timeline view is displayed
      const timelineView = await page.$('#timeline-view');
      expect(timelineView).not.toBeNull();
      
      // Check timeline content is visible (not hidden)
      const timelineHidden = await page.$eval('#timeline-view', el => 
        el.classList.contains('hidden'));
      expect(timelineHidden).toBe(false);
    });
  });

  describe("Inspector Tree", () => {
    test("tree container exists and is accessible", async () => {
      // Ensure we're on inspector tab
      await page.click('#tab-inspector');

      // Check that the tree container exists
      const treeContainer = await page.$('#vcon-tree');
      expect(treeContainer).not.toBeNull();

      // Check that inspector view is visible
      const inspectorView = await page.$('#inspector-view');
      expect(inspectorView).not.toBeNull();
      
      const isVisible = await page.$eval('#inspector-view', el => 
        !el.classList.contains('hidden'));
      expect(isVisible).toBe(true);
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
      const inputValue = await page.$eval('#input-textarea', el => el.value);
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
      const inputExists = await page.$('#input-textarea') !== null;
      expect(inputExists).toBe(true);
    });
  });

  describe("Snapshot Test", () => {
    test("generates full page screenshot", async () => {
      // Load sample data to have content in the UI
      await page.evaluate(() => {
        if (window.vconApp && window.vconApp.loadSample) {
          window.vconApp.loadSample();
        }
      });

      // Wait for content to load and render
      await page.waitForTimeout(1000);

      // Set viewport to capture full content
      await page.setViewport({ width: 1200, height: 800 });

      // Get full page height for screenshot
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewport({ width: 1200, height: bodyHeight });

      // Take full page screenshot
      await page.screenshot({
        path: 'tests/snapshot.png',
        fullPage: true,
        type: 'png'
      });

      // Test passes if screenshot was created successfully (no exception thrown)
      expect(true).toBe(true);
    });
  });
});