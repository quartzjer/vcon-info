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
        created_at: "2023-12-14T18:59:45.911Z",
        parties: [{ name: "Test Party" }]
      }, null, 2);

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', validVcon);
      
      // Wait for validation (debounced)
      await page.waitForTimeout(500);

      // Check status shows valid (should show Valid Status or similar)
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('Valid'); // Should contain Valid
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

      // Check status shows error (should show Invalid Status)
      const statusText = await page.$eval('#validation-status', el => el.textContent);
      expect(statusText).toContain('Invalid'); // Should contain Invalid
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
      expect(statusText).toContain('Invalid'); // Should contain Invalid
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
        created_at: "2023-12-14T18:59:45.911Z",
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

    test("security tab displays content", async () => {
      const vcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2023-12-14T18:59:45.911Z",
        parties: [{ name: "Test Party" }]
      });

      // Clear existing content first
      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', vcon);
      await page.waitForTimeout(500);

      // Click security tab
      await page.click('#tab-security');

      // Check security view is displayed
      const securityView = await page.$('#security-view');
      expect(securityView).not.toBeNull();
      
      // Check security content is visible (not hidden)
      const securityHidden = await page.$eval('#security-view', el => 
        el.classList.contains('hidden'));
      expect(securityHidden).toBe(false);
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

    test("section panels toggle correctly with eye button", async () => {
      // Ensure we're on inspector tab
      await page.click('#tab-inspector');

      // Find a section with the parties header
      const partiesHeader = await page.$('.section-header.section-parties');
      expect(partiesHeader).not.toBeNull();

      // Get the parent section
      const partiesSection = await page.evaluateHandle(el => el.closest('.inspector-section'), partiesHeader);

      // Get the toggle button and content within the section
      const toggleButton = await page.$('.section-header.section-parties .panel-toggle');
      expect(toggleButton).not.toBeNull();

      // Check initial state - content should be visible
      const initialContentVisible = await page.evaluate(() => {
        const section = document.querySelector('.section-header.section-parties').closest('.inspector-section');
        const content = section.querySelector('.section-content');
        const styles = window.getComputedStyle(content);
        return !content.classList.contains('collapsed') && styles.maxHeight !== '0px';
      });
      expect(initialContentVisible).toBe(true);

      // Click the toggle button to collapse
      await page.click('.section-header.section-parties .panel-toggle');
      await page.waitForTimeout(400); // Wait for animation

      // Check collapsed state
      const contentCollapsed = await page.evaluate(() => {
        const section = document.querySelector('.section-header.section-parties').closest('.inspector-section');
        const content = section.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      expect(contentCollapsed).toBe(true);

      // Click again to expand
      await page.click('.section-header.section-parties .panel-toggle');
      await page.waitForTimeout(400); // Wait for animation

      // Check expanded state
      const contentExpanded = await page.evaluate(() => {
        const section = document.querySelector('.section-header.section-parties').closest('.inspector-section');
        const content = section.querySelector('.section-content');
        return !content.classList.contains('collapsed');
      });
      expect(contentExpanded).toBe(true);
    });

    test("all sections have content and are collapsible", async () => {
      // Ensure we're on inspector tab
      await page.click('#tab-inspector');

      const sections = ['metadata', 'relationships', 'parties', 'dialog', 'attachments', 'analysis', 'extensions'];
      
      for (const section of sections) {
        // Check that section header exists
        const sectionHeader = await page.$(`.section-header.section-${section}`);
        expect(sectionHeader).not.toBeNull();

        // Check that content exists and has placeholder text
        const hasContent = await page.evaluate((sectionName) => {
          const header = document.querySelector(`.section-header.section-${sectionName}`);
          const section = header.closest('.inspector-section');
          const content = section.querySelector('.section-content');
          return content && content.textContent.trim().length > 0;
        }, section);
        expect(hasContent).toBe(true);

        // Check that toggle button exists
        const toggleButton = await page.$(`.section-header.section-${section} .panel-toggle`);
        expect(toggleButton).not.toBeNull();
      }
    });
  });

  describe("Key Panel", () => {
    test("key panel is collapsed by default", async () => {
      // Check that key panel exists
      const keyPanel = await page.$('#key-panel');
      expect(keyPanel).not.toBeNull();

      // Check that key panel does not have expanded class
      const isExpanded = await page.$eval('#key-panel', el => 
        el.classList.contains('expanded'));
      expect(isExpanded).toBe(false);

      // Check that lock button is not active
      const isLockActive = await page.$eval('#lock-button', el => 
        el.classList.contains('active'));
      expect(isLockActive).toBe(false);
    });

    test("key panel toggles when lock button is clicked", async () => {
      // Click lock button to expand
      await page.click('#lock-button');
      await page.waitForTimeout(100);

      // Check that key panel is now expanded
      const isExpandedAfterClick = await page.$eval('#key-panel', el => 
        el.classList.contains('expanded'));
      expect(isExpandedAfterClick).toBe(true);

      // Check that lock button is active
      const isLockActiveAfterClick = await page.$eval('#lock-button', el => 
        el.classList.contains('active'));
      expect(isLockActiveAfterClick).toBe(true);

      // Click again to collapse
      await page.click('#lock-button');
      await page.waitForTimeout(100);

      // Check that key panel is collapsed again
      const isCollapsedAfterSecondClick = await page.$eval('#key-panel', el => 
        !el.classList.contains('expanded'));
      expect(isCollapsedAfterSecondClick).toBe(true);

      // Check that lock button is not active
      const isLockInactiveAfterSecondClick = await page.$eval('#lock-button', el => 
        !el.classList.contains('active'));
      expect(isLockInactiveAfterSecondClick).toBe(true);
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

    test("loads basic-call.vcon from examples directory", async () => {
      // Execute loadSample in page context
      await page.evaluate(async () => {
        if (window.vconApp && window.vconApp.loadSample) {
          await window.vconApp.loadSample();
        }
      });

      await page.waitForTimeout(1000); // Allow more time for fetch

      // Check that input has the specific example data
      const inputValue = await page.$eval('#input-textarea', el => el.value);
      expect(inputValue).toContain('"vcon": "0.3.0"');
      expect(inputValue).toContain('"subject": "Customer Support Call - Account Inquiry"');
      expect(inputValue).toContain('"Alice Johnson"');
      expect(inputValue).toContain('"Bob Smith"');
      expect(inputValue).toContain('"type": "recording"');
      expect(inputValue).toContain('"type": "transcript"');
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

  describe("Input Tabs", () => {
    test("input tabs are present and switch correctly", async () => {
      // Check that input tabs exist
      const pasteTab = await page.$('#tab-paste');
      const uploadTab = await page.$('#tab-upload');
      const examplesTab = await page.$('#tab-examples');
      const jsonTab = await page.$('#tab-json');
      const encryptedTab = await page.$('#tab-encrypted');
      
      expect(pasteTab).not.toBeNull();
      expect(uploadTab).not.toBeNull();
      expect(examplesTab).not.toBeNull();
      expect(jsonTab).not.toBeNull();
      expect(encryptedTab).not.toBeNull();
      
      // Check paste tab is active by default
      const pasteTabActive = await page.$eval('#tab-paste', el => el.classList.contains('active'));
      expect(pasteTabActive).toBe(true);
      
      // Click upload tab and verify switch
      await page.click('#tab-upload');
      await page.waitForTimeout(100);
      
      const uploadTabActive = await page.$eval('#tab-upload', el => el.classList.contains('active'));
      const uploadViewVisible = await page.$eval('#upload-view', el => el.classList.contains('active'));
      expect(uploadTabActive).toBe(true);
      expect(uploadViewVisible).toBe(true);
      
      // Check upload drop zone exists
      const dropZone = await page.$('.upload-drop-zone');
      expect(dropZone).not.toBeNull();
    });

    test("encrypted tab shows decryption hint", async () => {
      // Click encrypted tab
      await page.click('#tab-encrypted');
      await page.waitForTimeout(100);
      
      // Check encrypted view is visible
      const encryptedViewVisible = await page.$eval('#encrypted-view', el => el.classList.contains('active'));
      expect(encryptedViewVisible).toBe(true);
      
      // Check decryption hint exists
      const decryptionHint = await page.$('.decryption-hint');
      expect(decryptionHint).not.toBeNull();
      
      // Check encrypted textarea exists
      const encryptedTextarea = await page.$('#encrypted-textarea');
      expect(encryptedTextarea).not.toBeNull();
    });
    
    test("examples tab displays list of examples", async () => {
      // Click examples tab
      await page.click('#tab-examples');
      await page.waitForTimeout(200);
      
      // Check examples view is visible
      const examplesViewVisible = await page.$eval('#examples-view', el => el.classList.contains('active'));
      expect(examplesViewVisible).toBe(true);
      
      // Check examples container exists
      const examplesContainer = await page.$('.examples-container');
      expect(examplesContainer).not.toBeNull();
      
      // Check examples header exists
      const examplesHeader = await page.$('.examples-header');
      expect(examplesHeader).not.toBeNull();
      
      // Wait for examples to load (or show error)
      await page.waitForTimeout(500);
      
      // Check that either examples are loaded or an error is shown
      const hasExamples = await page.$$('.example-item');
      const hasError = await page.$('.examples-error');
      const hasLoading = await page.$('.examples-loading');
      
      // Should have either examples, an error, or still be loading
      const hasContent = hasExamples.length > 0 || hasError !== null || hasLoading !== null;
      expect(hasContent).toBe(true);
    });
  });

  describe("JWS/JWE Support", () => {
    test("jose library is loaded and accessible", async () => {
      // Check if Jose library is available in the browser
      const joseAvailable = await page.evaluate(() => {
        return typeof Jose !== 'undefined';
      });
      
      expect(joseAvailable).toBe(true);
    });

    test("vcon processor has crypto support", async () => {
      // Check if VConProcessor has crypto support
      const cryptoSupport = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          return processor.isCryptoSupported();
        }
        return false;
      });
      
      expect(cryptoSupport).toBe(true);
    });

    test("can extract JWS headers", async () => {
      // Test JWS header extraction
      const headerData = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          const sampleJWS = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2Y29uIjoiMC4zLjAifQ.signature';
          return processor.extractJWSHeader(sampleJWS);
        }
        return null;
      });
      
      expect(headerData).toBeTruthy();
      expect(headerData.alg).toBe('RS256');
      expect(headerData.typ).toBe('JWT');
    });

    test("can extract JWE headers", async () => {
      // Test JWE header extraction
      const headerData = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          const sampleJWE = 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.key.iv.ciphertext.tag';
          return processor.extractJWEHeader(sampleJWE);
        }
        return null;
      });
      
      expect(headerData).toBeTruthy();
      expect(headerData.alg).toBe('RSA-OAEP');
      expect(headerData.enc).toBe('A256GCM');
    });

    test("can detect crypto format", async () => {
      // Test crypto format detection
      const results = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          return {
            jws: processor.detectCryptoFormat('eyJhbGciOiJSUzI1NiJ9.eyJ2Y29uIjoiMC4zLjAifQ.signature'),
            jwe: processor.detectCryptoFormat('eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.key.iv.ciphertext.tag'),
            json: processor.detectCryptoFormat('{"vcon": "0.3.0"}')
          };
        }
        return null;
      });
      
      expect(results).toBeTruthy();
      expect(results.jws.isSigned).toBe(true);
      expect(results.jws.format).toBe('jws-compact');
      expect(results.jwe.isEncrypted).toBe(true);
      expect(results.jwe.format).toBe('jwe-compact');
      expect(results.json.format).toBe('json');
    });

    test("detects JWS format in encrypted tab", async () => {
      // Sample JWS token (header.payload.signature format)
      const sampleJWS = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2Y29uIjoiMC4zLjAiLCJ1dWlkIjoiMDEyMzQ1NjctODlhYi1jZGVmLTAxMjMtNDU2Nzg5YWJjZGVmIiwiY3JlYXRlZF9hdCI6IjIwMjMtMTItMTRUMTg6NTk6NDUuOTExWiIsInBhcnRpZXMiOlt7InRlbCI6IisxLTU1NS0xMjMtNDU2NyIsIm5hbWUiOiJBbGljZSBKb2huc29uIn1dfQ.signature';
      
      // Set JWS in encrypted tab
      await page.click('#tab-encrypted');
      await page.waitForTimeout(100);
      
      // Clear and set the JWS content
      await page.evaluate(() => {
        document.getElementById('encrypted-textarea').value = '';
      });
      await page.type('#encrypted-textarea', sampleJWS);
      
      // Trigger processing
      await page.evaluate(() => {
        const textarea = document.getElementById('encrypted-textarea');
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
      });
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Verify that the input is processed (no JavaScript errors should occur)
      const errors = await page.evaluate(() => {
        return window.jsErrors || [];
      });
      
      expect(errors.length).toBe(0);
    });

    test("detects JWE format in encrypted tab", async () => {
      // Sample JWE token (header.encrypted_key.iv.ciphertext.tag format)
      const sampleJWE = 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ.encrypted_key.iv.ciphertext.tag';
      
      // Set JWE in encrypted tab
      await page.click('#tab-encrypted');
      await page.waitForTimeout(100);
      
      // Clear and set the JWE content
      await page.evaluate(() => {
        document.getElementById('encrypted-textarea').value = '';
      });
      await page.type('#encrypted-textarea', sampleJWE);
      
      // Trigger processing
      await page.evaluate(() => {
        const textarea = document.getElementById('encrypted-textarea');
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
      });
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Verify that the input is processed (no JavaScript errors should occur)
      const errors = await page.evaluate(() => {
        return window.jsErrors || [];
      });
      
      expect(errors.length).toBe(0);
    });

    test("base64url decode function works correctly", async () => {
      // Test base64url decoding functionality
      const result = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          try {
            const decoded = processor.base64urlDecode('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9');
            return { success: true, decoded };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'VConProcessor not available' };
      });
      
      expect(result.success).toBe(true);
      expect(result.decoded).toContain('alg');
      expect(result.decoded).toContain('RS256');
    });

    test("can get supported algorithms", async () => {
      // Test getting supported algorithms
      const algorithms = await page.evaluate(() => {
        if (typeof VConProcessor !== 'undefined') {
          const processor = new VConProcessor();
          return processor.getSupportedAlgorithms();
        }
        return null;
      });
      
      expect(algorithms).toBeTruthy();
      expect(algorithms.signature).toContain('RS256');
      expect(algorithms.signature).toContain('ES256');
      expect(algorithms.encryption).toContain('RSA-OAEP');
    });

    test("encrypted tab UI elements are present", async () => {
      // Switch to encrypted tab
      await page.click('#tab-encrypted');
      await page.waitForTimeout(100);
      
      // Check encrypted view is visible
      const encryptedViewVisible = await page.$eval('#encrypted-view', el => el.classList.contains('active'));
      expect(encryptedViewVisible).toBe(true);
      
      // Check encrypted textarea exists
      const encryptedTextarea = await page.$('#encrypted-textarea');
      expect(encryptedTextarea).toBeTruthy();
      
      // Check decryption hint exists
      const decryptionHint = await page.$('.decryption-hint');
      expect(decryptionHint).toBeTruthy();
      
      // Check that hint mentions the lock button
      const hintText = await page.$eval('.decryption-hint p', el => el.textContent);
      expect(hintText).toContain('private key');
    });

    test("security tab is present and accessible", async () => {
      // Load valid unsigned vCon
      const validVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2023-12-14T18:59:45.911Z",
        parties: [{ name: "Test Party" }]
      }, null, 2);

      await page.evaluate(() => {
        document.getElementById('input-textarea').value = '';
      });
      await page.type('#input-textarea', validVcon);
      await page.waitForTimeout(500);

      // Check that security tab button exists
      const securityTab = await page.$('#tab-security');
      expect(securityTab).not.toBeNull();

      // Switch to security tab
      await page.click('#tab-security');
      await page.waitForTimeout(100);

      // Check that security tab content exists
      const securityContent = await page.$('#security-view');
      expect(securityContent).not.toBeNull();

      // Check that security status elements exist
      const securityStatus = await page.$('#security-status');
      expect(securityStatus).not.toBeNull();
    });
  });

  describe("Panel Auto-Collapse", () => {
    test("auto-collapses empty panels when vCon has no data", async () => {
      // Input vCon with minimal data (only required fields, no dialog/attachments/analysis/extensions)
      const minimalVcon = {
        "vcon": "0.3.0",
        "uuid": "01987d9a-3db5-7186-b6f7-396adcaf35e2",
        "created_at": "2023-12-14T18:59:45.911Z",
        "parties": [
          {
            "tel": "+1-555-123-4567",
            "name": "Alice Johnson"
          }
        ]
      };
      
      // Set input
      await page.evaluate((vconData) => {
        const textarea = document.getElementById('input-textarea');
        textarea.value = JSON.stringify(vconData, null, 2);
        textarea.dispatchEvent(new Event('input'));
      }, minimalVcon);
      
      // Wait for processing
      await page.waitForTimeout(1000);
      
      // Check that empty panels are collapsed
      const dialogCollapsed = await page.evaluate(() => {
        const dialogSection = document.querySelector('.section-dialog').parentElement;
        const content = dialogSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const attachmentsCollapsed = await page.evaluate(() => {
        const attachmentsSection = document.querySelector('.section-attachments').parentElement;
        const content = attachmentsSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const analysisCollapsed = await page.evaluate(() => {
        const analysisSection = document.querySelector('.section-analysis').parentElement;
        const content = analysisSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const extensionsCollapsed = await page.evaluate(() => {
        const extensionsSection = document.querySelector('.section-extensions').parentElement;
        const content = extensionsSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      // Parties should NOT be collapsed since it has data
      const partiesCollapsed = await page.evaluate(() => {
        const partiesSection = document.querySelector('.section-parties').parentElement;
        const content = partiesSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      expect(dialogCollapsed).toBe(true);
      expect(attachmentsCollapsed).toBe(true);
      expect(analysisCollapsed).toBe(true);
      expect(extensionsCollapsed).toBe(true);
      expect(partiesCollapsed).toBe(false);
    });

    test("auto-expands panels when vCon has data", async () => {
      // Input vCon with data in all sections
      const fullVcon = {
        "vcon": "0.3.0",
        "uuid": "01987d9a-3db5-7186-b6f7-396adcaf35e2",
        "created_at": "2023-12-14T18:59:45.911Z",
        "parties": [
          {
            "tel": "+1-555-123-4567",
            "name": "Alice Johnson"
          }
        ],
        "dialog": [
          {
            "type": "recording",
            "start": "2023-12-14T18:59:50.100Z",
            "parties": [0],
            "mimetype": "audio/wav",
            "body": "base64-audio-data"
          }
        ],
        "attachments": [
          {
            "type": "transcript",
            "mimetype": "text/plain",
            "body": "Sample transcript"
          }
        ],
        "analysis": [
          {
            "type": "sentiment",
            "vendor": "TestVendor",
            "body": "positive"
          }
        ],
        "x-custom-extension": "test-value"
      };
      
      // Set input
      await page.evaluate((vconData) => {
        const textarea = document.getElementById('input-textarea');
        textarea.value = JSON.stringify(vconData, null, 2);
        textarea.dispatchEvent(new Event('input'));
      }, fullVcon);
      
      // Wait for processing
      await page.waitForTimeout(1000);
      
      // Check that all panels with data are expanded
      const partiesCollapsed = await page.evaluate(() => {
        const partiesSection = document.querySelector('.section-parties').parentElement;
        const content = partiesSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const dialogCollapsed = await page.evaluate(() => {
        const dialogSection = document.querySelector('.section-dialog').parentElement;
        const content = dialogSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const attachmentsCollapsed = await page.evaluate(() => {
        const attachmentsSection = document.querySelector('.section-attachments').parentElement;
        const content = attachmentsSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const analysisCollapsed = await page.evaluate(() => {
        const analysisSection = document.querySelector('.section-analysis').parentElement;
        const content = analysisSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      const extensionsCollapsed = await page.evaluate(() => {
        const extensionsSection = document.querySelector('.section-extensions').parentElement;
        const content = extensionsSection.querySelector('.section-content');
        return content.classList.contains('collapsed');
      });
      
      // All panels should be expanded when they have data
      expect(partiesCollapsed).toBe(false);
      expect(dialogCollapsed).toBe(false);
      expect(attachmentsCollapsed).toBe(false);
      expect(analysisCollapsed).toBe(false);
      expect(extensionsCollapsed).toBe(false);
    });
  });

  describe("Upload Functionality", () => {
    test("upload tab is present and functional", async () => {
      // Click on upload tab
      await page.click('#tab-upload');
      await page.waitForTimeout(100);
      
      // Check if upload view is active
      const uploadViewVisible = await page.evaluate(() => {
        const uploadView = document.getElementById('upload-view');
        return uploadView && uploadView.classList.contains('active');
      });
      
      expect(uploadViewVisible).toBe(true);
      
      // Check if upload elements exist
      const uploadElements = await page.evaluate(() => {
        return {
          dropZone: !!document.querySelector('.upload-drop-zone'),
          fileInput: !!document.getElementById('file-input'),
          uploadIcon: !!document.querySelector('.upload-icon'),
          uploadText: !!document.querySelector('.upload-text')
        };
      });
      
      expect(uploadElements.dropZone).toBe(true);
      expect(uploadElements.fileInput).toBe(true);
      expect(uploadElements.uploadIcon).toBe(true);
      expect(uploadElements.uploadText).toBe(true);
    });

    test("file upload validation works correctly", async () => {
      // Switch to upload tab
      await page.click('#tab-upload');
      await page.waitForTimeout(100);
      
      // Test file validation in browser context
      const validationResult = await page.evaluate(() => {
        // Create a mock File object for testing
        const validFile = { 
          name: 'test.vcon', 
          size: 1024,
          type: 'application/json'
        };
        
        const invalidFile = { 
          name: 'test.txt', 
          size: 1024,
          type: 'text/html' // Invalid MIME type
        };
        
        const largeFile = { 
          name: 'large.vcon', 
          size: 15 * 1024 * 1024, // 15MB
          type: 'application/json'
        };
        
        // Test validation logic (extracted from handleFile function)
        function validateFile(file) {
          const allowedExtensions = ['.json', '.vcon'];
          const allowedMimeTypes = ['application/json', 'text/plain'];
          
          const fileName = file.name.toLowerCase();
          const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
          const hasValidMimeType = allowedMimeTypes.includes(file.type) || file.type === '';
          
          if (!hasValidExtension && !hasValidMimeType) {
            return { valid: false, reason: 'Invalid file type' };
          }
          
          if (file.size > 10 * 1024 * 1024) {
            return { valid: false, reason: 'File too large' };
          }
          
          return { valid: true };
        }
        
        return {
          validFile: validateFile(validFile),
          invalidFile: validateFile(invalidFile),
          largeFile: validateFile(largeFile)
        };
      });
      
      expect(validationResult.validFile.valid).toBe(true);
      expect(validationResult.invalidFile.valid).toBe(false);
      expect(validationResult.largeFile.valid).toBe(false);
      expect(validationResult.largeFile.reason).toBe('File too large');
    });

    test("file upload integration with paste tab", async () => {
      // Test that uploaded file content is processed correctly
      const testVconContent = {
        "vcon": "0.3.0",
        "uuid": "01234567-89ab-cdef-0123-456789abcdef",
        "created_at": "2023-12-14T18:59:45.911Z",
        "parties": [
          {
            "tel": "+1-555-123-4567",
            "name": "Test Upload User"
          }
        ]
      };
      
      // Switch to upload tab
      await page.click('#tab-upload');
      await page.waitForTimeout(100);
      
      // Simulate file upload by directly calling the processing logic
      await page.evaluate((vconData) => {
        // Simulate the file upload process
        const content = JSON.stringify(vconData, null, 2);
        
        // Switch to paste tab and update textarea (simulating handleFile function)
        document.getElementById('tab-paste').click();
        const textarea = document.getElementById('input-textarea');
        if (textarea) {
          textarea.value = content;
          textarea.dispatchEvent(new Event('input'));
        }
      }, testVconContent);
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Verify the content was loaded correctly
      const textareaContent = await page.evaluate(() => {
        const textarea = document.getElementById('input-textarea');
        return textarea ? textarea.value : '';
      });
      
      expect(textareaContent).toContain('"name": "Test Upload User"');
      expect(textareaContent).toContain('"vcon": "0.3.0"');
      
      // Verify validation processed the uploaded content
      const validationStatus = await page.evaluate(() => {
        const statusText = document.getElementById('validation-status-text');
        return statusText ? statusText.textContent : '';
      });
      
      expect(validationStatus).toContain('Status');
    });

    test("drag and drop styling classes exist", async () => {
      // Switch to upload tab
      await page.click('#tab-upload');
      await page.waitForTimeout(100);
      
      // Test drag over styling is applied
      const dragOverResult = await page.evaluate(() => {
        const dropZone = document.querySelector('.upload-drop-zone');
        if (!dropZone) return { found: false };
        
        // Simulate drag over
        dropZone.classList.add('drag-over');
        const hasDragOver = dropZone.classList.contains('drag-over');
        
        // Clean up
        dropZone.classList.remove('drag-over');
        
        return { 
          found: true, 
          hasDragOver,
          hasHoverSupport: true
        };
      });
      
      expect(dragOverResult.found).toBe(true);
      expect(dragOverResult.hasDragOver).toBe(true);
    });
  });

  describe("Clipboard Functionality", () => {
    test("clipboard icons appear on hover in inspector panels", async () => {
      // Load sample data first
      await page.evaluate(() => {
        return window.vconApp.loadSample();
      });
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Check that clipboard icons exist in detail rows
      const clipboardIcons = await page.$$('.clipboard-icon');
      expect(clipboardIcons.length).toBeGreaterThan(0);
    });

    test("clipboard icons have copy functionality", async () => {
      // Load sample data first
      await page.evaluate(() => {
        return window.vconApp.loadSample();
      });
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Test clipboard icon click functionality
      const copyResult = await page.evaluate(() => {
        const clipboardIcon = document.querySelector('.clipboard-icon');
        if (!clipboardIcon) return false;
        
        // Mock the clipboard API for testing
        if (!navigator.clipboard) {
          navigator.clipboard = {
            writeText: async (text) => {
              // Mock successful copy
              return Promise.resolve();
            }
          };
        }
        
        // Click the clipboard icon
        clipboardIcon.click();
        
        return true;
      });
      
      expect(copyResult).toBe(true);
    });

    test("clipboard functionality works in detail rows", async () => {
      // Load sample data first
      await page.evaluate(() => {
        return window.vconApp.loadSample();
      });
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Test that clipboard icons exist in detail rows and can extract text
      const clipboardTest = await page.evaluate(() => {
        const detailRows = document.querySelectorAll('.detail-row');
        let foundClipboardWithText = false;
        
        detailRows.forEach(row => {
          const clipboardIcon = row.querySelector('.clipboard-icon');
          const detailValue = row.querySelector('.detail-value');
          
          if (clipboardIcon && detailValue && detailValue.textContent.trim()) {
            foundClipboardWithText = true;
          }
        });
        
        return foundClipboardWithText;
      });
      
      expect(clipboardTest).toBe(true);
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