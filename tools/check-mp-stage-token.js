// Командный вечер не зависит от того, что вкладка прожила до него: жетон этапа
// (CC_DROP_STAGE_N) и кэши мира (CC_LADDER_POOL, размер которого задаёт ПЕРВАЯ
// собранная комната) обнуляются на старте вечера у обоих (ccMpSeedOn).
//
// Его отчёт, 28 августа: первый вечер после обновления у двоих сошёлся, а
// следующий разошёлся с первой игры. Счётчик CC_DROP_STAGE_N живёт в
// вкладке и входит в жетон высадки: перезагрузился один — и жетоны разные.
//
// Здесь тот же командный вечер (подставное лобби, как в check-mp-seed)
// играется дважды: со свежей вкладкой и со вкладкой, «прожившей» пять
// этапов. Таблицы обязаны совпасть.
//
//   node tools/check-mp-stage-token.js
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Тело пробы берётся у check-mp-seed: то же лобби, тот же сид, та же карьера.
const seedSrc = fs.readFileSync(path.join(__dirname, 'check-mp-seed.js'), 'utf8');
const bootSrc = seedSrc.slice(seedSrc.indexOf('const boot = (seed, skip) => `'), seedSrc.indexOf('const src = fs.readFileSync'));
const headSrc = seedSrc.slice(seedSrc.indexOf('const BASE = '), seedSrc.indexOf('const boot = '));
eval(headSrc.replace(/const /g,'var ')); eval(bootSrc.replace(/const boot/,'var boot').replace('    careerEntry();', '    careerEntry(); if(window.__age){ CC_DROP_STAGE_N=window.__age; ccLadderSeason(CAREER.career, true, 300); ccLadderSeason(CAREER.career, false, 40); }').split("day:'2026-02-02'").join("day:'"+(process.env.CC_DAY||'2026-02-02')+"'"));

const DAY = process.env.CC_DAY || '2026-02-02';
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const run = (tag, aged) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mptoken-'));
  const tmp = path.join(dir, 'index.html');
  // Прожитая вкладка: пять этапов уже были — счётчик сдвинут ДО вечера.
  // Старение ставится ДО вечера, синхронно (в boot после careerEntry): load в
  // headless приходит поздно и попадал бы в середину вечера.
  const age = aged ? '<script>window.__age=5;</script>' : '';
  fs.writeFileSync(tmp, head + src + age + boot('team-ABC123|'+DAY, true));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
    'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(tag + ': проба не отработала'); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.fail) { console.error(tag + ': ' + out.fail); process.exit(1); }
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
};
const hash = t => crypto.createHash('sha1').update(t.join('\n')).digest('hex').slice(0, 12);
const fresh = run('свежая вкладка', false);
const aged = run('прожитая вкладка', true);
console.log('свежая: строк ' + fresh.table.length + ' · хеш ' + hash(fresh.table));
console.log('прожитая: строк ' + aged.table.length + ' · хеш ' + hash(aged.table));
if (hash(fresh.table) !== hash(aged.table)) {
  const at = fresh.table.findIndex((r, i) => r !== aged.table[i]);
  console.error('FAIL прожитая вкладка играет другой вечер, строка ' + (at + 1));
  console.error('  свежая:   ' + fresh.table[at]);
  console.error('  прожитая: ' + aged.table[at]);
  process.exit(1);
}
console.log('жетон этапа не помнит, сколько этапов прожила вкладка');
