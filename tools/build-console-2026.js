// Капы с платформой 2026 года — консольные (PlayStation Cup, Console Victory/Cash Cups) и мобильные (Mobile Victory Cups,
// Mobile Series, Touch-Only Test Cup) — из окон Epic: tools/measured/comp-events-2026.json. Играются с консолью или телефоном.
// Один кап — вечер EU с выплатой (окно с payoutTable). Таблица выплат — по регионам (то же окно у каждого региона),
// 'value' (100, 200, 300 очков = победы) карьера читает как плату за победу (ccVicPerWin), 'rank' — как места.
// Печатает const CC_CONSOLE_2026=[...]; вставляется в index.html вместо прежней строки.
//   node tools/build-console-2026.js > console.txt
const path = require('path');
const ev = require(path.join(__dirname, 'measured', 'comp-events-2026.json'));
const RX = /_(EU|NAC|NAW|BR|ASIA|ME|OCE)$/;
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const MODE = {Solo: 'solo', Duos: 'duo', Trios: 'trio', Squads: 'squad'};
// Таблица выплат окна по регионам: id окна без региона → {REG: ranks}.
const payOf = {};
for (const [k, e] of Object.entries(ev)) {
  const r = (k.match(RX) || [])[1]; if (!r) continue;
  for (const w of e.w || []) {
    const p = (w.pay || [])[0]; if (!p || !p.ranks || !p.ranks.length) continue;
    (payOf[w.w.replace(RX, '')] = payOf[w.w.replace(RX, '')] || {})[r] = p.ranks;
  }
}
/* Мобильные скин-капы: у Epic это ShopCup без денег, скин тот же, что у ПК-капа с тем же именем (tools/measured/skin-cups.json).
   Ключ сравнения — id без «Mobile», «Cup» и подчёркиваний: S41_ViniJr_Mobile ~ S41_ViniJr, S39_SoloLevelingMobile ~ S39_SoloLevelingCup.
   Капы без такого пары (Shadow, Inoxtag Icon, Champion FNCS и т.п.) не берём: какой скин они дают, в данных нет. */
const skinKey = s => String(s).replace(/Mobile|Cup|_/gi, '').toLowerCase();
const SKINS = {};
require(path.join(__dirname, 'measured', 'skin-cups.json')).forEach(c => { SKINS[skinKey(c.id)] = c; });
// Mobile Series: этап по id окна. LCQ/Group/SemiFinal с «All» в id — сводные окна, у EU свои, их не берём.
const stageOf = id => !/MobileSeries/.test(id) ? null : /All/.test(id) ? 'skip' : /Heat/.test(id) ? 'heats'
  : /CupQual|CupFebQual|CupJanQual|CupMarQual/.test(id) ? 'cup' : /LCQ/.test(id) ? 'lcq' : /Group/.test(id) ? 'group'
  : /SemiFinal/.test(id) ? 'semi' : 'round';
/* Комнаты этапов по правилам Epic (Mobile Series Chapter 7): хит, квалификация, группа и полуфинал — 16 человек,
   второй день LCQ — 160. Раунды и первый день LCQ открыты всем. */
const ROOM = {heats: 16, cup: 16, group: 16, semi: 16, lcq2: 160};
const out = [], n = {};
for (const [k, e] of Object.entries(ev)) {
  if (!/_EU$/.test(k) || !/Console|PlayStation|Playstation|Xbox|Mobile|Touch/i.test(k + ' ' + (ev[k].t1 || ''))) continue;
  const id = k.replace(/^epicgames_/, '').replace(/_EU$/, '');
  const name = String(e.t1 || id).trim();
  const stage = stageOf(id);
  if (stage === 'skip') continue;
  const skin = !stage && /Mobile/i.test(id) ? SKINS[skinKey(id)] : null;
  const days = {};
  for (const w of e.w || []) {
    const stem = w.w.replace(RX, ''), pay = payOf[stem];
    if ((!pay || !pay.EU) && !stage && !skin) continue;   // вечер без денег (ZB без призов) не берём; этапы серии и скин-капы — да
    const d = w.b.slice(0, 10);
    if (!days[d]) days[d] = {pay: pay || null, team: w.team, w: stem};
  }
  Object.keys(days).sort().forEach(d => {
    n[id] = (n[id] || 0) + 1;
    const payT = {}; REGS.forEach(r => { if (days[d].pay && days[d].pay[r]) payT[r] = days[d].pay[r]; });
    const row = {day: d, id, mode: MODE[days[d].team] || 'solo', n: n[id], name, payT};
    if (stage) {
      const st = stage === 'lcq' ? (n[id] === 1 ? 'lcq1' : 'lcq2') : stage;
      row.series = st;
      if (ROOM[st]) row.invite = ROOM[st];
      const h = id.match(/Heat(\d)/); if (h) row.heat = +h[1];
      const q = days[d].w.match(/Qualifier(\d+)/); if (q) row.q = +q[1];
      const g = id.match(/Group(\d)/); if (g) row.grp = +g[1];
    }
    if (skin) { row.skin = skin.skin; row.skinN = skin.skinN; row.fmt = true; }
    if (/ZB|ZeroBuild|Zero Build/i.test(id + ' ' + name)) row.zb = true;
    // Платформа — по id и имени (у части PlayStation-капов id без слова PlayStation: PSTypicalGamer, PSNickEh30).
    const t = id + ' ' + name;
    row.plat = /Mobile|Touch/i.test(t) ? 'mobile' : /Xbox/i.test(t) ? 'xbox' : /PlayStation|Playstation|_PS[A-Z]/.test(t) ? 'ps' : 'any';
    out.push(row);
  });
}
/* Mobile Series Championship 2026 — LAN в Копенгагене (BLAST Studios), 24–25 октября, 16 игроков со всего мира,
   25 игр за два дня (12 + 13), матч-пойнт: 150% очков лидера после первого дня. Места и деньги — Liquipedia
   Mobile_Series/2026; у Epic этого окна в выгрузке нет (LAN). Таблица одна на все регионы. */
{
  const champ = [[1,50000],[2,30000],[3,20000],[4,16000],[5,14000],[6,12000],[7,10000],[8,9000],[9,8000],[10,7000],
                 [11,6000],[12,5000],[13,4000],[14,3500],[15,3000],[16,2500]];
  const payT = {}; REGS.forEach(r => { payT[r] = champ; });
  out.push({day: '2026-10-24', id: 'MobileSeriesChampionship2026', mode: 'solo', n: 1, name: 'Mobile Series Championship',
            payT, series: 'champ', invite: 16, games: 25, day1: 12, plat: 'mobile'});
}
out.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
process.stdout.write('const CC_CONSOLE_2026=' + JSON.stringify(out) + ';\n');
console.error(out.length + ' console cups, ' + JSON.stringify(out).length + ' bytes; ' + [...new Set(out.map(x => x.id))].join(', '));
