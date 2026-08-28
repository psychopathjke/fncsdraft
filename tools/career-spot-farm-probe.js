// Как быстро копится аура на своей точке — на настоящих вечерах, а не на глаз.
//
// Его вопрос, 23 августа: «а как фармить ауру?». Ответ должен быть измеренным:
// проба играет подряд дивизионные кубки, каждый раз садясь домой, и пишет,
// сколько стычек за вечер выпадает, сколько из них выиграно и на каком вечере
// аура упирается в потолок. Заодно видно, тормозит ли себя механика: чем выше
// аура, тем реже приходят — значит и фармить становится не с кого.
//
//   node tools/career-spot-farm-probe.js [вечеров]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NIGHTS = +(process.argv[2] || 20);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {nights:[], errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Homer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;
    squadSize=2; useLandingSet(careerBrSet());
    const set=careerBrSet();
    // Дом — коробка с хорошим рейтингом: за такую и приходят, на такой и
    // копится. Ставится руками, чтобы проба мерила фарм, а не выбор.
    const stats=ZONE_STATS[set]||[];
    let best=0; stats.forEach((s,i)=>{ if((s&&s.r||0)>(stats[best]&&stats[best].r||0)) best=i; });
    careerSpotSet(best, set);

    const me=careerCard();
    for(let n=0; n<${NIGHTS}; n++){
      const before=careerSpotAura(set);
      // Комната дивизионного кубка и своя точка — то же, что делает вечер.
      drafted=[me]; CARD_MODE=true; squadSize=2;
      useLandingSet(set);
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=[you, ...careerCupField(cr, [me], ccTeams(CAREER_CUP_FIELD), null, false, 0)];
      const mine=careerSpotZone(set);
      careerSpotFearOn(you);
      const {zoneGroups}=buildBotLandingAssignment(field.filter(t=>t!==you));
      careerSpotFearOff();
      you.landingZone=mine;
      if(!zoneGroups.has(mine)) zoneGroups.set(mine, []);
      const neighbours=zoneGroups.get(mine).length;
      zoneGroups.get(mine).push(you);
      await simulateGamesLive(field, CAREER_CUP_GAMES, majorPoints, 1, 'stage', 0, null, zoneGroups,
        {lobbySize:ccTeams(50), stageName:'probe', mapReplay:false, stopOnYourDeath:false});
      const won=you.landingWins||0, lost=you.landingLosses||0, met=you.landingContests||0;
      careerGrowEvent(10, field.length, you, field);
      out.nights.push({n:n+1, auraBefore:before, neighbours:neighbours,
                       met:met, won:won, lost:lost, aura:careerSpotAura(set)});
      if(careerSpotAura(set)>=CC_SPOT_AURA_MAX) break;
    }
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfarm-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('вечер  аура до  соседей  стычек  выиграно  проиграно  аура после');
out.nights.forEach(r => console.log(
  String(r.n).padStart(4), String(r.auraBefore).padStart(8), String(r.neighbours).padStart(8),
  String(r.met).padStart(7), String(r.won).padStart(9), String(r.lost).padStart(10),
  String(r.aura).padStart(11)));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
