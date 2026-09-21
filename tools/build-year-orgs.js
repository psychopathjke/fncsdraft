// Клубы игроков ПО ГОДАМ — с отрендеренных страниц Liquipedia.
//
// Его слово 21 сентября 2026: «сделай орги игрокам, которые были у них в 25 и 24».
// Клуб на карточку до этого приходил с ростеров 2026-го и копировался на все карты
// человека (ORG_2025 закрывал только Лион). Liquipedia рендерит таблицу призовых
// с клубом игрока НА ДАТУ турнира (data-highlighting-class у block-player), и это
// единственный источник, где Merstach в феврале 2024-го — Monaco Esports.
//
// Страницы — финалы трёх Мейджоров по регионам за 2024 и 2025 плюс Форт-Уэрт;
// action=parse отдаёт HTML, лимит — один запрос в 30 секунд (иначе бан IP на час).
// Итог: tools/measured/orgs-by-year.json {год: {major: {handle: club}}} и, для
// справки, кто в каком регионе. Идемпотентен: страницы кэшируются в %TEMP%.
//
//   node tools/build-year-orgs.js            # всё
//   node tools/build-year-orgs.js 2024       # один год
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tools', 'measured', 'orgs-by-year.json');
const CACHE = path.join(os.tmpdir(), 'liqui-orgs'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'fncsdraft-tools/1.0 (keegorka@gmail.com)';
const GAP_MS = 31000;
const REG = { 'Europe': 'EU', 'North America': 'NAC', 'North America Central': 'NAC', 'North America West': 'NAW',
              'Brazil': 'BR', 'Asia': 'ASIA', 'Middle East': 'ME', 'Oceania': 'OCE' };
const PAGES = {
  2024: { regions: ['Europe', 'North America', 'Brazil', 'Asia', 'Middle East', 'Oceania'], majors: [1, 2, 3], globals: 'Fortnite Champion Series/2024' },
  2025: { regions: ['Europe', 'North America Central', 'North America West', 'Brazil', 'Asia', 'Middle East', 'Oceania'], majors: [1, 2, 3], globals: 'Fortnite Champion Series/2025' }
};
const want = process.argv.slice(2).map(Number).filter(y => PAGES[y]);
const YEARS = want.length ? want : [2024, 2025];

const sleep = ms => new Promise(r => setTimeout(r, ms));
function fetchHtml(title) {
  const f = path.join(CACHE, title.replace(/[^A-Za-z0-9]+/g, '_') + '.json');
  if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.parse) return { html: j.parse.text['*'], cached: true }; }
  const url = 'https://liquipedia.net/fortnite/api.php?action=parse&page=' + encodeURIComponent(title) + '&prop=text&format=json';
  const buf = execFileSync('curl', ['-s', '--compressed', '-A', UA, url], { maxBuffer: 1 << 26 });
  let j; try { j = JSON.parse(buf.toString('utf8')); } catch (e) { return { err: 'not json (' + buf.length + ' bytes)' }; }
  if (!j.parse) return { err: (j.error && j.error.code) || 'no parse' };
  fs.writeFileSync(f, JSON.stringify(j));
  return { html: j.parse.text['*'], cached: false };
}
// block-player → [ник, клуб|null]. Клуб — data-highlighting-class у team-template-team-part.
function players(html) {
  const out = [];
  const re = /<div class="block-player[^"]*"[^>]*>([\s\S]*?)(?=<div class="block-player|<\/td>)/g;
  let m;
  while ((m = re.exec(html))) {
    const b = m[1];
    const n = /<span class="name"[^>]*>\s*<a [^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/.exec(b) || /<span class="name"[^>]*>([^<]+)</.exec(b);
    if (!n) continue;
    const handle = (n[2] || n[1]).trim();
    const c = /data-highlighting-class="([^"]*)"/.exec(b);
    out.push([handle, c ? c[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim() : null]);
  }
  return out;
}

(async () => {
  const data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const y of YEARS) {
    data[y] = data[y] || {};
    const cfg = PAGES[y];
    const jobs = [];
    cfg.majors.forEach(n => cfg.regions.forEach(r => jobs.push({ key: 'major' + n, reg: REG[r], title: 'Fortnite Champion Series/' + y + '/Major ' + n + '/' + r })));
    jobs.push({ key: 'globals', reg: null, title: cfg.globals });
    for (const job of jobs) {
      const r = fetchHtml(job.title);
      if (r.err) { console.error(y, job.key, job.reg || 'ALL', 'ERR', r.err, job.title); await sleep(GAP_MS); continue; }
      const ps = players(r.html);
      const withClub = ps.filter(p => p[1]).length;
      data[y][job.key] = data[y][job.key] || {};
      const seen = {};
      ps.forEach(([h, club]) => {
        if (!club) return;
        // Один человек на странице раз: первое вхождение — из таблицы призовых (сверху).
        if (seen[h]) return; seen[h] = 1;
        data[y][job.key][h] = { club, reg: job.reg };
      });
      fs.writeFileSync(OUT, JSON.stringify(data, null, 1));
      console.error(y, job.key.padEnd(8), (job.reg || 'ALL').padEnd(4), 'players', String(ps.length).padStart(4), 'with club', String(withClub).padStart(4), r.cached ? '(cache)' : '');
      if (!r.cached) await sleep(GAP_MS);
    }
  }
  const total = Object.keys(data).map(y => y + ': ' + Object.keys(data[y]).map(k => k + '=' + Object.keys(data[y][k]).length).join(' ')).join(' | ');
  console.log('orgs-by-year.json — ' + total);
})();
