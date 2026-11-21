const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync, spawn } = require('node:child_process');
const { chromium, firefox, webkit } = require('playwright');

const site = path.resolve(process.argv[2] || process.cwd());
const mode = process.argv[3] || 'after';
const screenDir = process.env.QA_SCREEN_DIR;
if (screenDir) fs.mkdirSync(screenDir, { recursive: true });
const port = process.env.QA_PORT || '8792';
const origin = 'http://127.0.0.1:' + port;
const browserPath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
let axePath;
try { axePath = require.resolve('axe-core/axe.min.js'); } catch { /* Axe is optional. */ }
const html = fs.readdirSync(site, { recursive: true }).filter(file => !file.startsWith('.git/') && file.endsWith('.html')).sort();
const routes = html.map(file => file.endsWith('index.html') ? file.slice(0, -'index.html'.length) : file);
const runtimeErrors = new Set();
const outboundRequests = new Set();
const issues = [];
const axeIssues = [];
const phases = new Set(process.env.QA_PHASES?.split(',').map(value => value.trim()) || ['links', 'layout', 'lab', 'axe', 'interaction', 'zoom', 'other-browser']);
const snapshotRoutes = [['', 'home'], ['projects/', 'archive'], ['projects/trendingtrove.html', 'video']];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function inspect(page, engine) {
 page.on('pageerror', error => runtimeErrors.add(`${engine} JS: ${page.url()} – ${error.message}`));
 page.on('console', entry => { if (entry.type() === 'error') runtimeErrors.add(`${engine} Konsole: ${page.url()} – ${entry.text()}`); });
 page.on('response', response => {
  if (response.status() >= 400) runtimeErrors.add(`${engine} HTTP ${response.status()}: ${response.url()}`);
 });
 page.on('request', request => {
  if (/^https?:/.test(request.url()) && !request.url().startsWith(origin + '/')) outboundRequests.add(request.url());
 });
}

async function open(page, route) { await page.goto(origin + '/' + route, { waitUntil: 'load' }); }
function langControl(page, language) { return page.locator(`[data-language-switch] [data-lang="${language}"]`); }
async function switchTo(page, language) {
 const control = langControl(page, language);
 if (!(await control.count())) return false;
 await control.click();
 assert.equal(await page.locator('html').getAttribute('lang'), language);
 assert.equal(await control.getAttribute('aria-pressed'), 'true');
 return true;
}

async function checkGeometry(page, note) {
 const box = await page.evaluate(() => {
  const viewport = document.documentElement.clientWidth;
  const heading = document.querySelector('h1');
  return {
   viewport, width: document.documentElement.scrollWidth, body: document.body.scrollWidth,
   heading: heading?.getBoundingClientRect().toJSON(),
   visibleOffscreen: [...document.querySelectorAll('h1,h2,header button,header a,main button,main a,main video,main iframe,main canvas')].filter(el => {
    const box = el.getBoundingClientRect();
    return el.checkVisibility() && box.width > 0 && (box.left < -1 || box.right > viewport + 1) &&
     !el.closest('.archive-filters,.archive-tools,[role=tablist],.sr-only');
   }).slice(0, 8).map(el => el.tagName + ':' + (el.innerText || el.getAttribute('aria-label') || '').slice(0, 55))
  };
 });
 if (box.width > box.viewport + 1 || box.body > box.viewport + 1 || box.heading?.right > box.viewport + 1 || box.visibleOffscreen.length) {
  issues.push({ note, ...box });
 }
}

async function screenshot(page, name) {
 await page.evaluate(() => {
  document.querySelectorAll('img[loading=lazy]').forEach(image => { image.loading = 'eager'; });
 });
 await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].filter(x => x.checkVisibility()).map(x => x.decode().catch(() => {})));
 });
 await page.screenshot({ path: path.join(screenDir, name + '.png'), fullPage: true, animations: 'disabled' });
}

function localUrl(value, base) {
 try { return new URL(value, base); } catch { return null; }
}

async function linksAndMetadata(page) {
 const entries = new Map(), hrefs = new Set(), external = new Set();
 for (const route of routes) {
  await open(page, route);
  const data = await page.evaluate(() => {
   const ids = Array.from(document.querySelectorAll('[id]'), x => x.id);
   const refs = [...document.querySelectorAll('[href],[src],[poster],[data-game-src],[srcset]')].flatMap(el => [
    ...['href','src','poster','data-game-src'].map(key => el.getAttribute(key)).filter(Boolean),
    ...(el.getAttribute('srcset')?.split(',').map(source => source.trim().split(/\s+/)[0]).filter(Boolean) || []),
   ]);
   for (const tag of document.querySelectorAll('meta[property="og:url"],meta[property="og:image"]')) refs.push(tag.content);
   return { title: document.title, ids, refs, headings: document.querySelectorAll('h1').length };
  });
  assert.equal(data.headings, 1, route);
  assert.equal(data.ids.length, new Set(data.ids).size, route + ' IDs');
  assert.match(data.title.toLowerCase(), /notedbit/);
  entries.set(route, data.ids);
  for (const raw of data.refs) {
   const url = localUrl(raw, origin + '/' + route);
   if (!url) throw new Error('Ungültige URL ' + raw + ' auf ' + route);
   if (url.origin === 'https://notedbit.com' || url.origin === origin) hrefs.add(JSON.stringify([route, url.pathname, url.hash]));
   else if (!['data:', 'blob:'].includes(url.protocol)) external.add(url.href);
  }
  const originalTitle = data.title;
  if (await switchTo(page, 'de')) {
   await switchTo(page, 'en');
   assert.equal(await page.title(), originalTitle, route + ' EN → DE → EN');
  }
 }
 const errors = [];
 for (const item of hrefs) {
  const [from, pathname, fragment] = JSON.parse(item);
  let target = decodeURIComponent(pathname).slice(1);
  const local = path.join(site, target);
  if (!fs.existsSync(local)) { errors.push([from, pathname, 'file']); continue; }
  if (fs.statSync(local).isDirectory()) target = target.replace(/\/?$/, '/') + 'index.html';
  if (!fs.existsSync(path.resolve(site, target.replace(/^\//, '')))) errors.push([from, pathname, 'index']);
  const targetRoute = target.replace(/(^|\/)index\.html$/, '$1').replace(/^\//, '');
  if (fragment && entries.has(targetRoute) && !entries.get(targetRoute).includes(decodeURIComponent(fragment.slice(1)))) errors.push([from, pathname + fragment, 'anchor']);
  if (pathname.startsWith('/demos/simulation') && !from.startsWith('demos/simulation')) errors.push([from, pathname, 'simulation advertised']);
 }
 assert.deepEqual(errors, []);
 assert.equal(fs.readFileSync(path.join(site, 'CNAME'), 'utf8').trim(), 'notedbit.com');
 if (fs.existsSync(path.join(site,'.git'))) {
  const remoteCname = execFileSync('git',['show','origin/main:CNAME'],{cwd:site});
  assert.deepEqual(remoteCname, fs.readFileSync(path.join(site,'CNAME')));
 }
 const sitemap = fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8');
 for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = new URL(location);
  assert.equal(url.origin, 'https://notedbit.com');
  assert.ok(entries.has(url.pathname.slice(1)), location);
 }
 console.log('LINKS', JSON.stringify({ pages: routes.length, references: hrefs.size, external: [...external].sort(), cname: 'notedbit.com' }));
}

async function viewportMatrix(browser, engine) {
 const widths = [320, 375, 390, 768, 1024, 1440];
 for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width <= 390 ? 844 : 960 }, hasTouch: width <= 390, reducedMotion: 'reduce' });
  inspect(page, engine);
  for (const route of routes) {
   await open(page, route);
   for (const lang of ['en', 'de']) {
    await switchTo(page, lang);
    await checkGeometry(page, `${engine} ${width} ${lang} /${route}`);
   }
  }
  if (screenDir && engine === 'chromium' && [390, 1440].includes(width)) {
   for (const [route, filename] of snapshotRoutes) {
    await open(page, route);
    await switchTo(page, 'de');
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, `${width}-${filename}`);
   }
  }
  await page.close();
 }
 console.log('VIEWPORTS', engine, widths, routes.length);
}

async function zoomContext(factor) {
 const profile = fs.mkdtempSync(path.join(tmpdir(), 'notedbit-zoom-'));
 fs.mkdirSync(path.join(profile, 'Default'));
 fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({
  partition: { default_zoom_level: { x: Math.log(factor) / Math.log(1.2) } }
 }));
 const browser = await chromium.launchPersistentContext(profile, {
  executablePath: browserPath,
  args: ['--no-sandbox', '--window-size=1440,900'], viewport: null,
  reducedMotion: 'reduce',
 });
 return { browser, close: async () => {
  await browser.close();
  fs.rmSync(profile, { recursive: true, force: true });
 } };
}

async function zoomMatrix() {
 for (const factor of [1, 1.25, 1.5, 2]) {
  const { browser, close } = await zoomContext(factor);
  try {
   const page = browser.pages()[0];
   inspect(page, 'chromium zoom');
   for (const route of routes) {
    await open(page, route);
    assert.equal(await page.evaluate(() => window.devicePixelRatio), factor);
    for (const lang of ['en', 'de']) {
     await switchTo(page, lang);
     await checkGeometry(page, `chromium ${factor * 100}% ${lang} /${route}`);
    }
   }
   console.log('ZOOM', factor, await page.evaluate(() => [innerWidth, outerWidth, devicePixelRatio]), routes.length);
  } finally { await close(); }
 }
}

async function interaction(browser, engine) {
 const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
 const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
 inspect(desktop, engine);
 inspect(mobile, engine);
 await open(mobile, '');
 await mobile.keyboard.press('Tab');
 assert.equal(await mobile.evaluate(() => document.activeElement.getAttribute('href')), '#main-content');
 assert.equal(await mobile.evaluate(() => document.activeElement.matches(':focus-visible')), true);
 await mobile.keyboard.press('Enter');
 assert.equal(await mobile.evaluate(() => document.activeElement.id), 'main-content');
 const navToggle = mobile.locator('[data-nav-toggle]');
 await navToggle.focus();
 await mobile.keyboard.press('Enter');
 assert.equal(await navToggle.getAttribute('aria-expanded'), 'true');
 await checkGeometry(mobile, engine + ' opened mobile menu');
 await mobile.locator('#primary-nav a').first().focus();
 await mobile.keyboard.press('Escape');
 assert.equal(await navToggle.getAttribute('aria-expanded'), 'false');
 assert.equal(await navToggle.evaluate(element => document.activeElement === element), true);
 await mobile.setViewportSize({width:640,height:205});
 await navToggle.click();
 const menu = mobile.locator('#primary-nav');
 assert.equal(await menu.evaluate(element => {
  const box = element.getBoundingClientRect();
  return box.bottom <= innerHeight && element.scrollHeight > element.clientHeight
   && getComputedStyle(element).overflowY === 'auto';
 }), true, 'Short landscape navigation fits and can scroll');
 const contactLink = menu.locator('a[href="#contact"]');
 await contactLink.waitFor({state:'visible'});
 await contactLink.press('Enter');
 assert.equal(await navToggle.getAttribute('aria-expanded'), 'false');
 await mobile.waitForURL(/#contact$/);
 assert.equal(await mobile.evaluate(() => document.activeElement.id), 'contact');
 await mobile.setViewportSize({width:390,height:844});
 await switchTo(mobile, 'de');
 await open(mobile, 'projects/');
 assert.equal(await mobile.locator('html').getAttribute('lang'), 'de');
 await mobile.reload();
 assert.equal(await mobile.locator('html').getAttribute('lang'), 'de');
 await open(desktop, '');
 const workLink = desktop.locator('#primary-nav a[href="#work"], #primary-nav a[href="index.html#work"]').first();
 await workLink.focus();
 await desktop.keyboard.press('Enter');
 assert.match(desktop.url(), /#work$/);
 assert.equal(await desktop.evaluate(() => document.activeElement.id), 'work');
 for (const id of ['featured-video','featured-dungeon','featured-website','about','skills','contact']) assert.equal(await desktop.locator('#' + id).count(), 1, id);
 await open(desktop, 'projects/');
 const filter = value => desktop.locator(`[data-filter="${value}"]`);
 const visible = () => desktop.locator('details.archive-record:visible').count();
 assert.equal(await visible(), 11);
 await filter('all').focus();
 await desktop.keyboard.press('ArrowRight');
 assert.equal(await filter('software').getAttribute('aria-pressed'), 'true');
 assert.equal(await visible(), 5);
 for (const [value, expected] of [['systems',3],['media',1],['coursework',2],['all',11]]) {
  await filter(value).click();
  assert.equal(await visible(), expected);
 }
 const search = desktop.locator('#project-search');
 for (const [query, expected] of [['risc-v',1],['simul',1],['xxxxxxxxxx',0],['',11]]) {
  await search.fill(query);
  assert.equal(await visible(), expected);
 }
 for (const view of ['cards', 'rows']) {
  const button = desktop.locator(`[data-archive-view="${view}"]`);
  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
 }
 await desktop.locator('[data-archive-expand="all"]').click();
 assert.equal(await desktop.locator('details.archive-record[open]').count(), 11);
 await desktop.locator('[data-archive-expand="none"]').click();
 assert.equal(await desktop.locator('details.archive-record[open]').count(), 0);
 await open(desktop, 'projects/#dungeon');
 const gameToggle = desktop.locator('[data-game-toggle]');
 await gameToggle.focus();
 await desktop.keyboard.press('Enter');
 assert.equal(await gameToggle.getAttribute('aria-expanded'), 'true');
 assert.equal(await desktop.locator('[data-game-src]').getAttribute('src'), '../games/dungeoncrawler/');
 const gameFrame = desktop.frameLocator('[data-game-src]');
 await desktop.locator('[data-game-src]').scrollIntoViewIfNeeded();
 await gameFrame.locator('[data-start]').waitFor({state:'visible',timeout:5000});
 await switchTo(desktop, 'de');
 assert.match(await gameToggle.innerText(), /Spiel verbergen/);
 await gameToggle.click();
 assert.equal(await desktop.locator('[data-game-src]').getAttribute('src'), null);
 await open(desktop, 'projects/#%');
 await open(desktop, 'games/dungeoncrawler/');
 const start = desktop.locator('[data-start]');
 await start.focus();
 await desktop.keyboard.press('Enter');
 assert.equal(await desktop.locator('[data-hp]').textContent(), '50');
 assert.equal(await desktop.locator('[data-level]').textContent(), '1');
 const canvas = () => desktop.locator('canvas').evaluate(element => element.toDataURL());
 const before = await canvas();
 for (const direction of ['ArrowUp','ArrowRight','ArrowLeft','ArrowDown','ArrowUp']) {
  await desktop.keyboard.press(direction);
  if ((await canvas()) !== before) break;
 }
 assert.notEqual(await canvas(), before);
 const gameCanvas = desktop.locator('canvas');
 assert.equal(await gameCanvas.evaluate(element => document.activeElement === element), true);
 assert.equal(await desktop.evaluate(() => {
  const event = new KeyboardEvent('keydown', {key:'ArrowDown',bubbles:true,cancelable:true});
  document.querySelector('h1').dispatchEvent(event);
  return event.defaultPrevented;
 }), false);
 await desktop.keyboard.press('r');
 await start.waitFor({state:'visible',timeout:5000});
 await mobile.setViewportSize({width:320,height:720});
 await open(mobile,'games/dungeoncrawler/');
 const mobileStart = mobile.locator('[data-start]');
 assert.equal(await mobileStart.evaluate(element => {
   const overlay = document.querySelector('[data-overlay]');
   const button = element.getBoundingClientRect();
   const area = overlay.getBoundingClientRect();
   return button.bottom <= area.bottom + 1 || ['auto','scroll'].includes(getComputedStyle(overlay).overflowY);
 }), true, 'The narrow start panel fits or can be scrolled');
 await mobileStart.click();
 assert.equal(await mobile.locator('[data-hp]').textContent(), '50');
 await open(desktop, 'demos/cpp-exercises/');
 await switchTo(desktop, 'en');
 await desktop.locator('#calc-form button').click();
 assert.match(await desktop.locator('#calc-output').textContent(), /= 3/);
 if (mode === 'after') {
  await switchTo(desktop, 'de');
  await desktop.locator('#calc-form button').click();
  assert.match(await desktop.locator('#calc-output').textContent(), /= 3/);
 }
 await desktop.locator('[data-demo-tab="sort"]').click();
 await desktop.locator('#sort-form button').click();
 assert.equal((await desktop.locator('#sort-visual').textContent()).replace(/\s/g,''), '259');
 assert.match(await desktop.locator('#sort-steps').innerText(), /Durchlauf/);
 await switchTo(desktop, 'en');
 assert.match(await desktop.locator('#sort-steps').innerText(), /Pass/);
 await open(desktop, 'demos/simulation/');
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
 assert.match(await desktop.locator('h1').innerText(), /archiv/i);
 await desktop.locator('#speed').focus();
 await desktop.keyboard.press('ArrowRight');
 assert.equal(await desktop.locator('#speed-value').innerText(), '120');
 for (const modeName of ['escape','plinko','shrinking']) await desktop.locator('#mode').selectOption(modeName);
 assert.equal(await desktop.locator('#status').textContent(), 'Paused');
 await desktop.locator('#toggle').click();
 assert.equal(await desktop.locator('#status').textContent(), 'Running');
 await desktop.locator('#restart').click();
 assert.equal(await desktop.locator('#status').textContent(), 'Running');
 for (const [route, duration] of [['projects/trendingtrove.html',62.5],['projects/horror-video-automation.html',42]]) {
  await open(desktop, route);
  const video = desktop.locator('video').first();
  await video.scrollIntoViewIfNeeded();
  const media = await video.evaluate(async el => {
   const poster = new Image();
   poster.src = el.poster;
   await poster.decode();
   el.muted = true;
   await el.play();
   await new Promise(resolve => setTimeout(resolve, 400));
   el.pause();
   return { time: el.currentTime, duration: el.duration, video: el.videoWidth, poster: poster.naturalWidth };
  });
  assert.ok(media.poster > 0 && media.video > 0 && media.time > 0);
  assert.ok(Math.abs(media.duration - duration) < 0.3);
  console.log('MEDIA', engine, route, media);
 }
 await legacyNavigation(browser, engine);
 await gameStartup(browser);
 console.log('INTERACTION', engine, 'passed');
 await desktop.close();
 await mobile.close();
}

async function legacyNavigation(browser, engine) {
 const page = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:'reduce'});
 inspect(page, engine);
 try {
  await page.addInitScript(() => {
   const matchMedia = window.matchMedia.bind(window);
   window.matchMedia = query => {
    const result = matchMedia(query);
    if (query !== '(max-width: 760px)') return result;
    return {
     get matches() { return result.matches; },
     addListener(listener) { result.addListener(listener); }
    };
   };
  });
  await open(page, '');
  const toggle = page.locator('[data-nav-toggle]');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.setViewportSize({width:1024,height:768});
  await page.waitForFunction(() => document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded') === 'false');
  assert.equal(await page.locator('body').evaluate(body => body.classList.contains('nav-open')), false);
 } finally {
  await page.close();
 }
}

async function gameStartup(browser) {
 const page = await browser.newPage({viewport:{width:1024,height:768}, reducedMotion:'reduce'});
 const wallSprite = '**/games/dungeoncrawler/assets/Wand.png';
 let releaseSprite;
 const delayedResponse = new Promise(resolve => { releaseSprite = resolve; });
 const start = page.locator('[data-start]');
 const loadStatus = page.locator('[data-load-status]');
 const started = () => page.waitForFunction(() => document.querySelector('[data-hp]').textContent === '50');

 try {
  await page.route(wallSprite, async route => {
   await delayedResponse;
   await route.continue();
  });
  await page.goto(origin + '/games/dungeoncrawler/', {waitUntil:'domcontentloaded'});
  await start.click();
  assert.match(await loadStatus.textContent(), /Loading game assets/);
  releaseSprite();
  await started();
  assert.equal(await start.isVisible(), false);
  await page.unroute(wallSprite);

  // An induced request failure is isolated from the normal network-error scan.
  await page.route(wallSprite, route => route.abort(), {times:1});
  await page.reload();
  await loadStatus.getByText('Game graphics could not load. Select Start game to retry.').waitFor();
  await switchTo(page, 'de');
  assert.match(await loadStatus.textContent(), /Spielgrafiken konnten nicht geladen werden/);
  await start.click();
  await started();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'dungeon-canvas');
 } finally {
  releaseSprite();
  await page.close();
 }
}

async function accessibility(browser) {
 if (!axePath) { console.log('AXE skipped (install axe-core to enable)'); return; }
 for (const [viewport, size] of [[{width:1440,height:900},'desktop'],[{width:390,height:844},'mobile']]) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  for (const route of routes) {
   await open(page, route);
   await page.evaluate(fs.readFileSync(axePath, 'utf8'));
   const scan = () => page.evaluate(async () => {
    const results = await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
    return results.violations.map(result => ({id:result.id, nodes:result.nodes.map(node => ({target:node.target.join(' '), reason:node.failureSummary?.replace(/\s+/g,' ')}))}));
   });
   const failures = await scan();
   if (failures.length) axeIssues.push({size, route, failures});
   if (route === 'projects/') {
    await page.locator('[data-archive-expand="all"]').click();
    const expanded = await scan();
    if (expanded.length) axeIssues.push({size, route, state:'expanded', failures:expanded});
   }
  }
  await page.close();
 }
 console.log('AXE', JSON.stringify(axeIssues));
}

async function performance(browser) {
 const route = '';
 const samples = [];
 for (let run = 0; run < 5; run++) {
  const page = await browser.newPage({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
  await page.addInitScript(() => {
   window.labMetrics = { lcp:0, cls:0 };
   new PerformanceObserver(list => { for(const entry of list.getEntries()) window.labMetrics.lcp = entry.startTime; }).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list => { for(const entry of list.getEntries()) if(!entry.hadRecentInput) window.labMetrics.cls += entry.value; }).observe({type:'layout-shift',buffered:true});
  });
  await open(page, route);
  await page.waitForTimeout(450);
  samples.push(await page.evaluate(() => ({
   ...window.labMetrics,
   transferred: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0) + performance.getEntriesByType('navigation')[0].transferSize,
  })));
  await page.close();
 }
 const median = key => samples.map(item => item[key]).sort((a,b) => a-b)[2];
 console.log('LAB', { runs: samples.length, page: '/', medianLcpMs: median('lcp'), medianCls: median('cls'), medianTransferredBytes: median('transferred'), samples });
}

(async () => {
 const server = spawn('python3',['-m','http.server',port,'--bind','127.0.0.1','--directory',site],{stdio:'ignore'});
 let startupError;
 server.on('error', error => { startupError = error; });
 try {
  for (let attempt = 0; attempt < 30; attempt++) {
   if (startupError) throw startupError;
   if (server.exitCode !== null) throw new Error('Local HTTP server exited. Choose an unused QA_PORT.');
   const response = await fetch(origin + '/').catch(() => null);
   if (response?.ok) break;
   if (attempt === 29) throw new Error('Local HTTP server is unavailable.');
   await pause(100);
  }
  const baseline = mode === 'before';
  const chromiumBrowser = await chromium.launch({ executablePath: browserPath, args:['--no-sandbox'] });
  try {
   console.log('BROWSER Chromium', chromiumBrowser.version());
   if (!baseline && phases.has('links')) {
    const linkPage = await chromiumBrowser.newPage();
    inspect(linkPage, 'chromium');
    await linksAndMetadata(linkPage);
    await linkPage.close();
   }
   if (phases.has('layout')) await viewportMatrix(chromiumBrowser,'chromium');
   if (phases.has('lab')) await performance(chromiumBrowser);
   if (phases.has('axe')) await accessibility(chromiumBrowser);
   if (!baseline && phases.has('interaction')) await interaction(chromiumBrowser,'chromium');
  } finally { await chromiumBrowser.close(); }
  if (!baseline) {
   if (phases.has('zoom')) await zoomMatrix();
   if (phases.has('other-browser')) for (const engine of [firefox, webkit]) {
    if (!process.env['QA_' + engine.name().toUpperCase()]) continue;
    const secondBrowser = await engine.launch({timeout: 12000});
    try {
     console.log('BROWSER ' + engine.name(), secondBrowser.version());
     await viewportMatrix(secondBrowser,engine.name());
     if (engine.name() !== 'webkit') await interaction(secondBrowser,engine.name());
    } finally { await secondBrowser.close(); }
   }
  }
  console.log('GEOMETRY',JSON.stringify(issues));
  console.log('RUNTIME',JSON.stringify([...runtimeErrors]));
  console.log('OUTBOUND_ON_LOAD',JSON.stringify([...outboundRequests]));
  if (!baseline) {
   assert.deepEqual(issues, [], 'Viewport and heading overflow');
   assert.deepEqual(axeIssues, [], 'Automated WCAG checks');
   assert.deepEqual([...runtimeErrors], [], 'Browser console and request errors');
  }
 } finally { server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
