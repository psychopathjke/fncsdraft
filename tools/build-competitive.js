// Страница /competitive (25.10, его «отдельной вкладкой, как компететив… календарь турниров, за месяц призы игроков,
// новости»; «хочу чтоб на сайте было 2 вкладки карьера и компетитив»).
//
// Из tools/measured: comp-calendar.json и comp-results.json (fetch-competitive.js), solos-2026-predict.json (прогноз).
// Время в разметке — UTC, страница переводит его в часы зрителя и прячет прошедшее. Регион по умолчанию —
// по часовому поясу браузера. Английская, как /predict.
//
//   node tools/build-competitive.js <папка деплоя>   (зовёт build-deploy.js)
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(OUT, 'index.html'))) throw new Error('нужна папка деплоя с index.html');
const M = path.join(__dirname, 'measured');
const read = f => fs.existsSync(path.join(M, f)) ? JSON.parse(fs.readFileSync(path.join(M, f), 'utf8')) : null;
const CAL = read('comp-calendar.json'), RES = read('comp-results.json'), PRED = read('solos-2026-predict.json');
if (!CAL) { console.log('competitive: нет comp-calendar.json, пропуск'); process.exit(0); }
const SITE = 'https://fncsdraft.com';
const NOW = Date.now();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const money = v => '$' + Math.round(v).toLocaleString('en-US');
const flag = c => c && fs.existsSync(path.join(__dirname, '..', 'flags', 'w20', String(c).toLowerCase() + '.png'))
  ? '<img src="/flags/w20/' + esc(String(c).toLowerCase()) + '.png" alt="" width="16" loading="lazy">' : '';

// Имя окна Epic → человеческое. У Epic в календаре сырые id («ConsoleVCC SolosZB Event8Round2»).
const WORDS = [[/ConsoleVCC/g, 'Console Victory Cash Cup'], [/MobileVictoryCup/g, 'Mobile Victory Cup'], [/ReloadSoloVictoryCup/g, 'Reload Solo Victory Cup'],
  [/ReloadCashCup/g, 'Reload Cash Cup'], [/RankedCupReloadDuos/g, 'Ranked Reload Duos Cup'], [/RankedCupSoloReload/g, 'Ranked Reload Solo Cup'],
  [/RankedCupDuos/g, 'Ranked Duos Cup'], [/RankedCupSolo/g, 'Ranked Solo Cup'], [/ArenaTestCup/g, 'Arena Cup'], [/PSNickEh30/g, 'Nick Eh 30 Cup'],
  [/FNCSSoloQualifiers/g, 'FNCS Solos Qualifier'], [/FNCSSoloFastTracks/g, 'FNCS Solos Fast Track'], [/FNCSSolo/g, 'FNCS Solos'],
  [/HeatsStage/g, 'Heats'], [/LastChanceQualifier/g, 'Last Chance'], [/LastChanceLobby/g, 'Last Chance Lobby'], [/\bFinal\b/g, 'Finals'],
  [/SolosZB|DuosZB|\bZB\b/g, 'Zero Build'], [/Event(\d+)\s*Round(\d+)/g, 'Week $1 · Round $2'], [/Event(\d+)/g, 'Week $1'],
  [/Round(\d+)/g, 'Round $1'], [/Qual(\d+)/g, 'Qualifier $1 ·'], [/Day(\d+)/g, 'Day $1'], [/Heat(\d+)/g, 'Heat $1'], [/\s*-\s*/g, ' · ']];
function pretty(name) {
  let s = String(name || '');
  WORDS.forEach(([re, to]) => { s = s.replace(re, to); });
  return s.replace(/\s+/g, ' ').replace(/· ·/g, '·').replace(/\s·\s*$/, '').trim();
}
const kind = w => /FNCS|^Bratwurst_|^MannekenPis_/.test(w) ? 'fncs' : /VCC|VictoryCup|CashCup|PerformanceEvaluation|NickEh30/.test(w) ? 'cash' : /Ranked/.test(w) ? 'ranked' : 'other';
const KIND = { fncs: 'FNCS', cash: 'Cash cup', ranked: 'Ranked cup', other: 'Cup' };
// LAN-ивенты Epic (события …_Official: FNCS Major 1 Summit «Bratwurst», Global Championship «MannekenPis», мобильный «BOG»)
// региона не имеют — «LAN», видны при любом выбранном регионе (26.10, его «почему в мае нет лан фнкса»).
const LAN_W = /^(Bratwurst|MannekenPis|BOG|LQ)_/i;
const regOf = e => LAN_W.test(e.w) || e.region === 'LAN' ? 'LAN' : REGS.includes(e.region) ? e.region : (String(e.w).split('_').pop());
// Страна → соревновательный регион Epic (по серверам, где играет сцена этой страны). 'NA' — потом NAC или NAW.
const COUNTRY_REG = {};
['gb','ie','fr','de','at','ch','nl','be','lu','es','pt','it','mt','dk','se','no','fi','is','ee','lv','lt','pl','cz','sk','hu','si','hr','ba','rs','me','mk','al',
 'xk','ro','bg','gr','cy','tr','ua','by','md','ru','ge','am','az','kz','uz','kg','tj','tm','il','ma','dz','tn','za','ng','ke'].forEach(c => COUNTRY_REG[c] = 'EU');
['us','ca','pr','mx','gt','sv','hn','ni','cr','pa','do','cu','jm','tt','bs','ht'].forEach(c => COUNTRY_REG[c] = 'NA');
['br','ar','cl','uy','py','bo','pe','co','ve','ec'].forEach(c => COUNTRY_REG[c] = 'BR');
['sa','ae','kw','qa','bh','om','jo','lb','iq','sy','ye','eg','ps','ly','sd','ir'].forEach(c => COUNTRY_REG[c] = 'ME');
['jp','kr','cn','tw','hk','mo','th','vn','ph','sg','my','id','in','pk','bd','lk','mn','kh','la','mm'].forEach(c => COUNTRY_REG[c] = 'ASIA');
['au','nz','fj','pg'].forEach(c => COUNTRY_REG[c] = 'OCE');
// СНГ (28.10, его «компетитив cis ещё сделать по призам»): своего сервера нет, играют на EU — фильтр призовых по стране игрока.
const CIS_C = ['ru', 'ua', 'by', 'kz', 'uz', 'kg', 'tj', 'tm', 'am', 'az', 'md', 'ge'];
const homeRegion = c => c ? COUNTRY_REG[String(c).toLowerCase()] || null : null;

// ---- Главное событие: финал FNCS Solos с прогнозом
const finals = CAL.events.filter(e => /FNCSSolo_Final_Day1_/.test(e.w)).map(e => ({ reg: regOf(e), begin: e.begin }))
  .filter(f => REGS.includes(f.reg)).sort((a, b) => a.begin < b.begin ? -1 : 1);
const finalsLive = finals.length && Date.parse(finals[finals.length - 1].begin) + 2 * 86400e3 > NOW;
const heroHTML = finalsLive ? `<section class="glass hero">
  <span class="tag">Next up · Finals</span>
  <h2>FNCS Solos 2026 Finals</h2>
  <p class="sub">The first solo FNCS in years. 100 players per region, two days, six games a night.</p>
  <ul class="when">${finals.map(f => {
    const fav = PRED && PRED.regions[f.reg] && PRED.regions[f.reg][0];
    return `<li data-t="${esc(f.begin)}"><b>${esc(f.reg)}</b><time datetime="${esc(f.begin)}">${esc(f.begin.slice(5, 16).replace('T', ' '))} UTC</time>` +
      (fav ? `<span>Fav: ${esc(fav.n)} ${Math.round(fav.win * 100)}%</span>` : '') + '</li>';
  }).join('')}</ul>
  <a class="btn" href="/predict/fncs-solos-2026">Win chances and drop maps</a>
</section>` : '';

// ---- FNCS Solo Reload (ноябрь): финалистов до квалификаций нет, поэтому пока фавориты по Reload-окнам 2026 года в
// регионе: призовые Reload (соло-окна в полную силу, дуо пополам), +$500 за каждую победу. Полный прогноз с картами
// дропа — когда станут известны финалисты.
const RL_FINAL = {}, RL_TRK = read('comp-calendar-tracker.json');
(RL_TRK && RL_TRK.windows || []).forEach(w => { const m = /^S43_FNCSSoloReload_Final_(\w+)$/.exec(w.w); if (m && !RL_FINAL[m[1]]) RL_FINAL[m[1]] = w.begin; });
const RL_Q = {};
(RL_TRK && RL_TRK.windows || []).forEach(w => { const m = /^S43_FNCSSoloReloadQualifiers_Qual1Round1Day1_(\w+)$/.exec(w.w); if (m && !RL_Q[m[1]]) RL_Q[m[1]] = w.begin; });
const RL = {};
(RES && RES.windows || []).filter(w => /Reload/i.test(w.w) && !/Ranked/i.test(w.w) && REGS.includes(w.region)).forEach(w => (w.top || []).forEach(t => {
  const share = (t.ids || []).length > 1 ? 0.5 : 1;
  (t.ids || []).forEach((id, i) => {
    const R = RL[w.region] || (RL[w.region] = new Map());
    const p = R.get(id) || { n: t.n[i], c: t.c && t.c[i], usd: 0, wins: 0, ev: 0 };
    p.usd += (t.usd || 0) / (t.ids.length || 1); p.wins += t.rank === 1 ? 1 : 0; p.ev++;
    p.score = (p.score || 0) + share * ((t.usd || 0) / (t.ids.length || 1) + (t.rank === 1 ? 500 : 0));
    if (t.c && t.c[i]) p.c = t.c[i];
    R.set(id, p);
  });
}));
const rlDay = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'November';
const reloadHTML = Object.keys(RL_FINAL).length ? `<section class="glass panel rlp"><span class="tag">Early favourites</span>
<h2>FNCS Solos Reload 2026</h2>
<p class="sub">Qualifiers from ${rlDay(RL_Q.EU)}, finals ${rlDay(RL_FINAL.EU)}. Until the finalists are known, this ranks players by their 2026 Reload results in each region: Reload prize money (solo events count in full, duos at half) plus $500 per win. The full prediction with drop maps follows once the finals line-up is set.</p>
<div class="rlr">${REGS.map(r => `<button type="button" data-rr="${r}">${r}</button>`).join('')}</div>
${REGS.map(r => {
  const top = [...(RL[r] || new Map()).values()].sort((a, b) => b.score - a.score).slice(0, 10);
  return `<div class="rlt" data-rr="${r}" hidden>` + (top.length ? '<table class="tbl"><thead><tr><th>#</th><th>Player</th><th class="n">Reload cups</th><th class="n">Wins</th><th class="n">Reload $</th></tr></thead><tbody>' +
    top.map((p, i) => `<tr><td class="n">${i + 1}</td><td class="pl">${flag(p.c)}${esc(p.n)}</td><td class="n">${p.ev}</td><td class="n">${p.wins || ''}</td><td class="n p1">${money(Math.round(p.usd))}</td></tr>`).join('') +
    '</tbody></table>' : '<p class="note">No Reload results in this region yet.</p>') + (RL_FINAL[r] ? `<p class="small">Finals: ${esc(RL_FINAL[r].slice(0, 16).replace('T', ' '))} UTC</p>` : '') + '</div>';
}).join('')}
</section>` : '';

// Окна, которых у eucompetitive нет (26.10: их сезон S43 пуст, а FNCS Solos Reload с 3 ноября уже в календаре Tracker) —
// из comp-calendar-tracker.json (imp_calendar страниц fortnitetracker.com/events, снят Playwright'ом). Конца окна Tracker
// не даёт — три часа от начала, как у обычного капа.
const TRK = read('comp-calendar-tracker.json');
if (TRK) {
  const have = new Set(CAL.events.map(e => e.w));
  TRK.windows.forEach(x => {
    if (!x.w || have.has(x.w)) return;
    const reg = String(x.w).split('_').pop();
    CAL.events.push({ w: x.w, ev: x.ev, name: x.title + (x.sub ? ' · ' + x.sub : ''), region: reg, begin: x.begin.replace('+00:00', 'Z'),
      end: new Date(Date.parse(x.begin) + 3 * 3600e3).toISOString(), status: 'tracker', pretty: true });
  });
}

// Весь 2026 год (26.10, его «сделай весь 2026 год»): окна событий со страниц Tracker (comp-events-2026.json:
// imp_event — время окон, название, обложка). Январь–май есть только там.
const EVY = read('comp-events-2026.json');
if (EVY) {
  const have = new Set(CAL.events.map(e => e.w));
  Object.entries(EVY).forEach(([ev, e]) => {
    if (!e || !e.w) return;
    const reg = /_Official$/.test(ev) ? 'LAN' : String(ev).split('_').pop();
    e.w.forEach(w => {
      if (!w.w || have.has(w.w) || w.ex || !w.b) return;
      have.add(w.w);
      CAL.events.push({ w: w.w, ev, name: [e.t1, e.t2].filter(Boolean).join(' ').trim() + (w.n ? ' · ' + w.n : ''), region: reg,
        begin: String(w.b).replace('+00:00', 'Z'), end: String(w.e || w.b).replace('+00:00', 'Z'), img: e.poster || null, status: 'tracker', pretty: true });
    });
  });
}

// Сторонние ЛАНы, шоу-матчи и онлайн-турниры не Epic (Liquipedia, comp-lan-lq.json) — днём турнира в календаре.
const LQY = read('comp-lan-lq.json');
if (LQY) Object.entries(LQY).forEach(([page, L]) => {
  // Весь список A/B-Tier (26.10, пункт 8): и без мест — будущий (Coupe de France) и клубный (Saudi eLeague) — днём в календаре.
  const w = 'LQ_' + page.replace(/[^A-Za-z0-9]+/g, '_');
  if (CAL.events.some(e => e.w === w)) return;
  CAL.events.push({ w, ev: 'liquipedia', name: L.name + (L.city && !/^(Online|Europe|North America|Middle East|World|Brazil|Asia|Oceania)$/.test(L.city) ? ' · ' + L.city.split(/\s{2,}/)[0] : ''), region: 'LAN',
    begin: L.day + 'T12:00:00Z', end: (L.end || L.day) + 'T20:00:00Z', img: null, status: 'liquipedia', pretty: true });
});

// ---- Календарь как в карьере (26.10, его «календарь в виде календаря как в карьере»): сетка месяца с понедельника,
// в клетке — плашки серий дня цветом вида, у дня FNCS — обложка; клик по дню — список окон с временем зрителя.
// В страницу едет только сам список окон с начала прошлого месяца (строки — таблицей, окна — массивами).
const from = new Date(Date.UTC(2026, 0, 1));   // весь 2026 год
const upcoming = CAL.events.filter(e => Date.parse(e.begin) >= from.getTime() && (REGS.includes(regOf(e)) || regOf(e) === 'LAN'))
  .sort((a, b) => a.begin < b.begin ? -1 : a.begin > b.begin ? 1 : 0);
const series = n => n.replace(/ · (Week|Round|Session|Heat) \d+/g, '').replace(/ · Qualifier \d+ ·/g, ' ·').replace(/ · (Day \d+ )?Round \d+$/, '').trim();
const STR = [], strIx = new Map();
const sid = v => { if (!strIx.has(v)) { strIx.set(v, STR.length); STR.push(v); } return strIx.get(v); };
const KINDS = ['fncs', 'cash', 'ranked', 'other'];
// Обложка дня (26.10, его «добавь логотипы в календаре и пусть высший кап показывает»): плитка Epic самого старшего
// окна дня (tools/fetch-comp-art.js кладёт их в art/comp). У окон без своей картинки (ноябрь с Tracker) — плитка той же
// серии (id события без сезона и региона), у FNCS без неё — общая плитка FNCS.
const artFile = u => 'art/comp/' + String(u).split('/').pop().split('?')[0].replace(/^[0-9a-f]{8}-/, '').replace(/\.(png|jpeg)$/i, '.jpg');
const hasArt = u => u && fs.existsSync(path.join(__dirname, '..', artFile(u)));
const famOf = ev => String(ev || '').replace(/^epicgames_S\d+_/, '').replace(/_(EU|NAC|NAW|BR|ASIA|ME|OCE)$/, '').replace(/(Reload)?(Qualifiers|_HeatsStage|_LastChanceQualifier|_Final|FastTracks)$/, '');
const famArt = new Map();
CAL.events.forEach(e => { if (hasArt(e.img) && !famArt.has(famOf(e.ev))) famArt.set(famOf(e.ev), '/' + artFile(e.img)); });
const fncsArt = [...CAL.events].reverse().find(e => /FNCSSolo/.test(e.w) && hasArt(e.img));
const artOf = e => hasArt(e.img) ? '/' + artFile(e.img) : famArt.get(famOf(e.ev)) || (kind(e.w) === 'fncs' && fncsArt ? '/' + artFile(fncsArt.img) : '');
// Старшинство окна дня: финал FNCS, остальной FNCS, призовые серии (Performance, Nick Eh 30), кэш-капы, ranked, прочее.
const rankOf = (e, nm) => kind(e.w) === 'fncs' ? (/Final|Summit|Championship/.test(nm) ? 100 : 80) : /PerformanceEvaluation|NickEh30/.test(e.w) ? 60 : /^LQ_/.test(e.w) ? 70 : kind(e.w) === 'cash' ? 50 : kind(e.w) === 'ranked' ? 30 : 10;
const ART = {};
const CALDATA = upcoming.map(e => {
  const nm = e.pretty ? e.name : pretty(e.name);
  return [Math.round(Date.parse(e.begin) / 60000), Math.round(Date.parse(e.end || e.begin) / 60000), REGS.indexOf(regOf(e)), KINDS.indexOf(kind(e.w)), sid(series(nm)), sid(nm), sid(artOf(e)), rankOf(e, nm),
    (Math.abs(Date.parse(e.begin) - NOW) < 16 * 86400e3 && /^epicgames_/.test(e.ev || '')) ? sid(e.ev) : -1, (Math.abs(Date.parse(e.begin) - NOW) < 16 * 86400e3 && /^epicgames_/.test(e.ev || '')) ? sid(e.w) : -1];
});

// ---- Призы по месяцам и последние результаты
// Призовые идут за месяцем календаря (26.10, его «когда листаешь календарь, призовые должны меняться смотря какой
// месяц» и «сделай весь 2026 год»): в страницу едет топ каждого месяца (40 лучших каждого региона + 100 лучших всех),
// таблицу рисует скрипт под месяц, открытый в календаре.
// Регион игрока — его домашний, а не региона капа (26.10: «PANZER топ-1 NAC — ошибка, он европеец, взял призовые на
// Америке»): страна → регион; США и Канада — NAC/NAW по тому, где больше капов за год; страны нет — где больше капов.
// Деньги считаются все, где бы ни выиграны.
let resHTML = '', WEEK = null, RECS = [], NEWS = null;
const EARN = {};
if (RES && RES.windows.length) {
  // Ники Epic и ники игры расходятся: тег клана впереди («DIG Synth»), кириллица вместо латиницы, «ǃ», точка в конце, диакритика.
  const HOMO = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'к': 'k', 'м': 'm', 'т': 't', 'н': 'h', 'в': 'b', 'і': 'i', 'ѕ': 's' };
  const foldN = n => String(n).toLowerCase().replace(/[а-яёіѕ]/g, c => HOMO[c] || c).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[ǃ!]+/g, '').replace(/^[\s._\-]+|[\s._\-]+$/g, '').trim();
  const strip = n => String(n || '').replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();   // «hylnd amp [MES2026]», «[FNCS2026] BIG Vico» → без турнирной приписки
  const isHex = n => /^[0-9a-f]{32}$/i.test(n);
  // Все ники аккаунта за год (пункт 9, 26.10): один и тот же id в таблицах зовётся по-разному — vic0 был «VICO»,
  // «big vicoraga», «[EWC2026] BIG vic0». Раньше бралось первое попавшееся имя, и у vic0 не находилась карточка.
  const names = new Map();   // id → Map(ник → сколько раз)
  const lanOnly = new Map();   // id → играл только ЛАНы и сторонние турниры
  RES.windows.forEach(w => w.top.forEach(x => x.ids.forEach((id, i) => {
    const N = names.get(id) || new Map(); names.set(id, N);
    [x.n[i], x.epic[i]].forEach(n => { const s = strip(n); if (s && !isHex(s)) N.set(s, (N.get(s) || 0) + 1); });
    lanOnly.set(id, (lanOnly.has(id) ? lanOnly.get(id) : true) && regOf(w) === 'LAN');
  })));
  // Один человек — один id. ЛАН-аккаунт («[FNCS2026] BIG Malibuca», мобильный ЛАН «DIG Arsenic») и ники с Liquipedia
  // (lq:…, gc:…) сводятся к основному аккаунту, если ник (целиком или без тега клана) есть ровно у одного игрока капов.
  const full = new Map(), tail = new Map();
  const add = (M, k, id) => { if (!k) return; if (!M.has(k)) M.set(k, new Set()); M.get(k).add(id); };
  const tailOf = f => { const w = f.split(/\s+/); return w.length > 1 && w[w.length - 1].length >= 3 ? w[w.length - 1] : null; };
  names.forEach((N, id) => { if (lanOnly.get(id)) return; N.forEach((c, n) => { const f = foldN(n); add(full, f, id); add(tail, tailOf(f) || f, id); }); });
  const alias = new Map();
  names.forEach((N, id) => {
    if (!lanOnly.get(id)) return;
    for (const n of N.keys()) {
      const f = foldN(n), one = S => S && S.size === 1 ? [...S][0] : null;
      const to = one(full.get(f)) || one(tail.get(f)) || one(full.get(tailOf(f))) || one(tail.get(tailOf(f)));
      if (to && to !== id) { alias.set(id, to); break; }
    }
  });
  // Ники с Liquipedia без пары у Epic — между собой без учёта регистра («ByTobi» и «byTobi» — один человек).
  const lqBy = new Map();
  names.forEach((N, id) => { if (!/^(lq|gc):/.test(id) || alias.has(id)) return; const f = foldN(id.slice(3)); if (lqBy.has(f)) alias.set(id, lqBy.get(f)); else lqBy.set(f, id); });
  RES.windows.forEach(w => w.top.forEach(x => { x.ids = x.ids.map(id => alias.get(id) || id); }));
  alias.forEach((to, id) => { const N = names.get(to); names.get(id).forEach((c, n) => N.set(n, (N.get(n) || 0) + c)); names.delete(id); });
  // Рейтинг карточки — по всем никам, начиная с самого частого; показывается ник, по которому нашлась карточка,
  // иначе самый частый.
  const RT = read('player-ratings.json') || {};
  const RTF = new Map();
  Object.entries(RT).forEach(([k, v]) => { const f = foldN(k); if (!RTF.has(f) || RTF.get(f).r < v.r) RTF.set(f, v); });
  // Клан у карточки другой, чем в капах («Mask Fridge» в игре, «UN1Q Fridge» у Epic): ник без тега, если он у карточек один.
  const RTT = new Map();
  RTF.forEach((v, f) => { const t = tailOf(f); if (t && t.length >= 4) RTT.set(t, RTT.has(t) ? null : v); });
  const rtOf = n => {
    const f = foldN(n), w = f.split(/\s+/);
    const c = [f, w.length > 1 ? w.slice(1).join(' ') : null, w[w.length - 1], f.replace(/\s+/g, '')].filter(Boolean);
    for (const k of c) { const v = RT[k] || RTF.get(k); if (v) return v.r; }
    const t = w.length > 1 ? w[w.length - 1] : f, v = t.length >= 4 && !RTF.has(t) && RTT.get(t);
    return v ? v.r : 0;
  };
  const who = new Map();   // id → { n, v, c, at }
  names.forEach((N, id) => {
    const byUse = [...N.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
    let n = byUse[0] || 'Unknown player', v = 0;
    for (const k of byUse) { const r = rtOf(k); if (r) { n = k; v = r; break; } }
    who.set(id, { n, v, c: null, at: {} });
  });
  RES.windows.forEach(w => w.top.forEach(x => x.ids.forEach((id, i) => {
    const o = who.get(id);
    if (x.c[i]) { o.cs = o.cs || {}; o.cs[x.c[i]] = (o.cs[x.c[i]] || 0) + 1; }
    if (regOf(w) !== 'LAN') o.at[regOf(w)] = (o.at[regOf(w)] || 0) + 1;
  })));
  // Страна игрока — та, что чаще у него в таблицах (у одного и того же аккаунта eucompetitive и Tracker бывают разные:
  // PANZER — то ru, то rs). Ручные поправки — COUNTRY_FIX (его слово «panzer флаг россии», 26.10).
  const COUNTRY_FIX = { panzer: 'ru', t3eny: 'si' };   // t3eny в профиле Epic — Россия, на деле Словения
  who.forEach(o => {
    o.c = COUNTRY_FIX[String(o.n).toLowerCase()] || (o.cs ? Object.entries(o.cs).sort((a, b) => b[1] - a[1])[0][0] : null);
    const most = list => Object.entries(o.at).filter(([r]) => !list || list.includes(r)).sort((a, b) => b[1] - a[1])[0];
    const home = homeRegion(o.c);
    o.reg = home === 'NA' ? ((most(['NAC', 'NAW']) || ['NAC'])[0]) : home || (most() || [null])[0];   // ни страны, ни региональных капов (мобильный ЛАН, Notion 25.10.26 скрин 11) — без региона, только во «All»
    o.f = o.c && fs.existsSync(path.join(__dirname, '..', 'flags', 'w20', String(o.c).toLowerCase() + '.png')) ? String(o.c).toLowerCase() : '';
  });
  const byMonth = new Map();
  RES.windows.forEach(w => {
    const m = w.begin.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, { paid: 0, p: new Map() });
    const M = byMonth.get(m);
    w.top.forEach(x => {
      if (!x.usd) return;
      x.ids.forEach(id => {
        const o = M.p.get(id) || { id, usd: 0, cups: 0, wins: 0 };
        o.usd += x.usd; o.cups++; if (x.rank === 1) o.wins++; M.paid += x.usd; M.p.set(id, o);
      });
    });
  });
  // Весь год одной строкой — для подвкладки «Prize money» (26.10, его «может подпункты сделать в компетитив»).
  const Y = { paid: 0, p: new Map() };
  byMonth.forEach(M => { Y.paid += M.paid; M.p.forEach((o, id) => { const y = Y.p.get(id) || { id, usd: 0, cups: 0, wins: 0 }; y.usd += o.usd; y.cups += o.cups; y.wins += o.wins; Y.p.set(id, y); }); });
  byMonth.set('2026', Y);
  byMonth.forEach((M, m) => {
    const all = [...M.p.values()].sort((a, b) => b.usd - a.usd);
    const keep = new Set(all.slice(0, 100).map(x => x.id));
    REGS.forEach(r => all.filter(x => who.get(x.id).reg === r).slice(0, 40).forEach(x => keep.add(x.id)));
    const isCis = x => CIS_C.includes(who.get(x.id).f);
    all.filter(isCis).slice(0, 100).forEach(x => keep.add(x.id));
    const byReg = {}; all.forEach(x => { const r = who.get(x.id).reg; if (r) byReg[r] = (byReg[r] || 0) + x.usd; if (isCis(x)) byReg.CIS = (byReg.CIS || 0) + x.usd; });
    EARN[m] = { paid: M.paid, reg: byReg, rows: all.filter(x => keep.has(x.id)).map(x => { const o = who.get(x.id); return [o.n, o.f, REGS.indexOf(o.reg), x.usd, x.cups, x.wins, x.id.slice(0, 12), o.v, isCis(x) ? 1 : 0]; }) };
  });
  // ---- Год игрока (26.10, его пункты 1 и 7: страница игрока и сравнение двух): 2000 лучших по году — деньги по
  // месяцам и все призовые капы; отдельным файлом comp-players.json, страница грузит его по клику.
  const Yp = byMonth.get('2026');
  const PL = [...Yp.p.values()].sort((a, b) => b.usd - a.usd).slice(0, 2000);
  const plIdx = new Map(PL.map(x => [x.id, { id: x.id.slice(0, 12), n: who.get(x.id).n, f: who.get(x.id).f, r: who.get(x.id).reg || '', v: who.get(x.id).v, t: x.usd, k: x.cups, w: x.wins, m: Array(12).fill(0), c: [] }]));
  const prettyW = w => w.pretty ? w.name : pretty(w.name);
  RES.windows.forEach(w => w.top.forEach(x => { if (!x.usd) return; x.ids.forEach(id => { const p = plIdx.get(id); if (!p) return;
    p.m[+w.begin.slice(5, 7) - 1] += x.usd; p.c.push([w.begin.slice(0, 10), prettyW(w), x.rank, x.usd, regOf(w)]); }); }));
  const slugBase = h => String(h).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  plIdx.forEach(p => { p.c.sort((a, b) => a[0] < b[0] ? 1 : -1); const sl = slugBase(p.n); if (sl && fs.existsSync(path.join(OUT, 'player', sl + '.html'))) p.page = '/player/' + sl; });
  fs.writeFileSync(path.join(OUT, 'comp-players.json'), JSON.stringify([...plIdx.values()]));

  // ---- Новости (пункт 6, 26.10): трансферы с Liquipedia (fetch-transfers.js) и заголовки из своих данных: кто выиграл
  // крупное за месяц, что большое впереди. Игрок трансфера ищется среди 2000 из «Prize money» по всем его никам
  // (целиком, потом без тега клана, только однозначно); «известный» — нашёлся там или у его ника карточка 85+.
  const nFull = new Map(), nTail = new Map();
  const put = (Mp, k, id) => { if (k) Mp.set(k, Mp.has(k) && Mp.get(k) !== id ? null : id); };
  plIdx.forEach((p, id) => (names.get(id) || new Map()).forEach((c, n) => { const f = foldN(n); put(nFull, f, id); put(nTail, tailOf(f), id); }));
  const plOf = n => { const f = foldN(n), id = nFull.has(f) ? nFull.get(f) : f.length >= 5 ? nTail.get(f) : null; return id ? plIdx.get(id) : null; };
  const TR = read('comp-transfers.json');
  const day = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const team = (t, r) => t ? esc(t) + (r ? ' <i>(' + esc(r) + ')</i>' : '') : '<i>No team</i>';
  const trRows = (TR && TR.rows || []).filter(t => Date.parse(t.d) > NOW - 45 * 86400e3).slice(0, 150).map(t => {
    let big = false;
    const ppl = t.who.map(([n, f]) => {
      const p = plOf(n), v = p ? p.v : rtOf(n);
      if (p || v >= 85) big = true;
      const fl = f || (p && p.f);
      return (fl ? flag(fl) : '') + (p ? `<a href="#" data-pid="${esc(p.id)}">${esc(n)}</a>` : '<b>' + esc(n) + '</b>') + (v ? '<span class="ovr' + (v >= 90 ? ' hi' : '') + '">' + v + '</span>' : '') +
        (p && p.t ? ' <span class="p1">' + money(p.t) + '</span>' : '');
    }).join('<span class="sep">, </span>');
    return `<li class="tr${big ? ' big' : ''}"><time datetime="${esc(t.d)}">${esc(day(t.d))}</time><div class="trw">${ppl}</div>` +
      `<div class="trt">${team(t.from, t.r1)} <span class="arr">→</span> ${team(t.to, t.r2)}</div>` + (t.ref ? `<a class="src" href="${esc(t.ref)}" rel="noopener nofollow" target="_blank">Source</a>` : '') + '</li>';
  });
  // Заголовки: победы месяца (финалы FNCS, ЛАНы, сторонние турниры) и крупное впереди (3 недели).
  const heads = RES.windows.filter(w => Date.parse(w.begin) > NOW - 30 * 86400e3).map(w => ({ w, x: w.top.find(t => t.rank === 1) }))
    .filter(o => o.x && o.x.usd && (regOf(o.w) === 'LAN' || (kind(o.w.w) === 'fncs' && o.x.usd >= 1000) || o.x.usd >= 5000))
    .sort((a, b) => a.w.begin < b.w.begin ? 1 : -1).slice(0, 12)
    .map(o => `<li><time datetime="${esc(o.w.begin)}">${esc(day(o.w.begin.slice(0, 10)))}</time><div>${o.x.ids.map((id, i) => flag(who.get(id).f) + (plIdx.has(id) ? `<a href="#" data-pid="${esc(plIdx.get(id).id)}">${esc(who.get(id).n)}</a>` : '<b>' + esc(who.get(id).n) + '</b>')).join(' + ')}` +
      ` won <b>${esc(prettyW(o.w))}</b>${/^LQ_/.test(o.w.w) || regOf(o.w) === 'LAN' ? '' : ' (' + esc(regOf(o.w)) + ')'} <span class="p1">${money(o.x.usd)}${o.x.ids.length > 1 ? ' each' : ''}</span></div></li>`);
  const POOL = new Map(((read('comp-lan-list.json') || [])).map(l => [l.name, l.usd]));
  const seenS = new Set();
  const ahead = upcoming.filter(e => Date.parse(e.begin) > NOW && Date.parse(e.begin) < NOW + 21 * 86400e3)
    .map(e => ({ e, nm: e.pretty ? e.name : pretty(e.name) })).filter(o => rankOf(o.e, o.nm) >= 70)
    .filter(o => { const k = series(o.nm).replace(/ · (EU|NAC|NAW|BR|ASIA|ME|OCE)\b.*$/, '').replace(/ · .*$/, ''); if (seenS.has(k)) return false; seenS.add(k); o.k = k; return true; })
    .slice(0, 8).map(o => { const pool = POOL.get(o.e.name.split(' · ')[0]);
      return `<li><time datetime="${esc(o.e.begin)}">${esc(day(o.e.begin.slice(0, 10)))}</time><div><b>${esc(o.k)}</b>${pool ? ' <span class="p1">' + money(pool) + ' prize pool</span>' : ''}</div></li>`; });
  NEWS = { tr: trRows, heads, ahead, big: trRows.filter(r => r.startsWith('<li class="tr big')).length };

  // ---- Рекорды года (пункт 3)
  let bigPay = null, bestMonth = null;
  RES.windows.forEach(w => w.top.forEach(x => { if (x.usd && (!bigPay || x.usd > bigPay.usd)) bigPay = { usd: x.usd, n: x.ids.map(id => who.get(id).n).join(' + '), ev: prettyW(w), d: w.begin.slice(0, 10) }; }));
  byMonth.forEach((M, m) => { if (m === '2026') return; M.p.forEach((o, id) => { if (!bestMonth || o.usd > bestMonth.usd) bestMonth = { usd: o.usd, n: who.get(id).n, m }; }); });
  const all = [...Yp.p.values()];
  const mostWins = all.slice().sort((a, b) => b.wins - a.wins || b.usd - a.usd)[0];
  const mostCups = all.slice().sort((a, b) => b.cups - a.cups || b.usd - a.usd)[0];
  const pairs = new Map();
  RES.windows.forEach(w => w.top.forEach(x => { if (!x.usd || x.ids.length !== 2) return; const k = x.ids.slice().sort().join('|'); pairs.set(k, (pairs.get(k) || 0) + x.usd * 2); }));
  const bestPair = [...pairs.entries()].sort((a, b) => b[1] - a[1])[0];
  const RECORDS = [
    bigPay && ['Biggest single payout', bigPay.n, money(bigPay.usd) + ' each · ' + bigPay.ev],
    mostWins && ['Most cup wins', who.get(mostWins.id).n, mostWins.wins + ' wins · ' + money(mostWins.usd)],
    mostCups && ['Most paid cups', who.get(mostCups.id).n, mostCups.cups + ' cups in the money'],
    bestPair && ['Best duo', bestPair[0].split('|').map(id => who.get(id).n).join(' + '), money(bestPair[1]) + ' together'],
    bestMonth && ['Best month', bestMonth.n, money(bestMonth.usd) + ' in ' + new Date(bestMonth.m + '-01T00:00:00Z').toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })],
  ].filter(Boolean);

  // ---- Страны (пункт 4): по месяцам и за год
  byMonth.forEach((M, m) => { const C = {}; M.p.forEach((o, id) => { const c = who.get(id).f; if (!c) return; const e = C[c] || (C[c] = [c, 0, 0]); e[1] += o.usd; e[2]++; });
    EARN[m].cc = Object.values(C).sort((a, b) => b[1] - a[1]).slice(0, 40); });

  // ---- Неделя (пункт 10): последние 7 дней от сборки
  const wk = RES.windows.filter(w => Date.parse(w.begin) > NOW - 7 * 86400e3);
  const wkP = new Map(); let wkPaid = 0;
  wk.forEach(w => w.top.forEach(x => { if (!x.usd) return; x.ids.forEach(id => { wkP.set(id, (wkP.get(id) || 0) + x.usd); wkPaid += x.usd; }); }));
  const wkTop = [...wkP.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const wkBig = wk.map(w => ({ w, x: w.top.find(t => t.rank === 1) })).filter(o => o.x && o.x.usd).sort((a, b) => b.x.usd - a.x.usd).slice(0, 4);
  WEEK = wk.length ? { paid: wkPaid, top: wkTop.map(([id, v]) => [who.get(id).n, who.get(id).f, v]), wins: wkBig.map(o => [o.x.ids.map(id => who.get(id).n).join(' + '), prettyW(o.w), o.x.usd, regOf(o.w)]) } : null;
  RECS = RECORDS;

  const latest = RES.windows.slice().sort((a, b) => a.begin > b.begin ? -1 : 1).slice(0, 60);
  resHTML = latest.map(w => {
    const t3 = w.top.slice(0, 3);
    return `<article class="glass res" data-reg="${esc(regOf(w))}"><header><i>${/^LQ_/.test(w.w) ? 'Non-Epic' : esc(regOf(w))}</i><time datetime="${esc(w.begin)}">${esc(w.begin.slice(0, 10))}</time></header>` +
      `<h4>${esc(w.pretty ? w.name : pretty(w.name))}</h4><ol>` + t3.map(x => `<li><div>${x.ids.map((id, i) => flag(x.c[i]) + esc(x.n[i] || x.epic[i] || '?')).join(' + ')}</div>` +
      `<span>${x.pts} pts${x.usd ? ' · ' + money(x.usd) : ''}</span></li>`).join('') + '</ol></article>';
  }).join('');
}

// ---- Шапка как у главной (26.10, его «сделай дизайн компетитив как главный экран»): логотип, пилюли навбара.
const NAV = `<header class="top"><a class="logo" href="/"><img src="/logo.png" alt="" width="40" height="40"><b><i>FNCS</i> DRAFT</b></a>
<nav class="site-nav" aria-label="site"><a class="nav-pill" href="/">Career</a><a class="nav-pill on" href="/competitive" aria-current="page">Competitive</a></nav></header>`;

// Синее стекло главной: фон #0b1640 с подсветкой, панели-градиенты с лучами, Fira Sans Extra Condensed в заголовках,
// пилюли навбара, жёлтая кнопка со «ступенькой», заголовки разделов — разделитель меню Fortnite (линии по бокам).
const CSS = `@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:700;font-display:swap;src:url(/fonts/fira-xc-700-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:900;font-display:swap;src:url(/fonts/fira-xc-900-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--ink:#eaf0ff;--dim:#b7c3e6;--dimmer:#8fa0cc;--cyan:#9fe1ff;--lime:#d7ff3a;--hot:#ff4d5e;
  --line:rgba(180,200,255,.2);--row:rgba(126,150,224,.18);--row-h:rgba(150,180,255,.3);--r:16px;--r-sm:10px;
  --font-display:'Fira Sans Extra Condensed','Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:#0b1640}
body{margin:0;color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0b1640;
  background-image:radial-gradient(900px 520px at 12% -6%,rgba(60,100,220,.5),rgba(60,100,220,0)),radial-gradient(700px 480px at 92% 8%,rgba(150,180,255,.3),rgba(150,180,255,0)),
  radial-gradient(1100px 700px at 50% 110%,rgba(30,50,140,.6),rgba(30,50,140,0));background-attachment:fixed;min-height:100vh}
a{color:var(--cyan)}
.wrap{max-width:1320px;margin:0 auto;padding:18px 20px 80px}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:2px solid rgba(180,200,255,.15);padding-bottom:14px;margin-bottom:22px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff}
.logo b{font:italic 900 30px/1 var(--font-display);letter-spacing:-.01em;text-transform:uppercase}
.logo i{font-style:inherit;background:linear-gradient(180deg,#e9fbff 0%,#9fe1ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:.12em;margin-right:-.12em}
.site-nav{display:flex;gap:4px}
.nav-pill{font:600 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#e6ecff;text-decoration:none;padding:8px 16px;border-radius:999px;white-space:nowrap}
.nav-pill:hover{background:rgba(255,255,255,.12);outline:3px solid rgba(255,255,255,.92)}
.nav-pill.on{background:#e4ebf7;color:#0b1a3a}
h1,h2,h3,h4{font-family:var(--font-display);font-weight:700;margin:0;line-height:1.08}
.glass{position:relative;overflow:hidden;border-radius:var(--r);background:linear-gradient(160deg,#1d3b8c 0%,#13265f 46%,#0b1640 100%);box-shadow:inset 0 0 0 1px rgba(180,200,255,.18)}
.glass>*{position:relative}
.head{padding:26px 28px}
.head h1{font-size:clamp(38px,6vw,64px);font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.01em}
.head p{color:#c9d5f0;margin:8px 0 0;max-width:640px}
.hero{margin-top:16px;padding:24px 28px 26px}
.tag{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0b1a3a;background:var(--lime);padding:3px 9px;border-radius:999px}
.hero h2{font-size:clamp(30px,5vw,48px);font-style:italic;font-weight:900;text-transform:uppercase;margin:10px 0 4px}
.hero .sub{color:#c9d5f0;margin:0 0 16px}
.when{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.when li{background:var(--row);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.when b{font:700 20px var(--font-display);letter-spacing:.04em}
.when time{font-size:13px;color:#fff}
.when span{font-size:12px;color:var(--dim)}
.when li.live{box-shadow:inset 0 0 0 2px var(--hot)}
.btn{display:inline-block;font:700 18px/1 var(--font-display);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;border-radius:10px;padding:13px 28px 12px;margin-top:18px;
  background:var(--go);color:var(--go-ink);box-shadow:0 4px 0 #b59c00,0 8px 18px rgba(0,0,0,.35)}
.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}
.btn:active{transform:translateY(2px);box-shadow:0 2px 0 #b59c00,0 4px 10px rgba(0,0,0,.35)}
.sec{display:flex;align-items:center;gap:12px;font:700 20px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#fff;margin:34px 0 14px}
.sec::before,.sec::after{content:'';flex:1;height:2px;background:rgba(255,255,255,.35)}
.sec::before{flex:0 0 24px}
.sec small{font:400 13px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:0;text-transform:none;color:var(--dim);order:3}
.regs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.regs button{font:700 15px var(--font-display);letter-spacing:.05em;color:#fff;background:rgba(150,180,255,.18);border:none;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:38px}
.regs button:hover{background:rgba(150,180,255,.32)}
.regs button[aria-pressed="true"]{background:#e4ebf7;color:#0b1a3a}
.grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr);gap:18px;align-items:start}
@media(max-width:1100px){.grid{grid-template-columns:1fr}}
#earn{table-layout:fixed}#earn th:nth-child(1){width:34px}#earn th:nth-child(3){width:52px}#earn th:nth-child(4){width:46px}#earn th:nth-child(5){width:86px}
#earn td.pl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grid #earn{font-size:13px}.grid #earn td{padding:7px 8px}

.panel{padding:16px 18px 18px}
.panel>h3{font:700 18px var(--font-display);letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px}
.panel>p.small{color:var(--dim);font-size:13px;margin:0 0 10px}
.day h4{font:700 14px var(--font-display);letter-spacing:.1em;text-transform:uppercase;color:var(--cyan);margin:14px 0 6px}
.day:first-child h4{margin-top:4px}
.day ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.ev{display:grid;grid-template-columns:auto 38px 1fr auto;gap:10px;align-items:center;background:var(--row);border-radius:12px;padding:9px 12px;font-size:14px;border-left:4px solid transparent}
.ev:hover{background:var(--row-h)}
.ev time{font:700 16px var(--font-display);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:46px;color:#fff}
.ev i,.res i{font:700 12px var(--font-display);font-style:normal;letter-spacing:.06em;color:var(--dim)}
.ev em{font-style:normal;font:700 11px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#0b1a3a;background:rgba(228,235,247,.85);border-radius:999px;padding:2px 8px;white-space:nowrap}
.ev.k-fncs{border-left-color:var(--go)}.ev.k-fncs span{font-weight:700;color:#fff}.ev.k-fncs em{background:var(--go)}
.ev.k-cash{border-left-color:var(--lime)}.ev.k-cash em{background:var(--lime)}
.ev.k-ranked{border-left-color:var(--cyan)}.ev.k-ranked em{background:var(--cyan)}
.ev.live{box-shadow:inset 0 0 0 2px var(--hot)}
.ev.live em{background:var(--hot);color:#fff}.ev.live em::before{content:'LIVE · '}
.tbl{width:100%;border-collapse:separate;border-spacing:0 4px;font-size:14px}
.tbl th{text-align:left;font:700 12px var(--font-display);text-transform:uppercase;letter-spacing:.08em;color:var(--dimmer);padding:2px 10px}
.tbl td{padding:8px 10px;background:var(--row)}
.tbl td:first-child{border-radius:10px 0 0 10px}.tbl td:last-child{border-radius:0 10px 10px 0}
.tbl tr:hover td{background:var(--row-h)}
.tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td img,.res img{vertical-align:-2px;margin-right:6px}
.tbl tbody tr:nth-child(-n+3):not(.hide) td:first-child{color:var(--go);font-weight:900}
.p1{color:var(--go);font:700 16px var(--font-display);letter-spacing:.02em}
.tbl tr.more,.tbl tr.hide{display:none}
.tbl.all tr.more:not(.hide){display:table-row}
.morebtn{margin-top:8px;font:700 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#fff;background:rgba(150,180,255,.22);border:none;border-radius:10px;padding:10px 18px;cursor:pointer}
.morebtn:hover{background:rgba(150,180,255,.36)}
.results{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.res{padding:14px 16px}
.res header{display:flex;justify-content:space-between;font-size:12px;color:var(--dim)}
.res h4{font-size:19px;margin:6px 0 8px;text-transform:uppercase;letter-spacing:.02em}
.res ol{margin:0;padding:0;list-style:none;font-size:14px;counter-reset:p}
.res li{counter-increment:p;display:grid;grid-template-columns:22px 1fr;column-gap:4px;padding:5px 0;border-top:1px solid rgba(180,200,255,.12)}
.res li::before{content:counter(p);font:900 16px var(--font-display);color:var(--dim);grid-row:span 2}
.res li:first-child::before{color:var(--go)}
.res li span{color:var(--dim);font-size:12px}
.note{color:var(--dimmer);font-size:13px;margin:12px 0 0}
.foot{margin-top:34px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media(max-width:620px){.wrap{padding:14px 14px 64px}.head,.hero{padding:20px 18px}.logo b{font-size:24px}.nav-pill{padding:7px 12px;font-size:14px}
  .ev{grid-template-columns:auto 34px 1fr;row-gap:2px}.ev em{grid-column:3;justify-self:start}}
.cal-bar{display:flex;align-items:center;gap:8px;margin:6px 0 10px}
.cal-bar h4{font:italic 900 24px var(--font-display);text-transform:uppercase;margin:0 4px;min-width:0}
.cal-nav{width:38px;height:36px;border:none;border-radius:10px;background:#fff;color:#0b0f12;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.cal-nav svg{width:16px;height:16px;fill:currentColor}
.cal-nav:hover{background:var(--go)}
.cal-nav:disabled{background:rgba(255,255,255,.14);color:var(--dimmer);cursor:default}
.cal-today{margin-left:auto;border:none;border-radius:10px;background:#fff;color:#0b0f12;font:700 14px var(--font-display);letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer}
.cal-today:hover{background:var(--go)}
.cal-dow,.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.cal-dow span{font:700 11px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#8094c4;text-align:center;padding:2px 0 4px}
.cal-day{position:relative;aspect-ratio:4/3;min-width:0;border:none;border-radius:8px;background:rgba(255,255,255,.045);padding:5px;display:flex;flex-direction:column;gap:3px;overflow:hidden;
  text-align:left;color:inherit;font:inherit;cursor:pointer;background-size:cover;background-position:center}
.cal-void{background:none;cursor:default}
.cal-day.has{background-color:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(150,185,255,.22)}
.cal-day.art{justify-content:flex-end}
.cal-day.art::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,32,.15) 0%,rgba(8,12,32,.35) 45%,rgba(8,12,32,.9) 100%)}
.cal-day.art .cal-n{position:absolute;top:6px;left:7px}
.cal-day.r100{box-shadow:inset 0 0 0 2px var(--go)}
.cal-top{display:block;font:700 12px/1.2 var(--font-display);letter-spacing:.02em;padding:3px 6px;border-radius:4px;color:#0b1a3a;background:rgba(228,235,247,.92);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-top.k-fncs{background:var(--go)}.cal-top.k-cash{background:var(--lime)}.cal-top.k-ranked{background:var(--cyan)}
.cal-day>*{position:relative}
.cal-day:not(.cal-void):hover{box-shadow:inset 0 0 0 2px var(--cyan)}
.cal-day.now{box-shadow:inset 0 0 0 2px #35e0ff;background-color:rgba(53,224,255,.13)}
.cal-day.picked{box-shadow:inset 0 0 0 2px var(--go)}
.cal-day.past{opacity:.55}
.cal-day.live .cal-n::after{content:' LIVE';color:var(--hot);font-size:9px;letter-spacing:.06em}
.cal-n{font:900 13px/1 var(--font-display);color:#6d7fae}
.cal-day.has .cal-n,.cal-day.art .cal-n{color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.cal-ev{display:block;font:700 12px/1.25 var(--font-display);letter-spacing:.02em;padding:2px 4px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#0b1a3a;background:rgba(228,235,247,.9)}
.cal-ev.k-fncs{background:var(--go)}.cal-ev.k-cash{background:var(--lime)}.cal-ev.k-ranked{background:var(--cyan)}
.cal-more{font:700 11px var(--font-display);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);letter-spacing:.03em}
.calday{margin-top:14px}
.calday h4{font:700 15px var(--font-display);letter-spacing:.1em;text-transform:uppercase;color:var(--cyan);margin:0 0 8px}
.calday ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.ev.done{opacity:.5}
@media(max-width:620px){#earn th:nth-child(4),#earn td:nth-child(4){display:none}.tbl td{padding:8px 7px}.cal-day{padding:3px;aspect-ratio:auto;min-height:46px}.cal-top{font-size:0;height:5px;padding:0;border-radius:2px}.cal-more{display:none}.cal-bar h4{font-size:19px}}
.subnav{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0 12px;padding:5px;border-radius:14px;background:rgba(150,180,255,.12);box-shadow:inset 0 0 0 1px rgba(180,200,255,.18)}
.subnav button{flex:1 1 auto;font:700 16px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#e6ecff;background:none;border:none;border-radius:10px;padding:11px 16px;cursor:pointer;min-height:44px}
.subnav button:hover{background:rgba(255,255,255,.1)}
.subnav button[aria-selected="true"]{background:var(--go);color:var(--go-ink);box-shadow:0 3px 0 #b59c00}
.periods{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}
.periods button{font:700 14px var(--font-display);letter-spacing:.05em;color:#fff;background:rgba(150,180,255,.18);border:none;border-radius:999px;padding:7px 14px;cursor:pointer}
.periods button[aria-pressed="true"]{background:#e4ebf7;color:#0b1a3a}
#big{table-layout:fixed}#big th:nth-child(1){width:40px}#big th:nth-child(3){width:70px}#big th:nth-child(4){width:84px}#big th:nth-child(5){width:60px}#big th:nth-child(6){width:100px}
.predcard{display:block;padding:20px 24px;margin-top:16px;text-decoration:none;color:var(--ink)}
.predcard b{display:block;font:italic 900 30px var(--font-display);text-transform:uppercase;margin:8px 0 4px}
.predcard span:last-child{color:#c9d5f0}
.predcard:hover{box-shadow:inset 0 0 0 2px var(--go)}
@media(max-width:620px){.subnav{flex-wrap:nowrap;overflow-x:auto;gap:2px;scrollbar-width:none}.subnav button{font-size:13px;letter-spacing:.03em;padding:9px 7px;flex:0 0 auto}#big th:nth-child(3),#big td:nth-child(3),#big th:nth-child(5),#big td:nth-child(5){display:none}}
.tabp>.panel+.panel{margin-top:16px}
[data-pid]{cursor:pointer;text-decoration:underline;text-decoration-color:rgba(159,225,255,.35);text-underline-offset:3px}
[data-pid]:hover{color:var(--go)}
.bigtools{margin:-4px 0 10px}
.recs{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.rec{background:var(--row);border-radius:12px;padding:12px 14px}
.rec i{display:block;font:700 12px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);font-style:normal}
.rec b{display:block;font:700 20px var(--font-display);margin:4px 0 2px}
.rec span{font-size:13px;color:var(--dim)}
#cc td img,#cc td b{vertical-align:middle}#cc img{margin-right:8px}
.week .wkgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.week i{display:block;font:700 12px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);font-style:normal;margin-bottom:4px}
.week p{margin:4px 0;font-size:14px}.week img{vertical-align:-2px;margin-right:6px}
.week{margin-bottom:16px}
.modal{position:fixed;inset:0;z-index:50;background:rgba(5,10,30,.72);display:flex;align-items:flex-start;justify-content:center;padding:40px 14px;overflow:auto}
.mbox{width:min(760px,100%);padding:22px 22px 24px;position:relative}
.mx{position:absolute;top:10px;right:12px;width:36px;height:36px;border:none;border-radius:10px;background:rgba(255,255,255,.12);color:#fff;font-size:22px;cursor:pointer}
.ph{display:flex;align-items:center;gap:10px;margin-bottom:12px}.ph b{font:italic 900 30px var(--font-display);text-transform:uppercase}.ph i{font-style:normal;color:var(--dim);font:700 14px var(--font-display)}
.pstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.pstats div{background:var(--row);border-radius:10px;padding:8px 12px}.pstats i{display:block;font-style:normal;font-size:12px;color:var(--dim)}.pstats b{font:700 22px var(--font-display)}
.bars{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;height:120px;margin:6px 0 14px;align-items:end}
.bcol{display:flex;flex-direction:column;height:100%}.bstack{flex:1;display:flex;align-items:flex-end;gap:2px}
.bars .b{flex:1;min-height:2px;border-radius:3px 3px 0 0}.b0,.bars .b0{background:var(--go)}.b1,.bars .b1{background:var(--cyan)}
.bcol em{font-style:normal;font-size:10px;color:var(--dim);text-align:center;margin-top:3px}
.pact{display:flex;gap:8px;margin-bottom:12px}.pact a{text-decoration:none;display:inline-block}
.cmpin{display:flex;gap:8px;margin:10px 0}.cmpin .pk{flex:1;min-width:0}
.pk{position:relative}
.pk input{width:100%;box-sizing:border-box;padding:11px 14px 11px 38px;border-radius:999px;border:none;background:rgba(150,180,255,.16) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23b7c3e6' stroke-width='2.2'%3E%3Ccircle cx='7' cy='7' r='5'/%3E%3Cpath d='m11 11 4 4'/%3E%3C/svg%3E") no-repeat 14px 50%;color:#fff;font:600 16px var(--font-display);letter-spacing:.02em;outline:none;-webkit-appearance:none;appearance:none}
.pk input::placeholder{color:var(--dimmer)}.pk input:focus{box-shadow:inset 0 0 0 2px var(--go)}
.pk input::-webkit-search-cancel-button{-webkit-appearance:none}
.pkL{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 6px);list-style:none;margin:0;padding:6px;border-radius:14px;background:#14245c;box-shadow:0 14px 40px rgba(0,0,0,.5),inset 0 0 0 1px var(--line);max-height:360px;overflow:auto}
.pkL li{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;cursor:pointer;font-size:15px}
.pkL li.on,.pkL li:hover{background:var(--row-h)}
.pkL li b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.pkL li i{font:700 12px var(--font-display);letter-spacing:.05em;color:var(--dim);font-style:normal}
.pkL li em{font:700 14px var(--font-display);color:var(--go);font-style:normal;min-width:64px;text-align:right}
.pkL li img{border-radius:2px}.pkL .nf{display:inline-block;width:20px}
.pkL li.none{color:var(--dim);cursor:default}
.ovr{display:inline-block;min-width:28px;margin-left:8px;text-align:center;font:700 13px var(--font-display);border-radius:6px;padding:1px 5px;background:#e4ebf7;color:#0b1a3a;vertical-align:1px}
.ovr.hi{background:var(--go);color:var(--go-ink)}
.pkL li .ovr{margin-left:0}
.bigtools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.bigtools .pk{flex:1;min-width:220px;max-width:420px}
.tbl.cmp tbody td:first-child{color:var(--ink)!important;font-weight:600}
.pkL{overflow-x:hidden}.mbox .pkL{position:static;margin-top:6px;max-height:300px}
@media(max-width:600px){.cmpin{flex-direction:column}.bigtools .pk{max-width:none;flex-basis:100%}.pkL li i{display:none}.pkL li em{min-width:0}.tbl td.pl .ovr{margin-left:6px}}
.lg2{font-size:13px;color:var(--dim)}.lg2 span{display:inline-block;width:12px;height:12px;border-radius:3px;margin:0 6px -1px 12px}
@media(max-width:620px){.week .wkgrid{grid-template-columns:1fr}.pstats b{font-size:18px}}
.lvb{margin-left:8px;font:700 11px var(--font-display);letter-spacing:.06em;text-transform:uppercase;border:none;border-radius:999px;padding:3px 9px;background:var(--hot);color:#fff;cursor:pointer;vertical-align:1px}
.lvdot{color:var(--hot);font-family:var(--font-display);letter-spacing:.08em}
.rlp{margin-top:16px;padding:20px 24px}.rlp h2{margin:6px 0}.rlr{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.rlr button{font:700 14px var(--font-display);letter-spacing:.05em;color:#fff;background:rgba(150,180,255,.18);border:none;border-radius:999px;padding:7px 14px;cursor:pointer}
.rlr button[aria-pressed="true"]{background:#e4ebf7;color:#0b1a3a}
#liveNow{margin-bottom:16px}#liveNow .lvregs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 0}#liveNow .lvb{font-size:13px;padding:8px 14px;margin:0}
.news{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.nl{list-style:none;margin:0;padding:0}
.nl li{display:grid;grid-template-columns:58px 1fr;gap:10px;padding:8px 0;border-top:1px solid rgba(180,200,255,.12);font-size:14px;align-items:baseline}
.nl li:first-child{border-top:none}
.nl time,.tr time{font:700 13px var(--font-display);letter-spacing:.04em;color:var(--dim);text-transform:uppercase}
.nl a,.tr a[data-pid]{color:#fff;font-weight:700;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.3)}
.nl img,.tr img{vertical-align:-2px;margin-right:5px}
.trs{list-style:none;margin:0;padding:0}
.tr{display:grid;grid-template-columns:58px 1fr auto;column-gap:10px;row-gap:2px;padding:10px 0;border-top:1px solid rgba(180,200,255,.12);font-size:14px}
.tr time{grid-row:span 2}.tr .trw{font-size:15px}.tr .trt{grid-column:2;color:var(--dim)}.tr .trt i{font-style:normal;color:var(--dimmer)}
.tr .src{grid-row:1/3;grid-column:3;align-self:center;font:700 12px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:var(--cyan);text-decoration:none}
.tr .arr{color:var(--go);margin:0 4px}.tr .ovr{margin-left:6px}.tr .sep{color:var(--dim)}
.trs.only .tr:not(.big){display:none}
.trtools{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:14px;color:var(--dim)}.trtools input{accent-color:var(--go);width:18px;height:18px}
@media(max-width:700px){.news{grid-template-columns:1fr}.tr{grid-template-columns:50px 1fr}.tr .src{grid-row:auto;grid-column:2;justify-self:start}}
[hidden]{display:none!important}`;

const JS = `(function(){
var tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'');
var guess=/^Europe|^Africa/.test(tz)?'EU':/Sao_Paulo|Argentina|Santiago|Montevideo|Bogota|Lima|America\\/(Recife|Fortaleza|Bahia|Belem|Manaus)/.test(tz)?'BR':
 /Los_Angeles|Vancouver|Phoenix|Denver|Tijuana/.test(tz)?'NAW':/^America/.test(tz)?'NAC':/Australia|Auckland|Pacific/.test(tz)?'OCE':
 /Dubai|Riyadh|Qatar|Kuwait|Bahrain|Baghdad|Tehran|Muscat|Amman|Beirut|Jerusalem/.test(tz)?'ME':/^Asia/.test(tz)?'ASIA':'EU';
var saved=null; try{saved=localStorage.getItem('compReg');}catch(e){}
var reg=/^(ALL|EU|CIS|NAC|NAW|BR|ASIA|ME|OCE)$/.test(saved||'')?saved:guess;
var CISC=${JSON.stringify(CIS_C)};
function sreg(){return reg==='CIS'?'EU':reg;}
function inReg(r){return reg==='ALL'||(reg==='CIS'?r[8]===1:R[r[2]]===reg);}
var fmtT=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}), fmtD=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'long'});
var fmtDT=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
var now=Date.now();
document.querySelectorAll('.when li').forEach(function(li){var t=Date.parse(li.dataset.t); li.querySelector('time').textContent=fmtDT.format(t);
 if(t<=now && now<t+3*3600e3) li.classList.add('live');});
var D=${JSON.stringify(CALDATA)},S=${JSON.stringify(STR)},R=${JSON.stringify(REGS)},K=${JSON.stringify(KINDS)},KL=${JSON.stringify(KINDS.map(k => KIND[k]))},ART=${JSON.stringify(ART)};
var DOW=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var fmtM=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'});
function dk(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
var today=new Date(), cur={y:today.getFullYear(),m:today.getMonth()}, pick=dk(today);
var first=D.length?new Date(D[0][0]*60000):today, last=D.length?new Date(D[D.length-1][0]*60000):today;
function byDay(){var m={}; D.forEach(function(e){ if(reg!=='ALL'&&e[2]>=0&&R[e[2]]!==sreg()) return; var k=dk(new Date(e[0]*60000)); (m[k]=m[k]||[]).push(e);}); return m;}
function esc(x){return String(x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function renderCal(){
 var by=byDay(), y=cur.y, m=cur.m, days=new Date(y,m+1,0).getDate(), lead=(new Date(y,m,1).getDay()+6)%7;
 var atStart=y*12+m<=first.getFullYear()*12+first.getMonth(), atEnd=y*12+m>=last.getFullYear()*12+last.getMonth();
 var h='<div class="cal-bar"><button class="cal-nav" data-d="-1" aria-label="Previous month"'+(atStart?' disabled':'')+'><svg viewBox="0 0 16 16"><path d="M10.5 2.5L5 8l5.5 5.5 1.5-1.5-4-4 4-4z"/></svg></button>'+
  '<h4>'+esc(fmtM.format(new Date(y,m,1)))+'</h4><button class="cal-nav" data-d="1" aria-label="Next month"'+(atEnd?' disabled':'')+'><svg viewBox="0 0 16 16"><path d="M5.5 2.5L11 8l-5.5 5.5L4 12l4-4-4-4z"/></svg></button>'+
  '<button class="cal-today">Today</button></div><div class="cal-dow">'+DOW.map(function(d){return '<span>'+d+'</span>';}).join('')+'</div><div class="cal-grid">';
 for(var i=0;i<lead;i++) h+='<div class="cal-day cal-void"></div>';
 for(var d=1;d<=days;d++){
  var k=y+'-'+(m+1)+'-'+d, list=by[k]||[], seen={}, chips=[], fncs=false;
  list.forEach(function(e){ if(seen[e[4]]) return; seen[e[4]]=1; chips.push(e); });
  chips.sort(function(a,b){return b[7]-a[7];});
  var top=chips[0], img=top?S[top[6]]:'';
  var past=new Date(y,m,d+1)<today, live=list.some(function(e){return e[0]*60000<=now&&now<e[1]*60000;});
  h+='<button class="cal-day'+(list.length?' has':'')+(img?' art':'')+(top?' r'+top[7]:'')+(k===dk(today)?' now':'')+(k===pick?' picked':'')+(past?' past':'')+(live?' live':'')+'" data-k="'+k+'"'+
   (img?' style="background-image:url('+img+')"':'')+'><span class="cal-n">'+d+'</span>'+
   (top?'<span class="cal-top k-'+K[top[3]]+'">'+esc(S[top[4]])+'</span>':'')+
   (chips.length>1?'<span class="cal-more">+'+(chips.length-1)+' more</span>':'')+'</button>';
 }
 h+='</div>';
 var el=document.getElementById('cal'); el.innerHTML=h;
 el.querySelectorAll('.cal-nav').forEach(function(b){b.onclick=function(){var t=new Date(cur.y,cur.m+(+b.dataset.d),1); cur={y:t.getFullYear(),m:t.getMonth()}; var bd=byDay(), n=new Date(cur.y,cur.m+1,0).getDate(); pick=cur.y+'-'+(cur.m+1)+'-1'; for(var d=1;d<=n;d++){ if(bd[cur.y+'-'+(cur.m+1)+'-'+d]){ pick=cur.y+'-'+(cur.m+1)+'-'+d; break; } } if(cur.y===today.getFullYear()&&cur.m===today.getMonth()) pick=dk(today); renderCal();};});
 el.querySelector('.cal-today').onclick=function(){cur={y:today.getFullYear(),m:today.getMonth()}; pick=dk(today); renderCal();};
 el.querySelectorAll('.cal-day:not(.cal-void)').forEach(function(b){b.onclick=function(){pick=b.dataset.k; renderCal();};});
 renderDay(by); renderEarn();
}
var EARN=${JSON.stringify(EARN)}, earnAll=false;
function money(v){return '$'+Math.round(v).toLocaleString('en-US');}
function renderEarn(){
 var mk=cur.y+'-'+String(cur.m+1).padStart(2,'0'), M=EARN[mk], name=fmtM.format(new Date(cur.y,cur.m,1));
 document.getElementById('earnH').textContent='Prize money · '+name;
 var rows=M?M.rows.filter(inReg):[];
 var paid=M?(reg==='ALL'?M.paid:(M.reg[reg]||0)):0;
 document.getElementById('earnP').textContent=(paid?money(paid)+(reg==='ALL'?' paid in cash cups and FNCS':' to '+reg+' players')+(mk===today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')?' so far':'')+'. ':'')+'Duos: each player gets the payout.';
 var show=earnAll?rows.slice(0,100):rows.slice(0,15);
 document.getElementById('earnT').innerHTML=rows.length?'<table class="tbl" id="earn"><thead><tr><th>#</th><th>Player</th><th class="n">Cups</th><th class="n">Wins</th><th class="n">Earned</th></tr></thead><tbody>'+
  show.map(function(r,i){return '<tr><td class="n">'+(i+1)+'</td><td class="pl">'+(r[1]?'<img src="/flags/w20/'+r[1]+'.png" alt="" width="16">':'')+'<b data-pid="'+r[6]+'">'+esc(r[0])+'</b>'+ovr(r[7])+'</td><td class="n">'+r[4]+'</td><td class="n">'+(r[5]||'')+'</td><td class="n p1">'+money(r[3])+'</td></tr>';}).join('')+
  '</tbody></table>'+(rows.length>15&&!earnAll?'<button class="morebtn" type="button">Show more</button>':''):'<p class="note">No prize money '+(new Date(cur.y,cur.m,1)>today?'yet':'recorded')+' for '+name+(reg==='ALL'?'':' in '+reg)+'.</p>';
 var mb=document.querySelector('#earnT .morebtn'); if(mb) mb.onclick=function(){earnAll=true; renderEarn();};
}
function renderDay(by){
 var p=pick.split('-'), list=(by[pick]||[]).slice().sort(function(a,b){return a[0]-b[0];}), el=document.getElementById('calDay');
 el.innerHTML='<h4>'+esc(fmtD.format(new Date(+p[0],p[1]-1,+p[2])))+'</h4>'+(list.length?'<ul>'+list.map(function(e){
  var t=e[0]*60000, end=e[1]*60000, cls='ev k-'+K[e[3]]+(t<=now&&now<end?' live':'')+(end<now?' done':'');
  var lv=e[8]>=0&&t<=now&&now<end+12*3600e3?'<button type="button" class="lvb" data-ev="'+S[e[8]]+'" data-w="'+S[e[9]]+'" data-t="'+esc(S[e[5]])+'" data-end="'+end+'">'+(now<end?'Live':'Standings')+'</button>':'';
  return '<li class="'+cls+'"><time>'+fmtT.format(t)+'</time><i>'+(e[2]>=0?R[e[2]]:'LAN')+'</i><span>'+esc(S[e[5]])+lv+'</span><em>'+KL[e[3]]+'</em></li>';
 }).join('')+'</ul>':'<p class="note">No cups on this day'+(reg==='ALL'?'':' in '+reg)+'.</p>');
}
var bigKey='2026', bigAll=false;
function renderBig(){
 var keys=Object.keys(EARN).filter(function(k){return k!=='2026';}).sort();
 document.getElementById('periods').innerHTML=['2026'].concat(keys).map(function(k){var lbl=k==='2026'?'Year 2026':new Intl.DateTimeFormat(undefined,{month:'short'}).format(new Date(+k.slice(0,4),+k.slice(5)-1,1));
  return '<button type="button" data-k="'+k+'" aria-pressed="'+(k===bigKey)+'">'+lbl+'</button>';}).join('');
 document.querySelectorAll('#periods button').forEach(function(b){b.onclick=function(){bigKey=b.dataset.k; bigAll=false; renderBig();};});
 var M=EARN[bigKey], name=bigKey==='2026'?'2026':fmtM.format(new Date(+bigKey.slice(0,4),+bigKey.slice(5)-1,1));
 var rows=M?M.rows.filter(inReg):[];
 var paid=M?(reg==='ALL'?M.paid:(M.reg[reg]||0)):0;
 document.getElementById('bigH').textContent='Prize money · '+name+(reg==='ALL'?'':' · '+reg);
 document.getElementById('bigP').textContent=(paid?money(paid)+(reg==='ALL'?' paid in Epic cups, FNCS and LANs':' to '+reg+' players')+'. ':'')+'Duos and squads: each player gets the payout.';
 var show=bigAll?rows.slice(0,100):rows.slice(0,30);
 document.getElementById('bigT').innerHTML=rows.length?'<table class="tbl" id="big"><thead><tr><th>#</th><th>Player</th><th>Region</th><th class="n">Cups paid</th><th class="n">Wins</th><th class="n">Earned</th></tr></thead><tbody>'+
  show.map(function(r,i){return '<tr><td class="n">'+(i+1)+'</td><td class="pl">'+(r[1]?'<img src="/flags/w20/'+r[1]+'.png" alt="" width="16">':'')+'<b data-pid="'+r[6]+'">'+esc(r[0])+'</b>'+ovr(r[7])+'</td><td>'+(r[2]>=0?R[r[2]]:'')+'</td><td class="n">'+r[4]+'</td><td class="n">'+(r[5]||'')+'</td><td class="n p1">'+money(r[3])+'</td></tr>';}).join('')+
  '</tbody></table>'+(rows.length>30&&!bigAll?'<button class="morebtn" type="button">Show more</button>':''):'<p class="note">No prize money for '+name+(reg==='ALL'?'':' in '+reg)+'.</p>';
 var mb=document.querySelector('#bigT .morebtn'); if(mb) mb.onclick=function(){bigAll=true; renderBig();};
 var cc=(M&&M.cc||[]).filter(function(r){return reg!=='CIS'||CISC.indexOf(r[0])>=0;});
 document.getElementById('ccH').textContent='Prize money by country · '+name;
 document.getElementById('ccT').innerHTML=cc.length?'<table class="tbl" id="cc"><thead><tr><th>#</th><th>Country</th><th class="n">Players</th><th class="n">Earned</th></tr></thead><tbody>'+
  cc.slice(0,20).map(function(r,i){return '<tr><td class="n">'+(i+1)+'</td><td><img src="/flags/w20/'+r[0]+'.png" alt="" width="16"><b>'+(CN[r[0]]||r[0].toUpperCase())+'</b></td><td class="n">'+r[2]+'</td><td class="n p1">'+money(r[1])+'</td></tr>';}).join('')+'</tbody></table>':'<p class="note">No data.</p>';
}
var CN=(function(){try{var d=new Intl.DisplayNames(['en'],{type:'region'});return new Proxy({},{get:function(_,k){try{return d.of(String(k).toUpperCase());}catch(e){return null;}}});}catch(e){return {};}})();
var PLS=null;
function loadPL(cb){ if(PLS) return cb(PLS); fetch('/comp-players.json').then(function(r){return r.json();}).then(function(j){PLS=j; cb(j);}).catch(function(){cb([]);}); }
function byId(id){ return (PLS||[]).find(function(p){return p.id===id;}); }
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function bars(ps){ var mx=1; ps.forEach(function(p){p.m.forEach(function(v){if(v>mx)mx=v;});});
 return '<div class="bars">'+MON.map(function(mn,i){return '<div class="bcol"><div class="bstack">'+ps.map(function(p,k){return '<span class="b b'+k+'" style="height:'+Math.round(p.m[i]/mx*100)+'%" title="'+esc(p.n)+' '+mn+': '+money(p.m[i])+'"></span>';}).join('')+'</div><em>'+mn+'</em></div>';}).join('')+'</div>'; }
function ovr(v){ return v?'<span class="ovr'+(v>=90?' hi':'')+'">'+v+'</span>':''; }
function head(p){ return '<div class="ph">'+(p.f?'<img src="/flags/w40/'+p.f+'.png" alt="" width="28">':'')+'<b>'+esc(p.n)+'</b>'+ovr(p.v)+(p.r?'<i>'+p.r+'</i>':'')+'</div>'; }
function fold(x){ return String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function pickHTML(id,ph,p){ return '<div class="pk" id="'+id+'"><input type="search" autocomplete="off" spellcheck="false" placeholder="'+ph+'" value="'+(p?esc(p.n):'')+'"><ul class="pkL" hidden></ul></div>'; }
function pickWire(id,onPick){ var box=document.getElementById(id), inp=box.querySelector('input'), ul=box.querySelector('ul'), hits=[], on=0;
 function row(p,i){ return '<li data-i="'+i+'"'+(i===on?' class="on"':'')+'>'+(p.f?'<img src="/flags/w20/'+p.f+'.png" alt="" width="20">':'<span class="nf"></span>')+'<b>'+esc(p.n)+'</b>'+(p.r?'<i>'+p.r+'</i>':'')+ovr(p.v)+'<em>'+money(p.t)+'</em></li>'; }
 function show(){ ul.innerHTML=hits.length?hits.map(row).join(''):'<li class="none">No player with that name in the 2026 prize list</li>'; ul.hidden=false; }
 function find(){ loadPL(function(L){ var q=fold(inp.value.trim()); if(!q){ hits=L.slice(0,8); } else {
   var a=[],b=[]; L.forEach(function(p){ var n=fold(p.n), k=n.indexOf(q); if(k===0) a.push(p); else if(k>0) b.push(p); });
   hits=a.concat(b).slice(0,8); } on=0; show(); }); }
 function pick(i){ var p=hits[i]; if(!p) return; inp.value=p.n; ul.hidden=true; onPick(p); }
 inp.addEventListener('input',find); inp.addEventListener('focus',find);
 inp.addEventListener('keydown',function(e){ if(ul.hidden) return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); on=(on+(e.key==='ArrowDown'?1:hits.length-1))%Math.max(hits.length,1); show(); }
  else if(e.key==='Enter'){ e.preventDefault(); pick(on); } else if(e.key==='Escape'){ ul.hidden=true; } });
 ul.addEventListener('mousedown',function(e){ var li=e.target.closest('li[data-i]'); if(li){ e.preventDefault(); pick(+li.dataset.i); } });
 inp.addEventListener('blur',function(){ setTimeout(function(){ ul.hidden=true; },120); }); }
function openPlayer(id){ loadPL(function(){ var p=byId(id); if(!p) return; var el=document.getElementById('pmB');
 el.innerHTML=head(p)+'<div class="pstats"><div><i>Earned 2026</i><b class="p1">'+money(p.t)+'</b></div><div><i>Cups paid</i><b>'+p.k+'</b></div><div><i>Wins</i><b>'+p.w+'</b></div></div>'+bars([p])+
  '<div class="pact">'+(p.page?'<a class="morebtn" href="'+p.page+'">Player page</a>':'')+'<button type="button" class="morebtn" id="pmCmp">Compare</button></div>'+
  '<table class="tbl"><thead><tr><th>Date</th><th>Event</th><th class="n">Place</th><th class="n">Prize</th></tr></thead><tbody>'+p.c.slice(0,60).map(function(c){return '<tr><td>'+c[0].slice(5)+'</td><td class="pl">'+esc(c[1])+'</td><td class="n">'+c[2]+'</td><td class="n p1">'+money(c[3])+'</td></tr>';}).join('')+'</tbody></table>';
 document.getElementById('pmCmp').onclick=function(){ openCompare(p.id); };
 document.getElementById('pm').hidden=false; }); }
function openCompare(a,b){ loadPL(function(L){ var el=document.getElementById('pmB');
 var pa=a&&byId(a), pb=b&&byId(b);
 el.innerHTML='<h3>Compare two players</h3><div class="cmpin">'+pickHTML('cmpA','Player 1',pa)+pickHTML('cmpB','Player 2',pb)+'</div><div id="cmpOut"></div>';
 pickWire('cmpA',function(p){pa=p;draw();}); pickWire('cmpB',function(p){pb=p;draw();});
 function draw(){ var o=document.getElementById('cmpOut');
  if(!pa||!pb){o.innerHTML='<p class="note">Type a name and pick from the list (top 2000 by prize money in 2026).</p>';return;}
  var row=function(lbl,x,y,fmt){return '<tr><td>'+lbl+'</td><td class="n'+(x>y?' p1':'')+'">'+fmt(x)+'</td><td class="n'+(y>x?' p1':'')+'">'+fmt(y)+'</td></tr>';};
  var best=function(p){return p.c.reduce(function(m,c){return c[3]>m?c[3]:m;},0);};
  var fl=function(p){return p.f?'<img src="/flags/w20/'+p.f+'.png" alt="" width="16"> ':'';};
  o.innerHTML='<table class="tbl cmp"><thead><tr><th></th><th class="n">'+fl(pa)+esc(pa.n)+'</th><th class="n">'+fl(pb)+esc(pb.n)+'</th></tr></thead><tbody>'+
   (pa.v||pb.v?row('Avg card rating',pa.v||0,pb.v||0,function(v){return v?String(v):'·';}):'')+row('Earned 2026',pa.t,pb.t,money)+row('Cups paid',pa.k,pb.k,String)+row('Wins',pa.w,pb.w,String)+row('Biggest prize',best(pa),best(pb),money)+'</tbody></table>'+bars([pa,pb])+
   '<p class="lg2"><span class="b0"></span>'+esc(pa.n)+' <span class="b1"></span>'+esc(pb.n)+'</p>'; }
 draw();
 document.getElementById('pm').hidden=false; }); }
var liveTimer=null;
function openLive(ev,w,title,end){ var el=document.getElementById('pmB'); clearInterval(liveTimer);
 function load(){ fetch('/api/live?ev='+encodeURIComponent(ev)+'&w='+encodeURIComponent(w)).then(function(r){return r.json();}).then(function(j){
  var rows=j.rows||[], liveNow=Date.now()<end;
  el.innerHTML='<h3>'+esc(title)+'</h3><p class="small">'+(liveNow?'<b class="lvdot">LIVE</b> refreshes every minute':'Final standings')+(j.synced?' · synced '+new Date(j.synced).toLocaleTimeString():'')+'</p>'+
   (rows.length&&rows.some(function(r){return r.pts>0;})?'<table class="tbl"><thead><tr><th>#</th><th>Player</th><th class="n">Games</th><th class="n">Points</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td class="n">'+r.rank+'</td><td class="pl">'+r.n.map(function(n,i){return (r.c[i]?'<img src="/flags/w20/'+r.c[i]+'.png" alt="" width="16">':'')+esc(n);}).join(' + ')+'</td><td class="n">'+(r.g||'')+'</td><td class="n p1">'+r.pts+'</td></tr>';}).join('')+'</tbody></table>':'<p class="note">No points yet. The table fills in once the first game ends.</p>');
  if(!liveNow) clearInterval(liveTimer); }).catch(function(){ el.innerHTML='<h3>'+esc(title)+'</h3><p class="note">Live table is unavailable right now.</p>'; }); }
 el.innerHTML='<h3>'+esc(title)+'</h3><p class="note">Loading…</p>'; document.getElementById('pm').hidden=false; load();
 if(Date.now()<end) liveTimer=setInterval(function(){ if(document.getElementById('pm').hidden){clearInterval(liveTimer);return;} load(); },60000); }
document.addEventListener('click',function(e){ var b=e.target.closest('.lvb'); if(b){ e.preventDefault(); openLive(b.dataset.ev,b.dataset.w,b.dataset.t,+b.dataset.end); } });
(function(){ var box=document.getElementById('liveNow'); if(!box) return;
 var L=D.filter(function(e){return e[8]>=0&&K[e[3]]==='fncs'&&e[0]*60000-30*60000<=now&&now<e[1]*60000+6*3600e3;});
 if(!L.length) return;
 box.innerHTML='<h3><b class="lvdot">LIVE</b> FNCS now</h3><div class="lvregs">'+L.map(function(e){return '<button type="button" class="lvb" data-ev="'+S[e[8]]+'" data-w="'+S[e[9]]+'" data-t="'+esc(S[e[5]])+' · '+(e[2]>=0?R[e[2]]:'LAN')+'" data-end="'+e[1]*60000+'">'+(e[2]>=0?R[e[2]]:'LAN')+' · '+esc(S[e[5]].replace(/^.*·\s*/,''))+'</button>';}).join('')+'</div>';
 box.hidden=false; })();
function rlShow(r){ document.querySelectorAll('.rlr button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.rr===r?'true':'false');}); document.querySelectorAll('.rlt').forEach(function(t){t.hidden=t.dataset.rr!==r;}); }
document.querySelectorAll('.rlr button').forEach(function(b){b.onclick=function(){rlShow(b.dataset.rr);};});
if(document.querySelector('.rlr')) rlShow(reg==='ALL'?'EU':sreg());
document.querySelector('#pm .mx').onclick=function(){document.getElementById('pm').hidden=true; clearInterval(liveTimer);};
document.getElementById('pm').onclick=function(e){ if(e.target.id==='pm') e.target.hidden=true; };
document.getElementById('cmpBtn').onclick=function(){ openCompare(); };
pickWire('plFind',function(p){ openPlayer(p.id); });
document.addEventListener('click',function(e){ var t=e.target.closest('[data-pid]'); if(t){ e.preventDefault(); openPlayer(t.dataset.pid); } });
var TABS=['calendar','prizes','results','news','predictions'], tab=(location.hash||'').slice(1); if(TABS.indexOf(tab)<0) tab='calendar';
function showTab(t){ tab=t;
 document.querySelectorAll('.subnav button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false');});
 document.querySelectorAll('.tabp').forEach(function(p){p.hidden=p.dataset.tab!==t;});
 document.querySelector('.regs').hidden=t==='predictions'||t==='news';
 try{history.replaceState(null,'','#'+t);}catch(e){}
}
document.querySelectorAll('.subnav button').forEach(function(b){b.onclick=function(){showTab(b.dataset.tab);};});
showTab(tab);
var trO=document.getElementById('trOnly'); if(trO) trO.onchange=function(){ document.getElementById('trs').classList.toggle('only',trO.checked); };
function apply(){
 document.querySelectorAll('.regs button[data-r]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.r===reg?'true':'false');});
 document.querySelectorAll('.res').forEach(function(x){x.hidden=reg!=='ALL'&&x.dataset.reg!==sreg()&&x.dataset.reg!=='LAN';});
 renderCal(); renderBig();
 try{localStorage.setItem('compReg',reg);}catch(e){}
}
document.querySelectorAll('.regs button[data-r]').forEach(function(b){b.addEventListener('click',function(){reg=b.dataset.r;apply();});});

apply();
})();`;

const regButtons = '<div class="regs" role="group" aria-label="Region">' + ['ALL', 'EU', 'CIS'].concat(REGS.slice(1)).map(r => `<button type="button" data-r="${r}">${r === 'ALL' ? 'All' : r}</button>`).join('') + '</div>';
const title = 'Fortnite Competitive: tournament calendar, prize money and results | FNCS Draft';
const desc = 'Every Fortnite tournament this week in your time zone, who earned the most prize money in ' + 'every month of 2026' +
  ', the latest cup results and FNCS predictions. All regions.';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/competitive"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/competitive"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico"><style>${CSS}</style></head>
<body><div class="wrap">${NAV}
<section class="glass head"><h1>Competitive</h1>
<p>Fortnite tournaments in your time zone, prize money and results for every region. Updated with every site build.</p></section>
<nav class="subnav" role="tablist" aria-label="Competitive">
<button role="tab" data-tab="calendar">Calendar</button><button role="tab" data-tab="prizes">Prize money</button><button role="tab" data-tab="results">Results</button><button role="tab" data-tab="news">News</button><button role="tab" data-tab="predictions">Predictions</button>
</nav>
${regButtons}
<div class="tabp" data-tab="calendar">
<div class="grid">
<section class="glass panel" aria-label="Calendar"><h3>Calendar</h3><p class="small">In your time zone. Pick a day to see every cup on it.</p>
<div id="cal" class="cal"></div><div id="calDay" class="calday"></div></section>
<section class="glass panel" aria-label="Prize money"><h3 id="earnH">Prize money</h3>
<p class="small" id="earnP"></p><div id="earnT"></div>
</section></div></div>
<div class="tabp" data-tab="prizes" hidden><section class="glass panel"><h3 id="bigH">Prize money</h3><p class="small" id="bigP"></p>
<div class="periods" id="periods"></div><div class="bigtools"><div class="pk" id="plFind"><input type="search" autocomplete="off" spellcheck="false" placeholder="Find a player"><ul class="pkL" hidden></ul></div><button type="button" id="cmpBtn" class="morebtn">Compare two players</button></div><div id="bigT"></div></section>
<section class="glass panel"><h3>Records 2026</h3><div class="recs">${RECS.map(r => '<div class="rec"><i>' + esc(r[0]) + '</i><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + '</span></div>').join('')}</div></section>
<section class="glass panel"><h3 id="ccH">Prize money by country</h3><div id="ccT"></div></section></div>
<div class="tabp" data-tab="results" hidden>${WEEK ? '<section class="glass panel week"><h3>This week</h3><p class="small">' + money(WEEK.paid) + ' paid in the last 7 days.</p><div class="wkgrid"><div><i>Top earners</i>' +
  WEEK.top.map(t => '<p>' + flag(t[1]) + '<b>' + esc(t[0]) + '</b> <span class="p1">' + money(t[2]) + '</span></p>').join('') + '</div><div><i>Biggest wins</i>' +
  WEEK.wins.map(t => '<p><b>' + esc(t[0]) + '</b> won ' + esc(t[1]) + ' <span class="p1">' + money(t[2]) + '</span></p>').join('') + '</div></div></section>' : ''}
<div class="results">${resHTML || '<p class="note">No results yet.</p>'}</div></div>
<div class="tabp" data-tab="news" hidden>${NEWS ? '<div class="news"><section class="glass panel"><h3>Latest wins</h3><p class="small">Biggest wins of the last 30 days: FNCS, LANs and non-Epic tournaments.</p><ul class="nl">' + (NEWS.heads.join('') || '<li><span></span><span class="note">Nothing big this month yet.</span></li>') + '</ul></section>' +
  '<section class="glass panel"><h3>Coming up</h3><p class="small">The biggest events of the next three weeks.</p><ul class="nl">' + (NEWS.ahead.join('') || '<li><span></span><span class="note">Nothing big on the calendar yet.</span></li>') + '</ul></section></div>' +
  '<section class="glass panel"><h3>Transfers</h3><p class="small">Roster moves of the last 45 days, from Liquipedia. Click a player to see their 2026.</p>' +
  '<label class="trtools"><input type="checkbox" id="trOnly" checked> Known players only (' + NEWS.big + ' of ' + NEWS.tr.length + ')</label><ul class="trs only" id="trs">' + NEWS.tr.join('') + '</ul></section>' : '<p class="note">No news yet.</p>'}</div>
<div class="tabp" data-tab="predictions" hidden><section class="glass panel" id="liveNow" hidden></section>${heroHTML}
<a class="glass predcard" href="/predict/fncs-solos-2026"><span class="tag">Prediction</span><b>FNCS Solos 2026 Finals</b>
<span>Win chances for all 698 finalists, real drop maps for every region, 500 simulated finals each.</span></a>${reloadHTML}</div>
<div class="modal" id="pm" hidden><div class="glass mbox"><button type="button" class="mx" aria-label="Close">×</button><div id="pmB"></div></div></div>
<div class="foot"><p class="note">Calendar and leaderboards: Epic Games via <a href="https://eucompetitive.com" rel="noopener">eucompetitive.com</a> and Fortnite Tracker. Payout tables: Epic, via Fortnite Tracker. Non-Epic tournaments and transfers: <a href="https://liquipedia.net/fortnite" rel="noopener">Liquipedia</a> (CC BY-SA 3.0).</p>
<a class="btn" href="/">Play the FNCS career</a></div>
</div><script>${JS}</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'competitive.html'), html, 'utf8');

// sitemap
const smPath = path.join(OUT, 'sitemap.xml');
if (fs.existsSync(smPath)) {
  let sm = fs.readFileSync(smPath, 'utf8');
  if (!sm.includes(SITE + '/competitive<')) sm = sm.replace('</urlset>', '<url><loc>' + SITE + '/competitive</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>');
  fs.writeFileSync(smPath, sm, 'utf8');
}
console.log('competitive: /competitive (' + upcoming.length + ' окон в календаре, ' + (RES ? RES.windows.length : 0) + ' призовых окон, ' + Math.round(html.length / 1024) + ' КБ)');
