// Призовые за всё время для «Больше или меньше»: Liquipedia Portal:Statistics/Player_earnings и /Team_earnings.
// Скачать (между запросами 30 с, правило parse у Liquipedia):
//   curl --compressed -A "fncsdraft-stats/1.0" "https://liquipedia.net/fortnite/api.php?action=parse&page=Portal:Statistics/Player_earnings&prop=text&format=json" -o pe.json
//   curl --compressed -A "fncsdraft-stats/1.0" "https://liquipedia.net/fortnite/api.php?action=parse&page=Portal:Statistics/Team_earnings&prop=text&format=json" -o te.json
// node tools/build-hl-alltime.js pe.json te.json  → переписывает строки HL_ALL_P / HL_ALL_T / HL_ALL_AT в index.html.
const fs=require('fs'), path=require('path');
const [pe, te]=process.argv.slice(2);
if(!pe || !te){ console.error('usage: build-hl-alltime.js pe.json te.json'); process.exit(1); }
const html=f=>JSON.parse(fs.readFileSync(f, 'utf8')).parse.text['*'];
const txt=s=>s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
function rows(h){
  return (h.match(/<tr class="table2&#95;&#95;row--body"[\s\S]*?<\/tr>/g)||[]).map(tr=>{
    const name=(tr.match(/<span class="name"[^>]*>([\s\S]*?)<\/span>/)||[])[1];
    const money=(tr.match(/\$([\d,]+)<\/td>/)||[])[1];
    const flag=(tr.match(/class="flag"><img[^>]*src="[^"]*\/([A-Za-z]{2})_hd\.png/)||[])[1];
    return name && money ? {n:txt(name), e:+money.replace(/,/g, ''), c:flag ? flag.toLowerCase() : ''} : null;
  }).filter(Boolean);
}
const P=rows(html(pe)).filter(r=>r.e>=20000);
const T=rows(html(te)).filter(r=>r.e>=20000).map(r=>({n:r.n, e:r.e}));
const seen=new Set(); const uniq=a=>a.filter(r=>{ const k=r.n.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
const p=uniq(P); seen.clear(); const t=uniq(T);
const file=path.join(__dirname, '..', 'index.html');
let s=fs.readFileSync(file, 'utf8');
const at=new Date().toISOString().slice(0, 10);
const put=(re, line)=>{ if(!re.test(s)) throw new Error('нет строки '+re); s=s.replace(re, ()=>line); };
put(/^const HL_ALL_P=.*$/m, 'const HL_ALL_P='+JSON.stringify(p)+';');
put(/^const HL_ALL_T=.*$/m, 'const HL_ALL_T='+JSON.stringify(t)+';');
put(/^const HL_ALL_AT=.*$/m, "const HL_ALL_AT='"+at+"';");
fs.writeFileSync(file, s);
console.log('players', p.length, 'teams', t.length, 'top', p[0], t[0]);
