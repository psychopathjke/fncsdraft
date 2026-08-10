// Finds and downloads the art for loot the packs draw but have no picture for,
// then prints the name -> path entries to paste into index.html.
//
//   node tools/check-item-art.js          # says what is missing
//   node tools/fetch-missing-item-art.js  # fetches it
//
// The file name is resolved through the wiki's own API rather than pinned by
// hand: every one of these is an infobox image on the item's page, and asking
// for it survives the wiki renaming a file. Where the page title differs from
// the name the loot pool uses, the page is named here — that part cannot be
// derived, and guessing it downloads the wrong gun.
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'items');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';

// Some of the loot has no picture of its own anywhere on the wiki: the Enhanced
// variants are the base weapon in a different tint, and a mythic named after a
// character is the base gun with a skin. Those take the base weapon's file,
// named here so the substitution is visible rather than buried in a fallback.
const BASE_FILE = {
  "Kor's Deadeye DMR":                  "Deadeye DMR - Weapon - Fortnite.png",
  // The wiki's own infobox for the Baron mythic points at the Mammoth Pistol,
  // which is the gun it is a skin of.
  "Baron's Double Down Pistol":          "Mammoth Pistol - Weapon - Fortnite.png",
  "Brutus' Minigun":                    "Minigun - Weapon - Fortnite.png",
  "Enhanced Holo Twister Assault Rifle":"Holo Twister Assault Rifle - Weapon - Fortnite.png",
  "Enhanced Sentinel Pump Shotgun":     "Sentinel Pump Shotgun - Weapon - Fortnite.png",
  "Enhanced Spire Rifle":               "Spire Rifle - Weapon - Fortnite.png"
};
// loot-pool name -> wiki page (null means the names agree)
const PAGES = {
  "Twin Mag Assault Rifle": null,
  "Collateral Damage Assault Rifle": null,
  "Baron's Double Down Pistol": null,
  "Midas' Gilded Eye Drum Gun": null,
  "Brutus' Minigun": null,
  "Enhanced Holo Twister Assault Rifle": "Enhanced Holo Twister Assault Rifle",
  "Enhanced Sentinel Pump Shotgun": "Enhanced Sentinel Pump Shotgun",
  "Spire Rifle": null,
  "Enhanced Spire Rifle": null,
  "Kor's Deadeye DMR": null,
  "Med-Mist": null,
  // The pool writes the plural; the wiki files it in the singular.
  "Small Fries": "Small Fry"
};
const slug = n => 'itm-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function api(params) {
  const r = await fetch('https://fortnite.fandom.com/api.php?format=json&' + params, {headers: {'User-Agent': UA}});
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function sniff(buf) {
  const h = buf.subarray(0, 12);
  if (h.subarray(0, 4).toString('hex') === '89504e47') return 'png';
  if (h.subarray(0, 4).toString('ascii') === 'RIFF' && h.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (h.subarray(0, 2).toString('hex') === 'ffd8') return 'jpg';
  return null;
}

// Downloads one wiki file and returns the path it was written to.
async function grab(fileTitle, name) {
  const info = await api('action=query&prop=imageinfo&iiprop=url&iiurlwidth=256&titles=' + encodeURIComponent(fileTitle));
  const ip = info.query.pages;
  const first = ip[Object.keys(ip)[0]];
  if (!first || !first.imageinfo) return null;
  const ii = first.imageinfo[0];
  const buf = Buffer.from(await (await fetch(ii.thumburl || ii.url, {headers: {'User-Agent': UA}})).arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return null;
  const rel = 'items/' + slug(name) + '.' + ext;
  fs.writeFileSync(path.join(ROOT, rel), buf);
  return rel;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const out = {};
  for (const name of Object.keys(PAGES)) {
    const page = PAGES[name] || name;
    if (BASE_FILE[name]) {
      const got = await grab('File:' + BASE_FILE[name], name);
      if (got) { out[name] = got; console.error(name.padEnd(38), BASE_FILE[name], '-> ' + got + '  (base weapon)'); }
      else console.error(name.padEnd(38), 'base file missing: ' + BASE_FILE[name]);
      await new Promise(r => setTimeout(r, 150));
      continue;
    }
    // The wiki files an item's picture as "<Name> - Weapon - Fortnite.png" or
    // "... - Item - ...", alongside audio and screenshots, so pick by that shape
    // rather than taking the first file on the page.
    const r = await api('action=query&prop=images&imlimit=500&redirects=1&titles=' + encodeURIComponent(page));
    const pages = r.query && r.query.pages;
    const first = pages && pages[Object.keys(pages)[0]];
    const images = (first && first.images || []).map(i => i.title);
    const norm = t => t.replace(/^File:/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const want = page.toLowerCase().replace(/[^a-z0-9]/g, '');
    const still = images.filter(t => /\.(png|jpe?g|webp)$/i.test(t));
    let file = still.find(t => norm(t) === want + 'weaponfortnitepng')
            || still.find(t => norm(t) === want + 'itemfortnitepng')
            || still.find(t => norm(t).startsWith(want) && /(weapon|item)fortnite/.test(norm(t)))
            || still.find(t => norm(t).startsWith(want));
    if (!file) {
      console.error(name.padEnd(38), 'NO IMAGE on "' + page + '" · files: ' +
                    still.slice(0, 6).map(t => t.replace(/^File:/, '')).join(', '));
      await new Promise(r => setTimeout(r, 200));
      continue;
    }

    const info = await api('action=query&prop=imageinfo&iiprop=url&iiurlwidth=256&titles=' + encodeURIComponent(file));
    const ip = info.query.pages;
    const ii = ip[Object.keys(ip)[0]].imageinfo[0];
    const url = ii.thumburl || ii.url;
    const buf = Buffer.from(await (await fetch(url, {headers: {'User-Agent': UA}})).arrayBuffer());
    const ext = sniff(buf);
    if (!ext) { console.error(name.padEnd(38), 'not an image: ' + url); continue; }
    const rel = 'items/' + slug(name) + '.' + ext;
    fs.writeFileSync(path.join(ROOT, rel), buf);
    out[name] = rel;
    console.error(name.padEnd(38), file.replace(/^File:/, ''), '->', rel, (buf.length / 1024).toFixed(0) + 'kb');
    await new Promise(r => setTimeout(r, 150));
  }
  console.log('const EXTRA_ITEM_ART=' + JSON.stringify(out, null, 1) + ';');
})();
