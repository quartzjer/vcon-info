import { beforeAll, afterAll, describe, it, expect } from 'bun:test';
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

let browser;
let page;
let server;

const BASE_URL = 'http://localhost:8080';

describe('Mobile Responsiveness Tests', () => {
  beforeAll(async () => {
    // Start the development server
    server = spawn('bun', ['run', 'serve'], {
      stdio: 'pipe',
      detached: false
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill();
    }
  });

  describe('Mobile Layout', () => {
    it('should stack panels vertically on mobile screens', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
      await page.goto(BASE_URL);
      await page.waitForSelector('.main-content');
      
      const gridColumns = await page.evaluate(() => {
        const element = document.querySelector('.main-content');
        return window.getComputedStyle(element).gridTemplateColumns;
      });
      
      // Should be single column layout on mobile (one value, not two)
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBe(1);
    });

    it('should have touch-friendly button sizes on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      const lockButton = await page.$('.lock-button');
      const buttonBox = await lockButton.boundingBox();
      
      // Touch targets should be at least 44px for accessibility
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    });

    it('should stack tabs vertically on very small screens', async () => {
      await page.setViewport({ width: 320, height: 568 }); // iPhone 5 size
      await page.goto(BASE_URL);
      await page.waitForSelector('.tabs');
      
      const flexDirection = await page.evaluate(() => {
        const element = document.querySelector('.tabs');
        return window.getComputedStyle(element).flexDirection;
      });
      
      expect(flexDirection).toBe('column');
    });

    it('should adjust header layout on mobile', async () => {
      await page.setViewport({ width: 480, height: 800 });
      await page.goto(BASE_URL);
      await page.waitForSelector('.header-container');
      
      const flexDirection = await page.evaluate(() => {
        const element = document.querySelector('.header-container');
        return window.getComputedStyle(element).flexDirection;
      });
      
      expect(flexDirection).toBe('column');
    });
  });

  describe('Tablet Layout', () => {
    it('should have proper layout on tablet screens', async () => {
      // Set tablet viewport
      await page.setViewport({ width: 768, height: 1024 }); // iPad size
      await page.goto(BASE_URL);
      await page.waitForSelector('.main-content');
      
      const gridColumns = await page.evaluate(() => {
        const element = document.querySelector('.main-content');
        return window.getComputedStyle(element).gridTemplateColumns;
      });
      
      // Should still be single column on tablet
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBe(1);
    });

    it('should allow tab wrapping on tablets', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      await page.waitForSelector('.tabs');
      
      const flexWrap = await page.evaluate(() => {
        const element = document.querySelector('.tabs');
        return window.getComputedStyle(element).flexWrap;
      });
      
      expect(flexWrap).toBe('wrap');
    });
  });

  describe('Desktop Layout', () => {
    it('should maintain two-column layout on desktop', async () => {
      // Set desktop viewport
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(BASE_URL);
      await page.waitForSelector('.main-content');
      
      const gridColumns = await page.evaluate(() => {
        const element = document.querySelector('.main-content');
        return window.getComputedStyle(element).gridTemplateColumns;
      });
      
      // Should be two-column layout on desktop
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBe(2);
    });
  });

  describe('Interactive Elements', () => {
    it('should have working tabs on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      // Wait for page to load
      await page.waitForSelector('.tab-button');
      
      // Click on timeline tab
      await page.click('#tab-timeline');
      
      // Check that timeline view is active
      const timelineView = await page.$('#timeline-view.active');
      expect(timelineView).toBeTruthy();
    });

    it('should expand/collapse sections on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      // Wait for inspector elements to load
      await page.waitForSelector('.section-header .panel-toggle');
      
      // Find the first panel toggle
      const panelToggle = await page.$('.section-header .panel-toggle');
      const sectionContent = await page.$('.section-content');
      
      // Get initial state
      const initialDisplay = await page.evaluate((element) => {
        return window.getComputedStyle(element).maxHeight;
      }, sectionContent);
      
      // Click toggle
      await panelToggle.click();
      
      // Wait for animation
      await page.waitForTimeout(300);
      
      // Check that it collapsed
      const collapsedDisplay = await page.evaluate((element) => {
        return window.getComputedStyle(element).maxHeight;
      }, sectionContent);
      
      expect(collapsedDisplay).not.toBe(initialDisplay);
    });
  });

  describe('Text Readability', () => {
    it('should have appropriate font sizes on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForSelector('.brand-title');
      
      const fontSize = await page.evaluate(() => {
        const element = document.querySelector('.brand-title');
        const computedStyle = window.getComputedStyle(element);
        return parseFloat(computedStyle.fontSize);
      });
      
      // Font size should be readable on mobile (at least 16px equivalent)
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have readable code text on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      await page.waitForSelector('.code-textarea');
      
      const fontSize = await page.evaluate(() => {
        const element = document.querySelector('.code-textarea');
        const computedStyle = window.getComputedStyle(element);
        return parseFloat(computedStyle.fontSize);
      });
      
      // Code should be readable but can be smaller
      expect(fontSize).toBeGreaterThanOrEqual(12);
    });
  });
});