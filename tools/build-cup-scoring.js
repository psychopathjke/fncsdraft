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
  const r1 = {}, r2 = {}, cap1 = {}, cap2 = {};
  for (const w of src.ev[slug]) {
    const c = compact(src.rules[w[3]]); if (!c) continue;
    const two = /Round_?2/i.test(String(w[0]));
    const bag = two ? r2 : r1, cap = two ? cap2 : cap1, i = idOf(c);
    const n = w[7] || 1; bag[i] = (bag[i] || 0) + n; if (w[4]) cap[w[4]] = (cap[w[4]] || 0) + n;
  }
  const top = o => { const k = Object.keys(o).sort((a, b) => o[b] - o[a])[0]; return k == null ? -1 : +k; };
  const a = top(r1), b = top(r2);
  if (a < 0 && b < 0) continue;
  const row = [a < 0 ? b : a, b, top(cap1) < 0 ? 0 : top(cap1), top(cap2) < 0 ? 0 : top(cap2)];
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
