// Показывает ли режим «только смотрю» сам матч.
//
// Кнопка обещает «смотрю, но меня не спрашивают» — так написано и в подсказке,
// и в комментарии у неё. Его отчёт, 28 августа: «только смотреть нажимаю, опять
// скипается турнир». Значит либо кнопка врёт, либо скипает что-то другое.
//
// Меряется не на глаз: оборачивается ZoneReplay.play — то, что рисует матч, —
// и считается, сколько раз его позвали и сколько кадров в него отдали. Прогон
// идёт трижды: обычный, «только смотрю» и «пропустить», чтобы было с чем
// сравнивать.
//
//   node tools/sim-shows-probe.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = (sim, skip) => `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{}, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    // Считаем показ матча: сколько раз звали проигрыватель и сколько кадров.
    let plays=0, frames=0;
    const realPlay=ZoneReplay.play;
    ZoneReplay.play=function(handle, timeline, opts){
      plays++; frames+=(timeline&&timeline.length)||0;
      return realPlay.apply(this, arguments);
    };
    // Отвечаем на всё одинаково, чтобы вечер вообще доехал.
    setInterval(function(){
      const am=document.getElementById("ccAskModal");
      if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
        if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
      const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
      const p=document.querySelector(".landing-picker"); if(!p) return;
      const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
      z[0].click();
      const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
    }, 20);

    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Watch', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'fixed-world', sim:${sim?'true':'false'}},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(93,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    const dm=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
    if(dm){ careerDmAccept(dm.id); careerRenderHub('centre'); }
    out.notes.режим=careerSimOn() ? 'только смотрю' : 'играю сам';

    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play){ out.fail='нет кнопки вечера'; throw new Error(out.fail); }
    const sk=setInterval(()=>{ if(!${skip?'true':'false'}) return;
      const b=document.getElementById('majorSkipBtn');
      if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let card=null;
    for(let i=0;i<16000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if(!card){ out.fail='результат не пришёл'; throw new Error(out.fail); }
    out.notes.показовМатча=plays;
    out.notes.кадровПоказано=frames;
    out.notes.строкТаблицы=document.querySelectorAll(
      '#majorStages .stage-card table.lobby-table tbody tr').length;
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const run = (tag, sim, skip) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'simshow-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT(sim, skip));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(tag + ': проба не отработала, копия ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.fail) { console.error(tag + ': ' + out.fail); process.exit(1); }
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
};

const rows = [
  ['играю сам        ', run('обычный', false, false)],
  ['только смотрю    ', run('смотрю', true, false)],
  ['нажал «пропустить»', run('скип', false, true)],
];
console.log('режим               показов матча   кадров   строк таблицы');
rows.forEach(([n, r]) => console.log('  ' + n + '  ' +
  String(r.показовМатча).padStart(8) + '   ' +
  String(r.кадровПоказано).padStart(7) + '   ' +
  String(r.строкТаблицы).padStart(7)));
