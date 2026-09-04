// Выигранный ЛАН стоит в биографии — в профиле и в bio соцсети.
//
// Его слово, 30 августа: «я выиграл EWC, и в bio сошиал не пишет 1x EWC
// Reload или чет такое». Reload Championship в Париже (kind 'rc', финал,
// первое место) и Саммит считаются тем же журналом, что плитка трофеев:
//   1) без побед строка профиля ЛАНа не упоминает;
//   2) победа в Париже — «1× … Reload Championship» и под именем, и в bio
//      соцсети, на каждом языке;
//   3) Мейджор стоит выше ЛАНа в строке под именем, ЛАН — выше кубков;
//   4) календарь: день Парижа носит флаг страны, а не обложку (ccLanKindOf).
//
//   node tools/check-career-bio-lan.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Parisian', age:20, source:'rookie', country:'fr', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-08-23', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    const strip=()=>String(careerBioHTML());
    const social=()=>{ CH_SOCIAL='me'; const h=String(careerSocialHTML()); const m=h.match(/class="x-bio">([^<]*)</); return m ? m[1] : ''; };
    // 1. Без побед — ни слова о ЛАНе.
    check('без побед ЛАНа в профиле нет', strip().indexOf('Reload Championship')<0 && strip().indexOf(L().ccBioSummit(1))<0, strip());
    check('без побед под именем пусто', careerTopHonour()==='', careerTopHonour());
    // 2. Победа в Париже.
    cr.log.push({season:1, day:'2026-08-22', div:1, place:1, of:40, pts:300, passed:true, kind:'rc', stage:'final', prize:100000});
    const want=L().ccBioRc(1);
    check('в профиле — 1× Reload Championship', strip().indexOf(want)>=0, strip());
    check('под именем — Reload Championship', careerTopHonour()===want, careerTopHonour());
    check('в bio соцсети — тоже', social().indexOf(want)>=0, social());
    check('строка называет EWC', want.indexOf('EWC')>=0, want);
    // На каждом языке своя строка, и она непустая.
    const langs=Object.keys(I18N||{});
    const keep=LANG;
    langs.forEach(function(l){ LANG=l; const v=L().ccBioRc && L().ccBioRc(2);
      check('язык '+l+': ccBioRc', typeof v==='string' && v.indexOf('2')===0 && v.toLowerCase().indexOf('reload')>0, String(v));
      const w=L().ccBioSummit && L().ccBioSummit(1);
      check('язык '+l+': ccBioSummit', typeof w==='string' && w.length>3, String(w)); });
    LANG=keep;
    // 3. Порядок: Мейджор выше ЛАНа, ЛАН выше кубков.
    cr.log.push({season:1, day:'2026-03-01', div:1, place:1, of:50, pts:400, passed:true, kind:null, stage:null});
    check('кубок не перебивает ЛАН', careerTopHonour()===want, careerTopHonour());
    cr.log.push({season:1, day:'2026-04-26', div:1, place:1, of:100, pts:500, passed:true, kind:'major', stage:'final'});
    check('Мейджор выше ЛАНа', careerTopHonour()===L().ccBioMajor(1), careerTopHonour());
    cr.log.push({season:1, day:'2026-05-31', div:1, place:1, of:40, pts:500, passed:true, kind:'summit', stage:'final'});
    check('Саммит в профиле', strip().indexOf(L().ccBioSummit(1))>=0, strip());
    // 4. Париж в календаре — флаг, не обложка.
    const ev=careerEvents();
    const paris=(ev.get('2026-08-19')||[]).find(e=>e.id==='ReloadChampionshipParis');
    check('день Парижа в календаре есть', !!paris, JSON.stringify([...(ev.get('2026-08-19')||[])]));
    check('у него ЛАН-вид rc и нет обложки', paris && paris.lan==='rc' && paris.art===null, JSON.stringify(paris||null));
    check('флаг rc рисуется', String(ccLanFlagStyle('rc')||'').indexOf('background')>=0, String(ccLanFlagStyle('rc')).slice(0,60));
    const summit=(ev.get('2026-05-29')||[])[0];
    check('Саммит по-прежнему ЛАН', !summit || summit.lan==='summit', JSON.stringify(summit||null));
    const gclc=[...ev.entries()].map(([d,l])=>l.find(e=>e.kind==='gc' && e.id!=='ReloadChampionshipParis')).find(Boolean);
    check('Last Chance свою обложку не потерял', !gclc || (gclc.lan===null && !!gclc.art), JSON.stringify(gclc||null));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccbiolan-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('выигранный ЛАН стоит в биографии и в bio соцсети; Париж в календаре — флаг');
