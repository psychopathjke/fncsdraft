// What the money just put in reach, on the front page.
//
// The mark for a newly affordable item was a dot on the shop tab, which is a
// notification and not an offer: it says something changed and makes you go and
// find out what. What makes somebody open a shop is seeing the thing.
//
// What this holds: the tile appears on the main screen when something new is
// affordable and not before, it shows the best of them with the photo and what
// it does, pressing it opens the shop, and looking is what clears it.
//
//   node tools/check-career-peek.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (balance, seen) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:78, role:'roleIGL',
              attrs:ccRookieAttrs(78,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-04', division:2, earnings:balance, balance:balance,
              reach:5000, tokens:[], log:[], news:[], shopSeen:seen||0},
      partner:null
    }));
    careerEntry();
  };
  try {
    // ---- nothing new, nothing on the screen ------------------------------
    seed(0, 0);
    check('a career with no money is shown no window', careerShopPeek() === null);
    check('and the tile is not drawn', careerShopPeekHTML() === '');
    // Money that has already been looked at is not new either.
    seed(5000, 5000);
    check('money already seen is not news', careerShopPeek() === null,
          JSON.stringify(careerShopPeek()));

    // ---- a payday puts something in the window ---------------------------
    seed(500, 0);
    const peek = careerShopPeek();
    out.notes.peek = peek && {id: peek.item.id, cost: peek.item.cost, more: peek.more};
    check('a balance that reaches something shows it', !!peek);
    check('and it is the best of what is affordable',
          peek && !careerShopNew().some(i => i.cost > peek.item.cost),
          peek && String(peek.item.cost));
    check('nothing over the balance is offered',
          peek && peek.item.cost <= CAREER.career.balance,
          peek && (peek.item.cost + ' / ' + CAREER.career.balance));

    // ---- what the tile carries -------------------------------------------
    const html = careerShopPeekHTML();
    out.notes.html = html.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 120);
    check('the tile is the button', /^<button class="ch-tile cc-peek"/.test(html));
    check('pressing it opens the shop', /onclick="careerTab\\('shop'\\)"/.test(html));
    check('it is marked NEW', html.indexOf(L().ccShopNew) >= 0);
    check('it shows the product photo',
          html.indexOf('src="' + CC_DEVICE_DIR) >= 0 || !peek.item.img,
          peek.item.img || 'no image on this item');
    check('it names the thing', html.indexOf(L()['ccShop' + peek.item.id]) >= 0);
    check('it says what the thing does',
          html.indexOf(L().ccShopTrain) >= 0 || html.indexOf(L().ccShopCap) >= 0);
    check('and it prices it against the balance',
          html.indexOf('$' + peek.item.cost.toLocaleString('en-US')) >= 0 &&
          html.indexOf(CAREER.career.balance.toLocaleString('en-US')) >= 0);
    check('the badge is not the word undefined', !/undefined/.test(html),
          html.slice(0, 80));

    // ---- it is on the main screen ----------------------------------------
    careerTab('centre');
    const onHub = document.querySelector('#chBody .cc-peek');
    out.notes.onHub = !!onHub;
    check('the window is on the career main screen', !!onHub);

    // ---- looking is what clears it ---------------------------------------
    careerTab('shop');
    careerTab('centre');
    out.notes.after = !!careerShopPeek();
    check('opening the shop clears the window', careerShopPeek() === null);
    check('and the main screen stops drawing it',
          !document.querySelector('#chBody .cc-peek'));
    // Until the balance passes something new again.
    CAREER.career.balance = 3000;
    check('a bigger payday opens it again', !!careerShopPeek(),
          JSON.stringify(careerShopPeek() && careerShopPeek().item.id));

    // ---- something already owned never comes back ------------------------
    const now = careerShopPeek().item;
    CAREER.gear = {own: CC_SHOP.map(i => i.id), train: 0};
    check('a desk that is already bought has nothing to offer',
          careerShopPeek() === null, now.id);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncspeek-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the money puts something in the window, and the window opens the shop');
fs.rmSync(dir, { recursive: true, force: true });
