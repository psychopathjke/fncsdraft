// Откат прода одной командой: выложить собранную папку прошлого прода и проверить, что сайт отдаёт её app.js.
//
// Папки прода лежат в «Рабочий стол до 07.09/деплои/fncsdraft-prod-<ДД.ММ><буква>» — они и есть то, что было на сайте.
// Пересобирать из тега не нужно и опасно (сборка зависит от данных на диске); выкладывается сама папка.
//
//   node tools/prod-rollback.js                 — список папок прода, свежие сверху (ничего не выкладывает)
//   node tools/prod-rollback.js 22.10a          — выложить fncsdraft-prod-22.10a
//   node tools/prod-rollback.js 22.10a --yes    — без вопроса (по слову владельца в разговоре)
// Воркер (server/) этим не откатывается: `cd server && npx wrangler rollback` — отдельно и только если менялся он.
const fs = require('fs'), path = require('path'), https = require('https'), readline = require('readline');
const { execFileSync, spawnSync } = require('child_process');
const DEPLOYS = process.env.FD_DEPLOYS || 'C:/Users/FoxOS_User/Desktop/Рабочий стол до 07.09/деплои';
const ROOT = path.resolve(__dirname, '..');
const want = process.argv[2], yes = process.argv.includes('--yes');

const appOf = dir => { try { return (fs.readFileSync(path.join(dir, 'index.html'), 'utf8').match(/app\.js\?v=([0-9a-f]+)/) || [])[1] || null; } catch (e) { return null; } };
const live = host => new Promise(res => {
  https.get('https://' + host + '/?cb=' + Date.now(), r => { let b = ''; r.on('data', d => b += d); r.on('end', () => res((b.match(/app\.js\?v=([0-9a-f]+)/) || [])[1] || null)); })
    .on('error', () => res(null));
});
const prods = fs.readdirSync(DEPLOYS).filter(n => /^fncsdraft-prod-/.test(n))
  .map(n => ({ n, t: fs.statSync(path.join(DEPLOYS, n)).mtimeMs })).sort((a, b) => b.t - a.t);

(async () => {
  const now = await live('fncsdraft.com');
  if (!want) {
    console.log('на сайте сейчас app.js ' + now);
    prods.slice(0, 12).forEach(p => { const a = appOf(path.join(DEPLOYS, p.n)); console.log((a === now ? '* ' : '  ') + p.n.replace('fncsdraft-prod-', '').padEnd(10) + ' app.js ' + a + '  ' + new Date(p.t).toISOString().slice(0, 16).replace('T', ' ')); });
    console.log('откат: node tools/prod-rollback.js <ДД.ММбуква>');
    return;
  }
  const name = /^fncsdraft-prod-/.test(want) ? want : 'fncsdraft-prod-' + want;
  const dir = path.join(DEPLOYS, name);
  if (!fs.existsSync(path.join(dir, 'index.html'))) { console.error('нет папки ' + dir); process.exit(2); }
  const target = appOf(dir);
  if (target === now) { console.log('на сайте уже ' + name + ' (app.js ' + now + ')'); return; }
  console.log('сейчас app.js ' + now + ' → откат на ' + name + ' (app.js ' + target + ')');
  if (!yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const a = await new Promise(r => rl.question('выкладываем? (да/нет) ', r)); rl.close();
    if (!/^(да|y|yes)$/i.test(String(a).trim())) { console.log('отменено'); return; }
  }
  // Папка должна подниматься сама по себе (ничего не 404) — та же проверка, что перед любой выкладкой.
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'check-deploy-folder.js'), dir], { stdio: 'inherit' });
  const r = spawnSync('npx', ['wrangler', 'pages', 'deploy', '.', '--project-name=fncsdraft', '--branch=main', '--commit-dirty=true'], { cwd: dir, shell: true, stdio: 'inherit' });
  if (r.status !== 0) { console.error('wrangler упал'); process.exit(1); }
  let got = null;
  for (let i = 0; i < 12 && got !== target; i++) { await new Promise(s => setTimeout(s, 5000)); got = await live('fncsdraft.com'); }
  const pages = await live('fncsdraft.pages.dev');
  if (got !== target || pages !== target) { console.error('сайт отдаёт ' + got + ' / ' + pages + ', ждали ' + target + ' (кэш? проверить ещё раз через минуту)'); process.exit(1); }
  console.log('откат готов: fncsdraft.com и pages.dev отдают app.js ' + target + ' (' + name + ')');
  console.log('зеркало: bash tools/push-mirror.sh "' + dir + '"');
})().catch(e => { console.error(e); process.exit(1); });
