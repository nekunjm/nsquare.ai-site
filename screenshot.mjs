import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dir = join(__dirname, 'temporary screenshots');
await mkdir(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const files = await readdir(dir);
const nums = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1])).filter(Boolean);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const name = `screenshot-${next}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const width = parseInt(process.argv[4]) || 1440;
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
// Force all reveal elements visible and trigger animations for screenshot
await page.evaluate(() => {
  document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));
  // Trigger counters
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseInt(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    el.textContent = target + suffix;
  });
  // Trigger HIW animations
  document.querySelectorAll('.hiw-connector').forEach(c => c.classList.add('animate'));
  document.querySelectorAll('.step-circle').forEach(c => c.classList.add('animate'));
});
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: join(dir, name), fullPage: true });
await browser.close();
console.log(`Saved: ${join(dir, name)}`);
