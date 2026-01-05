import { Router } from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Chrome/Puppeteer health check endpoint
 */
router.get('/health/chrome', async (req, res) => {
  try {
    // Check Chrome paths
    const chromePaths = [
      '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    const availablePaths = [];
    for (const path of chromePaths) {
      if (path.includes('*')) {
        const glob = require('glob');
        const matches = glob.sync(path);
        if (matches.length > 0) {
          availablePaths.push(...matches.filter((p: string) => fs.existsSync(p)));
        }
      } else if (fs.existsSync(path)) {
        availablePaths.push(path);
      }
    }

    // Try to launch Puppeteer
    let puppeteerStatus = 'failed';
    let puppeteerError = null;
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      await browser.close();
      puppeteerStatus = 'success';
    } catch (error) {
      puppeteerError = error instanceof Error ? error.message : 'Unknown error';
    }

    res.json({
      status: 'OK',
      chrome: {
        availablePaths,
        puppeteerStatus,
        puppeteerError,
        cacheDir: process.env.PUPPETEER_CACHE_DIR || 'default',
        chromeBin: process.env.CHROME_BIN || 'not set'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;