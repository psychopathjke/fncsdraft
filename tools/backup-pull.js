// Резервная копия данных сервера на этот ПК: таблица карьер, драфт дня, журналы, облачные сейвы игроков.
//
// Всё это жило только в Cloudflare (Durable Objects): сломался объект или ошибка в коде воркера — не вернуть.
// Воркер отдаёт выгрузку по /backup только с ключом (секрет BACKUP_KEY); ключ лежит здесь, вне репозитория:
// C:/Users/FoxOS_User/fd-backup/key.txt. Копия — C:/Users/FoxOS_User/fd-backup/<дата>/, хранятся последние 14.
// Облачные сейвы — по реестру кодов (код попадает в реестр при сохранении после 22.10).
//
//   node tools/backup-pull.js                 (зовёт и ночной прогон, tools/night-sweep.js)
const fs = require('fs'), path = require('path'), https = require('https'), http = require('http');
const DIR = process.env.FD_BACKUP || 'C:/Users/FoxOS_User/fd-backup';
const HOST = process.env.FD_MP || 'https://mp.fncsdraft.com';
const KEEP = 14;
let key = '';
try { key = fs.readFileSync(path.join(DIR, 'key.txt'), 'utf8').trim(); } catch (e) {}
if (key.length < 24) { console.error('нет ключа ' + path.join(DIR, 'key.txt')); process.exit(2); }

const get = q => new Promise((res, rej) => {
  const u = new URL(HOST + '/backup?' + q), lib = u.protocol === 'http:' ? http : https;
  lib.get(u, { headers: { 'X-Fd-Key': key } }, r => {
    const b = []; r.on('data', d => b.push(d));
    r.on('end', () => { const t = Buffer.concat(b).toString('utf8'); if (r.statusCode !== 200) return rej(new Error(q + ': http ' + r.statusCode)); try { res(JSON.parse(t)); } catch (e) { rej(new Error(q + ': не JSON')); } });
  }).on('error', rej);
});

(async () => {
  const day = new Date().toISOString().slice(0, 10);
  const out = path.join(DIR, day);
  fs.mkdirSync(path.join(out, 'vault'), { recursive: true });
  const board = await get('part=board');
  fs.writeFileSync(path.join(out, 'board.json'), JSON.stringify(board));
  const { codes } = await get('part=vaults');
  let saves = 0, bytes = 0, bad = 0;
  for (const c of codes || []) {
    try {
      const v = await get('part=vault&code=' + encodeURIComponent(c.code));
      const t = JSON.stringify(v); bytes += t.length; saves += (v.meta || []).length;
      fs.writeFileSync(path.join(out, 'vault', c.code + '.json'), t);
    } catch (e) { bad++; }
  }
  const line = day + ': карьер ' + (board.rows || []).length + ', драфт дня ' + (board.daily || []).length + ', журнал ' + (board.errs || []).length +
    ', кодов облака ' + (codes || []).length + ' (сейвов ' + saves + ', ' + Math.round(bytes / 1024) + ' КБ' + (bad ? ', не скачалось ' + bad : '') + ')';
  fs.writeFileSync(path.join(out, 'summary.txt'), line + '\n');
  // Старые копии — за пределами последних KEEP дней.
  fs.readdirSync(DIR).filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort().slice(0, -KEEP)
    .forEach(n => fs.rmSync(path.join(DIR, n), { recursive: true, force: true }));
  console.log('резервная копия: ' + line + ' → ' + out);
  if (bad) process.exit(1);
})().catch(e => { console.error('резервная копия: ' + (e && e.message || e)); process.exit(1); });
