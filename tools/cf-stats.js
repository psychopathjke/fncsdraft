// Статистика Cloudflare одной командой: люди по дням (Web Analytics, без ботов), страницы, страны, откуда пришли,
// ошибки воркеров за сутки и выкладки сайта за неделю — чтобы видеть, совпадает ли скачок с выкладкой.
//
// Доменный счётчик Cloudflare считает ботов (17.10: 3.56k против 339 людей), здесь только RUM — живые браузеры.
//
// Токен — только чтение (Account Analytics: Read, Cloudflare Pages: Read), НЕ в git:
//   CF_API_TOKEN=... или файл C:/Users/FoxOS_User/fd-cf/token.txt. Нет токена — пишет «пропуск» и выходит с 0.
//
//   node tools/cf-stats.js           (неделя, подробно)
//   node tools/cf-stats.js --short   (одна строка для ночного прогона)
//   node tools/cf-stats.js --query   (печать GraphQL-запроса — для MCP cloudflare, когда токена нет)
// У GraphQL Cloudflare маленький бюджет: после пары тяжёлых запросов — «Rate limiter budget depleted», ждать 5 минут.
const fs = require('fs'), https = require('https');
const HOST = 'fncsdraft.com';
const TOKEN_FILE = process.env.FD_CF_TOKEN_FILE || 'C:/Users/FoxOS_User/fd-cf/token.txt';
const DAYS = 7;

const QUERY = `query($a:String!,$s:Time!,$s1:Time!,$e:Time!,$h:String!){viewer{accounts(filter:{accountTag:$a}){
  days: rumPageloadEventsAdaptiveGroups(limit:50, filter:{datetime_geq:$s, datetime_lt:$e, requestHost:$h}, orderBy:[date_ASC]){ sum{visits} dimensions{date} }
  pages: rumPageloadEventsAdaptiveGroups(limit:15, filter:{datetime_geq:$s1, datetime_lt:$e, requestHost:$h}, orderBy:[sum_visits_DESC]){ sum{visits} dimensions{requestPath} }
  countries: rumPageloadEventsAdaptiveGroups(limit:10, filter:{datetime_geq:$s1, datetime_lt:$e, requestHost:$h}, orderBy:[sum_visits_DESC]){ sum{visits} dimensions{countryName} }
  refs: rumPageloadEventsAdaptiveGroups(limit:10, filter:{datetime_geq:$s1, datetime_lt:$e, requestHost:$h}, orderBy:[sum_visits_DESC]){ sum{visits} dimensions{refererHost} }
  workers: workersInvocationsAdaptive(limit:50, filter:{datetime_geq:$s1, datetime_lt:$e}, orderBy:[sum_requests_DESC]){ sum{requests errors} dimensions{scriptName status} }
}}}`;

function vars(account) {
  const e = new Date();
  return { a: account, h: HOST, e: e.toISOString(), s: new Date(e - DAYS * 864e5).toISOString(), s1: new Date(e - 864e5).toISOString() };
}

function token() {
  if (process.env.CF_API_TOKEN) return process.env.CF_API_TOKEN.trim();
  try { return fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch (e) { return ''; }
}

function api(tok, method, path, body) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const q = https.request({ host: 'api.cloudflare.com', path: '/client/v4' + path, method,
      headers: Object.assign({ Authorization: 'Bearer ' + tok }, data ? { 'Content-Type': 'application/json' } : {}) }, r => {
      let b = ''; r.on('data', d => b += d);
      r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(new Error(path + ' ' + r.statusCode + ' ' + b.slice(0, 200))); } });
    });
    q.on('error', rej); q.setTimeout(30000, () => q.destroy(new Error('timeout ' + path)));
    if (data) q.write(data); q.end();
  });
}

const pct = (n, all) => all ? Math.round(n / all * 100) + '%' : '';

(async () => {
  if (process.argv.includes('--query')) {
    console.log(QUERY); console.log(JSON.stringify(vars('<accountId>'), null, 1)); return;
  }
  const short = process.argv.includes('--short');
  const tok = token();
  if (!tok) { console.log('статистика: пропуск (нет токена: CF_API_TOKEN или ' + TOKEN_FILE + ')'); return; }

  const acc = process.env.CF_ACCOUNT || ((await api(tok, 'GET', '/accounts')).result || [])[0]?.id;
  if (!acc) throw new Error('токен не видит ни одного аккаунта');
  const g = await api(tok, 'POST', '/graphql', { query: QUERY, variables: vars(acc) });
  if (g.errors && g.errors.length) throw new Error(g.errors.map(x => x.message).join('; '));
  const A = g.data.viewer.accounts[0];

  const days = A.days.map(r => [r.dimensions.date, r.sum.visits]);
  const wk = A.workers.reduce((m, r) => {
    const k = r.dimensions.scriptName; m[k] = m[k] || { req: 0, err: 0, bad: {} };
    m[k].req += r.sum.requests; m[k].err += r.sum.errors;
    if (r.dimensions.status !== 'success') m[k].bad[r.dimensions.status] = (m[k].bad[r.dimensions.status] || 0) + r.sum.requests;
    return m;
  }, {});

  // Выкладки сайта за неделю (Pages) — рядом с днями, чтобы скачок было с чем сравнить.
  let deploys = [];
  try {
    const d = await api(tok, 'GET', '/accounts/' + acc + '/pages/projects/fncsdraft/deployments?env=production&per_page=25');
    const since = Date.now() - DAYS * 864e5;
    deploys = (d.result || []).filter(x => Date.parse(x.created_on) >= since && x.latest_stage?.status === 'success')
      .map(x => x.created_on.slice(0, 16).replace('T', ' '));
  } catch (e) {}

  if (short) {
    const y = days.length > 1 ? days[days.length - 2] : days[0] || ['?', 0];
    const avg = days.length ? Math.round(days.reduce((s, d) => s + d[1], 0) / days.length) : 0;
    const errs = Object.entries(wk).filter(([, v]) => v.err).map(([k, v]) => k + ' ' + v.err + '/' + v.req).join(', ');
    console.log('люди: вчера (' + y[0] + ') ' + y[1] + ', в среднем за неделю ' + avg + ' · ошибки воркеров за сутки: ' + (errs || 'нет'));
    return;
  }

  const dep = deploys.reduce((m, t) => { const k = t.slice(0, 10); m[k] = (m[k] || 0) + 1; return m; }, {});
  console.log('ЛЮДИ ПО ДНЯМ (' + HOST + ', Web Analytics, без ботов)');
  days.forEach(([d, v]) => console.log('  ' + d + '  ' + String(v).padStart(5) + (dep[d] ? '   выкладок: ' + dep[d] : '')));
  const tot = A.pages.reduce((s, r) => s + r.sum.visits, 0);
  console.log('\nСТРАНИЦЫ ЗА СУТКИ'); A.pages.forEach(r => console.log('  ' + String(r.sum.visits).padStart(5) + '  ' + r.dimensions.requestPath));
  console.log('\nСТРАНЫ ЗА СУТКИ'); A.countries.forEach(r => console.log('  ' + String(r.sum.visits).padStart(5) + ' ' + pct(r.sum.visits, tot).padStart(4) + '  ' + r.dimensions.countryName));
  console.log('\nОТКУДА ПРИШЛИ ЗА СУТКИ'); A.refs.forEach(r => console.log('  ' + String(r.sum.visits).padStart(5) + '  ' + (r.dimensions.refererHost || '(напрямую)')));
  console.log('\nВОРКЕРЫ ЗА СУТКИ');
  Object.entries(wk).forEach(([k, v]) => console.log('  ' + k + ': запросов ' + v.req + ', ошибок ' + v.err +
    (Object.keys(v.bad).length ? ' (' + Object.entries(v.bad).map(([s, n]) => s + ' ' + n).join(', ') + ')' : '')));
})().catch(e => { console.log('FAIL статистика: ' + String(e.message || e).slice(0, 300)); process.exit(1); });
