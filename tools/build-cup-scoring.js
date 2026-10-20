// Очки капов по правилам Epic (ScoringRules окон события: imp_event.Windows[] со страниц Tracker,
// Европа, 2019–2026, снято 29.09.2026 в tools/measured/event-scoring-eu.json; у событий до 2023-го
// правила лежат в Template.ScoringRules, у новых — в Leaderboards[].ScoringRules).
//   CC_SCORE_R — уникальные правила: [места, элимы]
//     места — [[порог, очки], …] с MatchRule "lte": каждый пройденный порог «топ N» добавляет очки;
//     элимы — число (очки за элим, Multiplicative) или [[порог, очки], …] (gte, каждый порог — очки).
//   CC_CUP_SCORE — семейство события (id Epic без epicgames_ и без _EU) → [правило раунда 1,
//     правило раунда 2 или -1, лимит игр раунда 1, лимит игр раунда 2].
// Вклеивается между маркерами «CUP SCORING begin/end».
//   node tools/build-cup-scoring.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
let src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'event-scoring-eu.json'), 'utf8'));
if (typeof src === 'string') src = JSON.parse(src);
const SKIP = /TwitchRivals|Token|Test|REPAIR|Private|Jaymee|Gauntlet|TwitchTesting|ScoringTest/i;

// Правило Epic → компактная запись. null — если в нём нет ни мест, ни элимов.
function compact(rules) {
  if (!Array.isArray(rules) || !rules.length) return null;
  let place = null, elim = null;
  for (const r of rules) {
    const stat = r.TrackedStat || r.trackedStat, rule = r.MatchRule || r.matchRule;
    const tiers = (r.RewardTiers || r.rewardTiers || []).map(t => [t.KeyValue ?? t.keyValue, t.PointsEarned ?? t.pointsEarned, t.Multiplicative ?? t.multiplicative]);
    if (stat === 'PLACEMENT_STAT_INDEX' && rule === 'lte' && !place) {
      place = tiers.filter(t => t[1]).map(t => [t[0], t[1]]);
    } else if (stat === 'TEAM_ELIMS_STAT_INDEX' && rule === 'gte' && elim == null) {
      if (tiers.length === 1 && tiers[0][2] && tiers[0][0] === 1) elim = tiers[0][1];
      else if (tiers.length && tiers.every((t, i) => !t[2] && t[0] === i + 1 && t[1] === tiers[0][1])) elim = tiers[0][1];
      else elim = tiers.filter(t => t[1]).map(t => [t[0], t[1]]);
    }
  }
  if (!place && elim == null) return null;
  return [place || [], elim == null ? 0 : elim];
}

const R = [], rIx = {}, fam = {};
const idOf = c => { const k = JSON.stringify(c); if (rIx[k] == null) { rIx[k] = R.length; R.push(c); } return rIx[k]; };
for (const slug of Object.keys(src.ev).sort()) {
  if (SKIP.test(slug)) continue;
  const key = slug.replace(/^epicgames_/, '').replace(/_EU(_.*)?$/, '');
  /* Раунды карьеры два: R1 — Round1/квалификация, R2 — Round2, а если его нет — финал события
     (Final, LastChanceLobby). Round3+ в R1 не идут (аудит 21.10: финалы и третьи дни подмешивались
     в первый раунд). Правило и лимит игр голосуют ПАРОЙ одного окна — раньше брались по
     отдельности и складывали очки квалификации с числом игр финала. */
  const id = w => String(w[0]);
  const isR2 = w => /Round_?2/i.test(id(w)), isLate = w => /Round_?[3-9]/i.test(id(w));
  const isFin = w => !/Final/i.test(key) && /Final|LastChanceLobby/i.test(id(w)) && !/Qualifier/i.test(id(w));
  const ws = src.ev[slug];
  const hasR2 = ws.some(isR2);
  const b1 = {}, b2 = {};
  const put = (bag, w, j) => { const c = compact(src.rules[w[3]]); if (!c) return; const k = idOf(c) + '|' + (w[4] || 0), n = w[7] || 1; const o = bag[k] || (bag[k] = {n: 0, first: null}); o.n += n; if (o.first == null) o.first = j; };
  ws.forEach((w, j) => { const bag = isR2(w) || (!hasR2 && isFin(w)) ? b2 : (isLate(w) || isFin(w)) ? null : b1; if (bag) put(bag, w, j); });
  // Только поздние раунды (Round6 и т.п.) — тогда они и есть первый раунд.
  if (!Object.keys(b1).length && !Object.keys(b2).length) ws.forEach((w, j) => put(b1, w, j));
  // Больше окон — главнее; поровну — первое окно (финал 2024 «день 2» шёл ×1.5 — это не формат события).
  const top = o => { const k = Object.keys(o).sort((a, b) => o[b].n - o[a].n || o[a].first - o[b].first)[0]; return k == null ? [-1, 0] : k.split('|').map(Number); };
  const [a, ca] = top(b1), [b, cb] = top(b2);
  if (a < 0 && b < 0) continue;
  const row = a < 0 ? [b, b, 0, cb] : [a, b, ca, b < 0 ? 0 : cb];
  if (fam[key] && fam[key][1] >= 0 && row[1] < 0) continue;   // семейство из нескольких слагов: раунд 2 важнее
  fam[key] = row;
}
const body = '/* CUP SCORING begin — tools/build-cup-scoring.js */\n' +
  'const CC_SCORE_R=' + JSON.stringify(R) + ';\n' +
  'const CC_CUP_SCORE=' + JSON.stringify(fam) + ';\n' +
  '/* CUP SCORING end */';
const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const A = html.indexOf('/* CUP SCORING begin'), B = html.indexOf('/* CUP SCORING end */');
if (A < 0 || B < 0) throw new Error('markers not found');
const eol = html.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
html = html.slice(0, A) + body.replace(/\n/g, eol) + html.slice(B + '/* CUP SCORING end */'.length);
fs.writeFileSync(file, html);
console.log('rules', R.length, 'families', Object.keys(fam).length, 'with round 2', Object.values(fam).filter(v => v[1] >= 0).length, 'bytes', body.length);
