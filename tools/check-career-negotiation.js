// Переговоры поинтереснее (его слово 7.10: «для переговоров мб сделать диалоги поинтересней, реализм»).
// Размер просьбы (чуть / больше / жёстко): шаг растёт, шанс падает; встречное «посередине» вместо голого отказа;
// торг за долю клуба с призовых и бонус за подпись (платится в день подписания); козырь — только при другом
// предложении на руках, и он поднимает шанс; кнопки торга в самом окне предложения.
//   node tools/check-career-negotiation.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const seed=ovr=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Neg', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
              attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:2, earnings:0, balance:0, reach:5000, tokens:[], log:[], news:[]}, partner:null}));
    careerLoad(); };
  const offer=(tier, salary, name, extra)=>{
    CAREER.offers=[{name:name||'Probe Esports', salary:salary, academy:false, tier:tier, goal:{type:'cut'}, perk:null}].concat(extra||[]);
    return careerOrgDm(CAREER.offers[0], 0); };
  const answer=()=>{ const from=CAREER.career.day, to=ccAddDays(from, CC_ASK_DAYS); CAREER.career.day=to; careerOrgDays(from, to); };
  const last=t=>(t.msgs[t.msgs.length-1]||{}).k;

  // ---- размер просьбы
  seed(80);
  const o0={tier:80};
  const os={small:careerAskOdds(o0, 0, CC_ASK_SIZES.small.odds), fair:careerAskOdds(o0, 0, 1), hard:careerAskOdds(o0, 0, CC_ASK_SIZES.hard.odds)};
  out.notes.odds=os;
  check('чем наглее просьба, тем ниже шанс', os.small>os.fair && os.fair>os.hard, JSON.stringify(os));
  let t=offer(80, 1000, 'Small Club'); careerAskMore(t.id, 'small'); const wSmall=t.pending.want;
  seed(80); t=offer(80, 1000, 'Hard Club'); careerAskMore(t.id, 'hard'); const wHard=t.pending.want;
  out.notes.want={small:wSmall, hard:wHard};
  check('жёсткая просьба — заметно больше денег', wHard>wSmall*1.15, wSmall+' / '+wHard);
  check('игрок говорит своими словами', last(t)==='dmAskHard' || last(t)==='dmOrgWait', last(t));

  // ---- встречное
  let counter=0, yes=0, no=0, midOk=true;
  for(let i=0;i<60;i++){ seed(78); t=offer(80, 1000, 'Club '+i); careerAskMore(t.id, 'hard'); const want=t.pending.want; answer();
    const k=t.msgs.map(m=>m.k);
    if(k.indexOf('dmOrgCounter')>=0){ counter++; if(!(t.offer && t.offer.salary>1000 && t.offer.salary<want)) midOk=false; }
    else if(k.indexOf('dmOrgYesMore')>=0) yes++; else no++; }
  out.notes.hardAsk={yes, counter, no};
  check('на жёсткий отказ клуб иногда встречает посередине', counter>0, JSON.stringify(out.notes.hardAsk));
  check('встречное — между прежним и запрошенным', midOk);

  // ---- доля с призовых и бонус за подпись (игрок сильнее клуба — просьбы проходят чаще)
  let cutYes=0, bonusPaid=0;
  for(let i=0;i<20;i++){
    seed(95); t=offer(70, 2000, 'Cut '+i); const c0=careerOrgCutFor(70);
    careerAskCut(t.id); answer();
    if(t.offer && t.offer.cut!=null && t.offer.cut<c0) cutYes++;
    if(t.offer){ careerAskBonus(t.id); answer(); }
    if(t.offer && t.offer.signBonus){ const b0=CAREER.career.balance||0, sb=t.offer.signBonus; careerSignFromDm(t.id);
      if((CAREER.career.balance||0)>=b0+sb*0.5) bonusPaid++; }
  }
  out.notes.cutYes=cutYes; out.notes.bonusPaid=bonusPaid;
  check('долю клуба с призовых можно сторговать', cutYes>0, String(cutYes));
  check('бонус за подпись платится в день подписания', bonusPaid>0, String(bonusPaid));

  // ---- козырь
  seed(80); t=offer(80, 1000, 'Solo Club');
  check('без второго предложения козыря нет', !ccAskLeverOrg(t));
  seed(80); t=offer(80, 1000, 'Main Club', [{name:'Other Club', salary:900, academy:false, tier:78, goal:{type:'cut'}, perk:null}]);
  const before=careerAskOdds(t.offer, 0, 1, t.lever);
  careerAskLever(t.id);
  const after=careerAskOdds(t.offer, 0, 1, t.lever);
  out.notes.lever={before, after, said:last(t)};
  check('с другим предложением козырь есть и поднимает шанс', t.lever==='Other Club' && after>before, JSON.stringify(out.notes.lever));
  check('клуб на козырь отвечает', t.msgs.some(m=>m.k==='dmOrgLever'));

  // ---- кнопки в окне предложения
  seed(80); t=offer(80, 1000, 'Ui Club', [{name:'Ui Other', salary:900, academy:false, tier:78, goal:{type:'cut'}, perk:null}]);
  CH_SOCIAL='dms'; CH_DM=t.id; careerRenderHub('social');
  const html=(document.getElementById('chBody')||document.body).innerHTML;
  const n=(html.match(/careerAskMore\\(/g)||[]).length;
  out.notes.ui={more:n, cut:html.indexOf('careerAskCut(')>=0, bonus:html.indexOf('careerAskBonus(')>=0, lever:html.indexOf('careerAskLever(')>=0, cutRow:html.indexOf(L().lfCut)>=0};
  check('три кнопки размера просьбы', n===3, String(n));
  check('кнопки доли, бонуса и козыря и строка доли в условиях', out.notes.ui.cut && out.notes.ui.bonus && out.notes.ui.lever && out.notes.ui.cutRow, JSON.stringify(out.notes.ui));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neg-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK переговоры ' + JSON.stringify(out.notes));
