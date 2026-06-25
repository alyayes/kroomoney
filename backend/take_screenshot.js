import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 700 });
    
    // Load the HTML file
    const fileUrl = 'file:///' + path.join(__dirname, '..', 'arsitektur.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Take screenshot and save to artifacts directory
    const outputPath = 'C:\\Users\\EliteBook\\.gemini\\antigravity-ide\\brain\\518340a6-3328-4017-aec4-79b2903f6571\\arsitektur_kroomoney.png';
    await page.screenshot({ path: outputPath });
    
    console.log('Screenshot saved to ' + outputPath);
    await browser.close();
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
})();
