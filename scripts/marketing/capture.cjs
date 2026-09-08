/* Run against a local production server. Uses only a dedicated sample project. */
const { chromium } = require('../../temp/marketing-tools/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const base = process.env.MARKETING_BASE_URL || 'http://127.0.0.1:3010';
const out = path.join(root, 'public/markting/screenshots');
const scratch = path.join(root, 'temp/marketing');
async function main() {
  await fs.mkdir(out, { recursive: true });
  const source = await fs.readFile(path.join(root, 'app/demo/page.tsx'), 'utf8');
  const demoSource = source.slice(source.indexOf('const floorId'), source.indexOf('export default function')) + '\nexport { demoTour };';
  const compiled = ts.transpileModule(demoSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const demoExports = {};
  new Function('exports', compiled)(demoExports);
  const { id, createdAt, updatedAt, ...sample } = demoExports.demoTour;
  const all = await (await fetch(base + '/api/tours')).json();
  let tour = all.find(t => t.title === 'Cedar House · Marketing Demo');
  if (!tour) {
    const response = await fetch(base + '/api/tours', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sample, title: 'Cedar House · Marketing Demo' }) });
    if (!response.ok) throw new Error(await response.text());
    tour = await response.json();
  }
  await fs.writeFile(path.join(scratch, 'sample-project.json'), JSON.stringify({ id: tour.id }, null, 2));
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  async function shot(name) { await page.screenshot({ path: path.join(out, name + '.png') }); console.log('Captured', name); }
  await page.goto(base + '/demo');
  await page.locator('.psv-canvas-container canvas').waitFor();
  await page.waitForTimeout(4000);
  await shot('viewer-desktop');
  await page.getByRole('button', { name: 'Go to Kitchen & Dining', exact: true }).click();
  await page.waitForTimeout(1800);
  await shot('floor-plan-navigation');
  await page.getByRole('button', { name: 'Go to Primary Suite', exact: true }).click();
  await page.waitForTimeout(1800);
  await shot('primary-suite');
  await page.goto(base + '/studio/' + tour.id);
  await page.getByRole('button', { name: 'Download JSON', exact: true }).waitFor();
  await page.waitForTimeout(4000);
  await shot('studio-desktop');
  await page.getByRole('tab', { name: 'Ground floor', exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot('studio-map');
  await page.goto(base + '/dashboard');
  await page.waitForTimeout(1200);
  await shot('dashboard-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/demo');
  await page.locator('.psv-canvas-container canvas').waitFor();
  await page.waitForTimeout(3000);
  await shot('viewer-mobile');
  await page.getByRole('button', { name: 'Hide map', exact: true }).click();
  await shot('viewer-mobile-immersive');
  await page.goto(base + '/studio/' + tour.id);
  await page.waitForTimeout(3500);
  await shot('studio-mobile');
  // Real browser interactions captured frame by frame for editable footage.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + '/demo');
  await page.locator('.psv-canvas-container canvas').waitFor();
  await page.waitForTimeout(3000);
  const frames = path.join(scratch, 'tour-frames');
  await fs.mkdir(frames, { recursive: true });
  for (let i = 0; i < 240; i++) {
    if (i === 0 || i === 120) { await page.mouse.move(780, 390); await page.mouse.down(); }
    if (i < 60) await page.mouse.move(780 - i * 4, 390);
    if (i === 60 || i === 180) await page.mouse.up();
    if (i === 72) await page.getByRole('button', { name: 'Go to Kitchen & Dining', exact: true }).click();
    if (i >= 120 && i < 180) await page.mouse.move(780 - (i - 120) * 3, 390);
    if (i === 190) await page.getByRole('button', { name: 'Go to Primary Suite', exact: true }).click();
    await page.screenshot({ path: path.join(frames, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 });
    if (i % 60 === 0) console.log('Footage frame', i);
  }
  await fs.writeFile(path.join(scratch, 'capture-report.json'), JSON.stringify({ base, sampleProjectId: tour.id, frames: 240, desktop: '1440x900', mobile: '390x844', errors }, null, 2));
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
