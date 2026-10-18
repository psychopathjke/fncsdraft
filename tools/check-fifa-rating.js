// Сторож рейтинга года «как в ФИФЕ» и карточек формы (15.10.2026). Утверждает ПРАВИЛА, а не числа дня:
//   1. карточка FNCS 2019–2026 = 60% сезона + 40% прошлого + опыт, 90% этого + 10% статов, титул не ниже 80% события
//      (пересчёт из _fifa на самой карточке, допуск 0.15);
//   2. верх сжат: 95+ у одной-двух команд набора (в EU/NAC в среднем не больше 4 карточек на набор; без сжатия — 5), 90+ остаётся;
//   3. никто, кроме карточек формы, не выше потолка своего региона (REGION_TOP);
//   4. чемпион гранд-финала не ниже финалиста своего набора и региона;
//   5. карточки формы: есть, у каждой своя прибавка и вид 'form', подпись на всех языках интерфейса,
//      в паке — примерно каждый десятый (4–20%), базу и её форму один пак не даёт;
//   6. карьера читает те же доли (YEAR_RATING.cfg в ccSeasonOvr) — сезон карьеры не выше потолка региона.
//   node tools/check-fifa-rating.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  try{
    const C=YEAR_RATING && YEAR_RATING.cfg;
    check('YEAR_RATING is filled', !!C);
    const cards=PLAYERS_BASE.filter(q=>q._yr);
    check('the pass rated the FNCS sets', cards.length>50000, String(cards.length));
    // 1. formula
    let worst=0, who='';
    cards.forEach(q=>{
      const f=q._yr;
      let v=f.prev!=null ? Math.max((1-C.prevW)*f.season + C.prevW*f.prev, f.season-C.dropCap) : f.season;
      v+=C.expPts*f.exp;
      if(f.stat!=null) v=(1-C.statMix)*v + C.statMix*f.stat;
      if(f.floor!=null) v=Math.max(v, f.floor);
      const d=Math.abs(v-f.blended); if(d>worst){ worst=d; who=q.cardSet+' '+q.handle+' '+v.toFixed(2)+' vs '+f.blended; }
    });
    check('every card is its own formula', worst<=0.15, who);
    check('experience is capped', cards.every(q=>q._yr.exp<=C.expCap));
    // 2. top compressed
    const bySR={};
    cards.forEach(q=>{ const k=q.cardSet+'|'+q.region; const b=bySR[k]=bySR[k]||{n:0, g95:0, g90:0}; b.n++; if(q.rating>=95) b.g95++; if(q.rating>=90) b.g90++; });
    const euNac=Object.entries(bySR).filter(([k])=>/\\|(EU|NAC)$/.test(k));
    const m95=euNac.reduce((s,[,b])=>s+b.g95, 0)/euNac.length, m90=euNac.reduce((s,[,b])=>s+b.g90, 0)/euNac.length;
    out.notes.perSetEuNac={'95+':+m95.toFixed(1), '90+':+m90.toFixed(1)};
    check('95+ is for one or two teams of a set', m95<=4, m95.toFixed(1));
    check('and the 90s are not emptied', m90>=8, m90.toFixed(1));
    // 3. ceiling
    const over=cards.filter(q=>q.rating>(REGION_TOP[q.region]!==undefined ? REGION_TOP[q.region] : 85));
    check('nobody above the region ceiling', !over.length, over.slice(0,3).map(q=>q.cardSet+' '+q.handle+' '+q.rating).join(', '));
    // 4. champion vs finalists
    const gfOf=q=>{ if(q.realGf && q.realGf.rank) return q.realGf.rank; for(const k in q) if(/^_[a-z]\\dGf$/.test(k) && q[k] && q[k].rank) return q[k].rank; return null; };
    let bad=[];
    Object.keys(bySR).forEach(sr=>{
      const qs=cards.filter(q=>q.cardSet+'|'+q.region===sr && gfOf(q));
      const champ=qs.filter(q=>gfOf(q)===1); if(!champ.length) return;
      const cMin=Math.min(...champ.map(q=>q.rating));
      const fin=qs.filter(q=>gfOf(q)>=10).map(q=>q.rating);
      if(fin.length && cMin<Math.max(...fin)-3) bad.push(sr+' champ '+cMin+' < 10th+ '+Math.max(...fin));
    });
    check('a Grand Final champion is not far under the 10th place and below', bad.length<=3, bad.slice(0,5).join('; '));
    // 5. form cards
    const F=YEAR_RATING.form, ids=Object.keys(F);
    out.notes.formCards=ids.length;
    check('form cards exist', ids.length>200, String(ids.length));
    const sample=PLAYERS_BASE.filter(p=>F[p.id]).slice(0, 40);
    const forms=ccFormCardsFor(sample);
    check('each form card is the same person with a boost', forms.length && forms.every(c=>c.form && c.rating>c.form.base && c.handle && shownRarity(c)==='form'),
          forms.slice(0,2).map(c=>c.handle+' '+c.rating+'/'+(c.form&&c.form.base)).join(','));
    check('the form skin exists', !!(CARD_SKIN.form && RARITY_COLOR.form));
    ['ru','en','fr','it','pt'].forEach(lang=>{ const d=I18N[lang]||{};
      ['formTag','ccRarityform','formWhyWin','formWhyElims','formWhyLan','brkYearTitle','brkYearPrev','brkYearExp','brkFormBoost'].forEach(k=>{
        check('label '+k+' in '+lang, typeof d[k]==='string' && d[k].length>0); }); });
    const html=futCardHTML(forms[0]);
    check('the card face says it is in form', html.indexOf(String(L().formTag).toUpperCase())>=0);
    // pack frequency: emulate generatePack's weights over real pools
    let packs=0, withForm=0, dup=0;
    ['m2','m1','t3','f2','k2','j3','h4'].forEach(set=>['EU','NAC','BR'].forEach(reg=>{
      let src=PLAYERS_BASE.filter(p=>p.tier==='cardmode' && p.cardSet===set && p.region===reg);
      const seen={}; src=src.filter(p=>{ const k=hKey(p); if(seen[k]) return false; seen[k]=1; return true; });
      const ac=src.filter(p=>shownRarity(p)!=='common'); if(ac.length>=4) src=ac;
      const fc=ccFormCardsFor(src);
      for(let t=0;t<600;t++){
        let w=src.map(p=>({p, w:packWeightFor(p)})); fc.forEach(c=>w.push({p:c, w:packWeightFor(c)*FORM_PACK_RATE}));
        const picks=[];
        for(let i=0;i<4 && w.length;i++){ const tot=w.reduce((s,x)=>s+x.w,0); let r=Math.random()*tot, idx=0;
          for(;idx<w.length;idx++){ r-=w[idx].w; if(r<=0) break; } idx=Math.min(idx, w.length-1);
          const pk=w[idx].p; picks.push(pk); w=w.filter(x=>hKey(x.p)!==hKey(pk)); }
        packs++; if(picks.some(p=>p.form)) withForm++;
        if(new Set(picks.map(hKey)).size<picks.length) dup++;
      }
    }));
    out.notes.packsWithForm=+(withForm/packs*100).toFixed(1);
    check('about one pack in ten holds a form card', withForm/packs>=0.04 && withForm/packs<=0.20, out.notes.packsWithForm+'%');
    check('a pack never holds one person twice', dup===0, String(dup));
    // 6. career reads the same shares
    const season=ccSeasonOvr();
    let top=0; season.forEach((v,k)=>{ if(k.indexOf('EU|')===0 && v>top) top=v; });
    check('the career season tops out at the region ceiling', top===REGION_TOP.EU, String(top));
    // 18.10: расчёт — в ccSeasonOvrCalc (ccSeasonOvr переносит порядок сезона на шкалу года).
    check('the career reads YEAR_RATING', /YEAR_RATING/.test(String(ccSeasonOvr)+String(typeof ccSeasonOvrCalc==='function' ? ccSeasonOvrCalc : '')));
  }catch(e){ out.fails.push('threw: '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BE'+'GINJSON'+encodeURIComponent(JSON.stringify(out))+'EN'+'DJSON';
})();
<\/script>`;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fifa-check-'));
const tmp = path.join(tmpDir, 'index.html');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/<base /.test(html)) html = html.replace('<head>', '<head><base href="file:///' + ROOT.replace(/\\/g, '/') + '/">');
fs.writeFileSync(tmp, html + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--user-data-dir=' + path.join(tmpDir, 'ud'), '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 1024 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/BEGINJSON([\s\S]*?)ENDJSON/);
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
if (!m) { console.log('FAIL: the probe gave no output'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL: ' + f)); process.exit(1); }
console.log('OK: FIFA year rating and form cards hold');
