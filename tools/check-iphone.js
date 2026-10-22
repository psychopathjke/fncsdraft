// Сайт глазами его телефона: WebKit (движок Safari) с размером и user-agent iPhone 15 Pro Max.
//
// Он играет только с iPhone, а все остальные пробы — Chrome. Здесь: главная и вкладки карьеры в WebKit,
// ошибки страницы, горизонтальная прокрутка (страница шире экрана) и снимки каждого экрана в папку,
// чтобы посмотреть глазами (X 22.10: панель дня на телефоне была нечитаемой — Chrome-пробы этого не видят).
//
// Playwright с WebKit стоит отдельно от проекта (node_modules в папку сайта не попадает):
//   mkdir C:\Users\FoxOS_User\fd-webkit && cd там && npm i playwright@1.48.2 && npx playwright install webkit
//   node tools/check-iphone.js [папка-для-снимков]        (FD_PW — другой путь к пакету playwright)
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const PW = process.env.FD_PW || 'C:/Users/FoxOS_User/fd-webkit/node_modules/playwright';
let pw; try { pw = require(PW); } catch (e) { console.error('нет playwright в ' + PW + ' — см. шапку файла'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'fd-iphone'));
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const TABS = ['centre', 'me', 'calendar', 'train', 'social', 'club', 'shop'];
const YEARS = [{ year: 2026, day: '2026-05-06' }, { year: 2021, day: '2021-03-10' }];

(async () => {
  const srv = http.createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { s.writeHead(403); s.end(); return; }
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
  }).listen(0);
  const port = srv.address().port;
  const dev = pw.devices['iPhone 15 Pro Max'] || pw.devices['iPhone 14 Pro Max'];
  const browser = await pw.webkit.launch();
  const ctx = await browser.newContext({ ...dev, reducedMotion: 'reduce' });   // у него в браузере reduced motion всегда включён
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e.message || e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|404/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  const fails = [];
  const shot = async name => { await page.screenshot({ path: path.join(OUT, name + '.png') }); };
  const wide = async where => {
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (w[0] > w[1] + 2) fails.push(where + ': страница шире экрана ' + w[0] + ' > ' + w[1]);
  };
  await page.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await wide('home'); await shot('home');
  for (const y of YEARS) {
    await page.evaluate(y => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v: 1, player: { nick: 'Phone', age: 19, source: 'rookie', country: 'de', countryPing: 15, closeRangeEdge: 0,
          region: 'EU', ovr: 85, role: 'roleIGL', attrs: ccRookieAttrs(85, 'roleIGL'), ageEdge: 0, photo: null, handle: null, cardRegion: null, nat: null },
        career: { season: 1, year: y.year, year0: y.year, day: y.day, division: 1, earnings: 0, balance: 0, reach: 0, tokens: [], log: [], news: [], seed: 'phone' },
        partners: [] }));
      careerLoad(); show('screen-career-hub');
    }, y);
    for (const t of TABS) {
      try { await page.evaluate(t => careerRenderHub(t), t); } catch (e) { fails.push(y.year + ' ' + t + ': ' + String(e.message).slice(0, 160)); continue; }
      await page.waitForTimeout(400);
      await wide(y.year + ' ' + t); await shot(y.year + '-' + t);
    }
  }
  await browser.close(); srv.close();
  errs.forEach(e => fails.push(e));
  if (fails.length) { fails.forEach(f => console.log(' FAIL ' + f)); console.log('снимки: ' + OUT); process.exit(1); }
  console.log('iPhone (WebKit): ' + (1 + YEARS.length * TABS.length) + ' экранов без ошибок и без прокрутки вбок · снимки: ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
