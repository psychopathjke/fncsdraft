// Ночной прогон онлайна: команда вдвоём и гонка вдвоём по всем годам 2019–2026 (16 прогонов, по PAR одновременно).
//
// Свип идёт часами, днём он мешает работать. Запускается планировщиком Windows ночью (задача «fncsdraft night sweep»),
// утром — готовый список: C:/Users/FoxOS_User/fd-night/<дата>/summary.txt (OK/FAIL, первая красная строка) и лог каждого.
// Код берётся из ОТДЕЛЬНОЙ копии (git worktree от HEAD) — правки днём не меняют файл посреди ночного прогона.
// Воркер: если на 8787 никто не отвечает — поднимается свой wrangler dev и в конце гасится (только свой PID).
//
//   node tools/night-sweep.js              (все)
//   node tools/night-sweep.js "race-202[45]"   (по маске kind-год)
const { spawn, execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.FD_NIGHT || 'C:/Users/FoxOS_User/fd-night';
const day = new Date().toISOString().slice(0, 10);
const OUT = path.join(BASE, day);
const WT = path.join(BASE, 'wt');
const PAR = Number(process.env.PAR || 3);
const Y = { 2019: ['2019-02-25', '2019-12-29'], 2020: ['2020-01-13', '2020-11-29'], 2021: ['2020-12-07', '2021-12-05'], 2022: ['2022-01-10', '2022-12-11'],
  2023: ['2022-12-12', '2023-11-30'], 2024: ['2023-12-04', '2024-11-30'], 2025: ['2024-12-02', '2025-11-29'], 2026: ['2025-12-15', '2026-11-29'] };
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
fs.mkdirSync(OUT, { recursive: true });
const summary = path.join(OUT, 'summary.txt');
const say = s => { fs.appendFileSync(summary, s + '\n'); console.log(s); };

const alive = () => new Promise(res => {
  const q = http.get('http://127.0.0.1:8787/', r => { r.resume(); res(true); });
  q.on('error', () => res(false)); q.setTimeout(3000, () => { q.destroy(); res(false); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.writeFileSync(summary, '');
  // Копия кода: HEAD ветки на момент запуска.
  try { execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: ROOT, stdio: 'ignore' }); } catch (e) {}
  try { fs.rmSync(WT, { recursive: true, force: true }); } catch (e) {}
  execFileSync('git', ['worktree', 'prune'], { cwd: ROOT, stdio: 'ignore' });
  execFileSync('git', ['worktree', 'add', '--detach', WT, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
  const head = execFileSync('git', ['log', '--oneline', '-1'], { cwd: WT, encoding: 'utf8' }).trim();
  say('ночной прогон ' + day + ' · ' + head);
  // Резервная копия данных сервера (tools/backup-pull.js) — до прогона, она быстрая.
  try { say(execFileSync(process.execPath, [path.join(ROOT, 'tools', 'backup-pull.js')], { encoding: 'utf8' }).trim()); }
  catch (e) { say('FAIL резервная копия: ' + String((e.stderr || e.message || e)).trim().slice(0, 300)); }
  // Сервер жив? Тот же адрес, что у игроков: таблица карьер и журнал поломок за ночь.
  try {
    const one = u => new Promise(res => require('https').get(u, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => res({ c: r.statusCode, b })); }).on('error', e => res({ c: 0, b: String(e.message) })));
    const b = await one('https://mp.fncsdraft.com/board'), e = await one('https://mp.fncsdraft.com/errlog?limit=200');
    say((b.c === 200 ? 'OK  ' : 'FAIL') + ' сервер mp.fncsdraft.com /board ' + b.c);
    let errs = []; try { errs = JSON.parse(e.b).errs || []; } catch (x) {}
    const since = Date.now() - 864e5, fresh = errs.filter(r => r.at >= since);
    say('журнал поломок за сутки: ' + fresh.length + ' видов, ' + fresh.reduce((s, r) => s + (r.n || 1), 0) + ' раз' +
      fresh.slice(0, 5).map(r => '\n    ' + r.kind + ' ×' + r.n + ' ' + r.build + ' ' + r.msg.slice(0, 120) + (r.src ? ' @' + r.src : '')).join(''));
  } catch (e) { say('FAIL проверка сервера: ' + String(e.message || e).slice(0, 200)); }

  let worker = null;
  if (!(await alive())) {
    const wlog = fs.openSync(path.join(OUT, 'wrangler.log'), 'w');
    worker = spawn('npx', ['wrangler', 'dev', '--port', '8787', '--local'], { cwd: path.join(WT, 'server'), shell: true, stdio: ['ignore', wlog, wlog] });
    for (let i = 0; i < 60 && !(await alive()); i++) await sleep(2000);
    if (!(await alive())) { say('FAIL воркер не поднялся (см. wrangler.log)'); process.exit(1); }
    say('воркер поднят этим прогоном (pid ' + worker.pid + ')');
  }

  const jobs = [];
  Object.keys(Y).forEach(y => {
    jobs.push({ kind: 'team', y, file: 'tools/check-mp-team-season.js', env: { CC_MODE: 'card', CC_SEASONS: '1', CC_YEAR: y, CC_BUDGET: String(3 * 3600000) } });
    jobs.push({ kind: 'race', y, file: 'tools/check-race-live-six.js', env: { CC_N: '2', CC_YEAR: y === '2026' ? '' : y, CC_DAY: Y[y][0], CC_FF: Y[y][1], CC_BUDGET: String(3 * 3600000) } });
  });
  const todo = jobs.filter(j => !only || only.test(j.kind + '-' + j.y));
  let i = 0, bad = 0;
  const one = j => new Promise(res => {
    const log = path.join(OUT, j.kind + '-' + j.y + '.log'), out = fs.openSync(log, 'w'), t0 = Date.now();
    const p = spawn(process.execPath, [j.file], { cwd: WT, env: Object.assign({}, process.env, { CC_HOST: 'ws://127.0.0.1:8787' }, j.env), stdio: ['ignore', out, out] });
    p.on('exit', code => {
      const text = fs.readFileSync(log, 'utf8').split('\n').filter(l => l.trim() && !/ERROR:|device_event|gcm|PHONE_REG|DEPRECATED_ENDPOINT/.test(l));
      const red = text.find(l => /FAIL/.test(l)) || '';
      const last = text.slice(-1)[0] || '';
      if (code !== 0) bad++;
      say((code === 0 ? 'OK  ' : 'FAIL') + ' ' + j.kind + ' ' + j.y + ' ' + Math.round((Date.now() - t0) / 60000) + 'm :: ' +
        (code === 0 ? last : red || last).trim().slice(0, 400));
      res();
    });
  });
  await Promise.all(Array.from({ length: Math.min(PAR, todo.length) }, async () => { while (i < todo.length) await one(todo[i++]); }));
  say('итог: ' + (todo.length - bad) + '/' + todo.length + ' зелёных');

  // Свой воркер — гасится деревом своего PID; чужой (дневной) не трогаем.
  if (worker) { try { execFileSync('taskkill', ['/PID', String(worker.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {} }
  try { execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: ROOT, stdio: 'ignore' }); } catch (e) {}
  process.exit(bad ? 1 : 0);
})().catch(e => { say('FAIL ' + (e && e.stack || e)); process.exit(1); });
