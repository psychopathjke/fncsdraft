// Birthdays for the roster, read off Liquipedia and ProSettings, checked
// against the card.
//
// The roster knows what everybody did and nothing about who they are, and an age
// is the one fact that changes how a result reads - this scene is won by
// teenagers and the number is most of the story.
//
// Two sources, in this order:
//
//   1. Liquipedia's MediaWiki API, which returns the infobox as wikitext, so the
//      birthday and the country come out as fields rather than as a sentence to
//      be parsed. It is the better source and it covers the people ProSettings
//      does not. It refuses a plain request - 403 on the page, 406 on the API -
//      and answers a descriptive User-Agent that also accepts gzip, which is
//      what their terms ask for. Their terms also ask for two seconds between
//      parse calls, and this waits them.
//   2. ProSettings, which has the well-known players and a page per slug.
//
// The check is the point and it is why this is a tool rather than a paste.
// Liquipedia has a Focus from Australia and this roster's Focus is Israeli;
// ProSettings has a Chap from the United States and this roster's Chap is Swiss.
// A handle is not a person, and a birthday pasted in off a name match is worse
// than no birthday at all. Only rows whose country agrees are offered.
//
//   node tools/fetch-player-dob.js                 # the top 60 EU cards
//   node tools/fetch-player-dob.js 60-160          # a slice of the same order
//   node tools/fetch-player-dob.js Sky Scroll Kami # named handles
//
// Paste the OK block into CC_BORN in index.html.
const fs = require('fs'), os = require('os'), path = require('path');
const https = require('https'), zlib = require('zlib');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Who to ask about, and what the card says their country is. Read out of the
// page itself so the list is the roster's rather than a copy of it.
function roster(names, slice) {
  const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={list:[],err:null};
  try{
    const want=${JSON.stringify(names.map(n => n.toLowerCase()))};
    const slice=${JSON.stringify(slice || null)};
    let all=careerRosterNowEU().slice().sort((a,b)=>b._ovr-a._ovr);
    if(want.length) all=all.filter(p=>want.indexOf(String(p.handle).toLowerCase())>=0);
    else all=slice ? all.slice(slice[0], slice[1]) : all.slice(0,60);
    out.list=all.map(p=>({h:p.handle, o:p._ovr, nat:p.nat||'', born:ccBornOf(p.handle)}));
  }catch(e){out.err=String(e&&e.stack||e);}
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dob-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, src + BOOT);
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
    'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) throw new Error('could not read the roster out of the page');
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.err) throw new Error(out.err);
  return out.list;
}

const UA = 'fncsdraft-career-tool/1.0 (hobby project; keegorka@gmail.com)';
const get = url => new Promise(resolve => {
  https.get(url, {headers: {'user-agent': UA, 'accept-encoding': 'gzip'}}, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      let buf = Buffer.concat(chunks);
      if ((res.headers['content-encoding'] || '').indexOf('gzip') >= 0) {
        try { buf = zlib.gunzipSync(buf); } catch (e) {}
      }
      resolve({s: res.statusCode, b: buf.toString('utf8')});
    });
  }).on('error', () => resolve({s: 0, b: ''}));
});
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---- Liquipedia -------------------------------------------------------------
// redirects=1 because half the handles are redirects to a disambiguated title.
const LP = p => 'https://liquipedia.net/fortnite/api.php?action=parse&format=json' +
                '&prop=wikitext&redirects=1&page=' + encodeURIComponent(p);
async function liquipedia(handle) {
  const r = await get(LP(handle));
  if (r.s !== 200) return null;
  let w = '';
  try { w = (JSON.parse(r.b).parse || {}).wikitext['*'] || ''; } catch (e) { return null; }
  const dob = (w.match(/\|\s*birth_date\s*=\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) || [])[1];
  const country = (w.match(/\|\s*country\s*=\s*([A-Za-z .'-]+)/i) || [])[1];
  if (!dob) return null;
  return {dob: dob, country: (country || '').trim(), src: 'liquipedia'};
}

// ---- ProSettings ------------------------------------------------------------
const MONTHS = ['january','february','march','april','may','june','july','august',
                'september','october','november','december'];
async function prosettings(handle) {
  const slug = String(handle).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const r = await get('https://prosettings.net/players/' + slug + '/');
  if (r.s !== 200) return null;
  const t = r.b.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const m = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1].toLowerCase()) + 1;
  const c = t.match(/professional Fortnite player from ([A-Za-z .'-]+?)(?: who|\.|,)/i);
  return {dob: m[3] + '-' + String(mo).padStart(2, '0') + '-' + String(+m[2]).padStart(2, '0'),
          country: c ? c[1].trim() : '', src: 'prosettings'};
}

// The roster spells countries in Russian; both sources in English. Only the ones
// this list can translate are checkable, and anything it cannot read is reported
// rather than assumed to agree.
const NAT_EN = {
  'Дания':'denmark', 'Швеция':'sweden', 'Норвегия':'norway', 'Финляндия':'finland',
  'Германия':'germany', 'Франция':'france', 'Италия':'italy', 'Испания':'spain',
  'Польша':'poland', 'Россия':'russia', 'Украина':'ukraine', 'Нидерланды':'netherlands',
  'Бельгия':'belgium', 'Австрия':'austria', 'Швейцария':'switzerland',
  // The home nations answer to two names each: the roster says Шотландия, and
  // Liquipedia says Scotland where ProSettings says the United Kingdom. Both are
  // the same person, so both count.
  'Великобритания':['united kingdom','england','scotland','wales'],
  'Шотландия':['united kingdom','scotland'],
  'Англия':['united kingdom','england'], 'Уэльс':['united kingdom','wales'],
  'Северная Ирландия':['united kingdom','northern ireland'],
  'Ирландия':'ireland', 'Португалия':'portugal', 'Чехия':'czech', 'Словения':'slovenia',
  'Словакия':'slovakia', 'Хорватия':'croatia', 'Сербия':'serbia', 'Румыния':'romania',
  'Болгария':'bulgaria', 'Греция':'greece', 'Венгрия':'hungary', 'Турция':'turkey',
  'Израиль':'israel', 'Латвия':'latvia', 'Литва':'lithuania', 'Эстония':'estonia',
  'Исландия':'iceland', 'Беларусь':'belarus', 'Молдова':'moldova', 'Кипр':'cyprus',
  'Мальта':'malta', 'Люксембург':'luxembourg', 'Андорра':'andorra',
  'Черногория':'montenegro', 'Албания':'albania', 'Босния':'bosnia',
  'Северная Македония':'macedonia', 'Македония':'macedonia', 'Косово':'kosovo',
  'Грузия':'georgia', 'Армения':'armenia', 'Азербайджан':'azerbaijan',
  'Казахстан':'kazakhstan', 'США':'united states', 'Канада':'canada',
  'Австралия':'australia', 'Новая Зеландия':'new zealand', 'Бразилия':'brazil',
  'Мексика':'mexico', 'Аргентина':'argentina', 'Япония':'japan',
  'Южная Корея':'korea', 'Корея':'korea', 'Китай':'china'
};

(async () => {
  let names = process.argv.slice(2), slice = null;
  const range = names[0] && names[0].match(/^([0-9]+)-([0-9]+)$/);
  if (range) { slice = [+range[1], +range[2]]; names = []; }
  const list = roster(names, slice);
  const ok = [], mismatch = [], missing = [], already = [];
  for (const p of list) {
    if (p.born) { already.push(p.h); continue; }
    let hit = await liquipedia(p.h);
    await wait(2000);                       // their terms: two seconds per parse
    if (!hit) { hit = await prosettings(p.h); }
    if (!hit) { missing.push(p.h); continue; }
    // A country can answer to more than one name, so the table holds either a
    // string or a list of them.
    const want = NAT_EN[p.nat];
    const names = want == null ? [] : (Array.isArray(want) ? want : [want]);
    const said = hit.country.toLowerCase();
    const same = names.some(n => said.indexOf(n) >= 0);
    if (same) ok.push({h: p.h, key: String(p.h).toLowerCase(), dob: hit.dob,
                       country: hit.country, src: hit.src});
    else mismatch.push(p.h + ': card says ' + (p.nat || '(none)') +
                       ', ' + hit.src + ' says ' + (hit.country || '?'));
  }
  console.log('asked about ' + list.length + ', already known ' + already.length);
  console.log('\ncountry agrees - paste these into CC_BORN:');
  ok.forEach(r => {
    // A key that is not an identifier has to be quoted.
    const k = /^[a-z_$][a-z0-9_$]*$/.test(r.key) ? r.key : "'" + r.key + "'";
    console.log('  ' + k + ":'" + r.dob + "',   // " + r.h + ' - ' + r.country + ' (' + r.src + ')');
  });
  if (mismatch.length) {
    console.log('\ncountry disagrees - NOT a birthday for this card:');
    mismatch.forEach(s => console.log('  ' + s));
  }
  console.log('\nnothing anywhere: ' + missing.length +
              (missing.length ? ' (' + missing.slice(0, 40).join(', ') +
               (missing.length > 40 ? ', ...' : '') + ')' : ''));
})();
