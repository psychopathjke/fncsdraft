// Вставляет ключи 2023-го в пять словарей — сразу за ccYear2024.
// Повторный запуск ничего не меняет (ключ ccYear2023 уже есть).
//   node tools/patch-i18n-2023.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const K = {
  ru: "ccYear2023:'дуо', ccYr23Day:(n,w,d)=>'Мейджор '+n+' · неделя '+w+' · день '+d, ccYr23WeekFinal:(n,w)=>'Мейджор '+n+' · финал недели '+w, ccYr23Surge:n=>'Мейджор '+n+' · Surge Week', ccYr23Lcm:d=>'Last Chance Major · '+(d===3 ? 'финал' : 'день '+d), ccYr23SurgeWon:'Топ-10 Surge Week — билет в финал Мейджора', ccYr23SeriesTicket:k=>'Топ-'+k+' серии — финал Мейджора', ccYr23NoTicket:k=>'Вне топ-'+k+' серии — остаётся Surge Week', ccYr23GcDay:d=>['верхняя сетка','нижняя сетка','финал'][d-1]||'', ccYr23GcUp:'Топ-25 — сразу в финал', ccYr23GcDown:'Нижняя сетка — второй шанс', ccYr23GcOut:'Нижняя сетка: вылет', ccMajSeatGc23:n=>'Топ-'+n+' едут на Global Championship в Копенгаген', ccYr23EliteOnly:'Мейджор 1 — только для дивизиона 1 (Elite)', ccYr23LcmSeat:n=>'Топ-'+n+' — нижняя сетка Копенгагена',",
  en: "ccYear2023:'duos', ccYr23Day:(n,w,d)=>'Major '+n+' · Week '+w+' · Day '+d, ccYr23WeekFinal:(n,w)=>'Major '+n+' · Week '+w+' Finals', ccYr23Surge:n=>'Major '+n+' · Surge Week', ccYr23Lcm:d=>'Last Chance Major · '+(d===3 ? 'Finals' : 'Day '+d), ccYr23SurgeWon:'Top 10 of the Surge Week — a ticket to the Major final', ccYr23SeriesTicket:k=>'Top '+k+' of the series — Major final', ccYr23NoTicket:k=>'Outside the series top '+k+' — the Surge Week is left', ccYr23GcDay:d=>['Upper Bracket','Lower Bracket','Grand Finals'][d-1]||'', ccYr23GcUp:'Top 25 — straight to the Grand Finals', ccYr23GcDown:'Lower Bracket — a second chance', ccYr23GcOut:'Lower Bracket: eliminated', ccMajSeatGc23:n=>'Top '+n+' fly to the Global Championship in Copenhagen', ccYr23EliteOnly:'Major 1 — Division 1 (Elite) only', ccYr23LcmSeat:n=>'Top '+n+' — Copenhagen Lower Bracket',",
  fr: "ccYear2023:'duos', ccYr23Day:(n,w,d)=>'Major '+n+' · semaine '+w+' · jour '+d, ccYr23WeekFinal:(n,w)=>'Major '+n+' · finale de la semaine '+w, ccYr23Surge:n=>'Major '+n+' · Surge Week', ccYr23Lcm:d=>'Last Chance Major · '+(d===3 ? 'finale' : 'jour '+d), ccYr23SurgeWon:'Top 10 de la Surge Week — billet pour la finale du Major', ccYr23SeriesTicket:k=>'Top '+k+' de la série — finale du Major', ccYr23NoTicket:k=>'Hors du top '+k+' de la série — reste la Surge Week', ccYr23GcDay:d=>['tableau supérieur','tableau inférieur','finale'][d-1]||'', ccYr23GcUp:'Top 25 — directement en finale', ccYr23GcDown:'Tableau inférieur — seconde chance', ccYr23GcOut:'Tableau inférieur : éliminé', ccMajSeatGc23:n=>'Le top '+n+' part au Global Championship à Copenhague', ccYr23EliteOnly:'Major 1 — division 1 (Elite) uniquement', ccYr23LcmSeat:n=>'Top '+n+' — tableau inférieur de Copenhague',",
  it: "ccYear2023:'duo', ccYr23Day:(n,w,d)=>'Major '+n+' · settimana '+w+' · giorno '+d, ccYr23WeekFinal:(n,w)=>'Major '+n+' · finale della settimana '+w, ccYr23Surge:n=>'Major '+n+' · Surge Week', ccYr23Lcm:d=>'Last Chance Major · '+(d===3 ? 'finale' : 'giorno '+d), ccYr23SurgeWon:'Top 10 della Surge Week — biglietto per la finale del Major', ccYr23SeriesTicket:k=>'Top '+k+' della serie — finale del Major', ccYr23NoTicket:k=>'Fuori dal top '+k+' della serie — resta la Surge Week', ccYr23GcDay:d=>['upper bracket','lower bracket','finale'][d-1]||'', ccYr23GcUp:'Top 25 — direttamente in finale', ccYr23GcDown:'Lower bracket — seconda possibilità', ccYr23GcOut:'Lower bracket: eliminati', ccMajSeatGc23:n=>'Il top '+n+' va al Global Championship a Copenaghen', ccYr23EliteOnly:'Major 1 — solo divisione 1 (Elite)', ccYr23LcmSeat:n=>'Top '+n+' — lower bracket di Copenaghen',",
  pt: "ccYear2023:'duplas', ccYr23Day:(n,w,d)=>'Major '+n+' · semana '+w+' · dia '+d, ccYr23WeekFinal:(n,w)=>'Major '+n+' · final da semana '+w, ccYr23Surge:n=>'Major '+n+' · Surge Week', ccYr23Lcm:d=>'Last Chance Major · '+(d===3 ? 'final' : 'dia '+d), ccYr23SurgeWon:'Top 10 da Surge Week — vaga na final do Major', ccYr23SeriesTicket:k=>'Top '+k+' da série — final do Major', ccYr23NoTicket:k=>'Fora do top '+k+' da série — resta a Surge Week', ccYr23GcDay:d=>['chave superior','chave inferior','final'][d-1]||'', ccYr23GcUp:'Top 25 — direto para a final', ccYr23GcDown:'Chave inferior — segunda chance', ccYr23GcOut:'Chave inferior: eliminados', ccMajSeatGc23:n=>'O top '+n+' vai ao Global Championship em Copenhague', ccYr23EliteOnly:'Major 1 — só divisão 1 (Elite)', ccYr23LcmSeat:n=>'Top '+n+' — chave inferior de Copenhague',"
};
if (s.indexOf('ccYear2023:') >= 0) { console.log('already patched'); process.exit(0); }
// Пять словарей по порядку: ru, en, fr, it, pt — у каждого своя строка с ccYear2024.
const lines = s.split('\n');
const idx = lines.map((l, i) => /ccYear2024:/.test(l) && /ccYear:/.test(l) ? i : -1).filter(i => i >= 0);
if (idx.length !== 5) throw new Error('expected 5 dictionaries, got ' + idx.length);
['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
  const i = idx[j], l = lines[i];
  const at = l.indexOf('ccYear2024:');
  const comma = l.indexOf(',', at);
  lines[i] = l.slice(0, comma + 1) + ' ' + K[lang] + l.slice(comma + 1);
});
fs.writeFileSync(file, lines.join('\n'));
console.log('patched', idx.map(i => i + 1).join(','));
