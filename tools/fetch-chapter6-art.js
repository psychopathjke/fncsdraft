// Downloads the Chapter 6 item art from the Fortnite Wiki into items/ and
// prints the name -> path map to paste into index.html.
// Names on the left are the ones the loot pool uses; the wiki's own spelling
// differs in places (Medkit, Shield Potion (v11.00)), which is why the URL is
// pinned rather than derived from the name.
const fs = require('fs'), path = require('path'), https = require('https');

const ROOT = path.join(process.env.USERPROFILE, 'Desktop', 'fncsdraftmajor');
const OUT = path.join(ROOT, 'items');

const ART = {
  "Fury Assault Rifle":        "5/52/Fury_Assault_Rifle_-_Weapon_-_Fortnite.png",
  "Holo Twister Assault Rifle":"0/03/Holo_Twister_Assault_Rifle_-_Weapon_-_Fortnite.png",
  "Ranger Assault Rifle":      "d/de/Ranger_Assault_Rifle_-_Weapon_-_Fortnite.png",
  "Sentinel Pump Shotgun":     "2/24/Sentinel_Pump_Shotgun_-_Weapon_-_Fortnite.png",
  "Oni Shotgun":               "e/e0/Oni_Shotgun_-_Weapon_-_Fortnite.png",
  "Twinfire Auto Shotgun":     "6/61/Twinfire_Auto_Shotgun_-_Weapon_-_Fortnite.png",
  "Veiled Precision SMG":      "f/f2/Veiled_Precision_SMG_-_Weapon_-_Fortnite.png",
  "Surgefire SMG":             "1/17/Surgefire_SMG_-_Weapon_-_Fortnite.png",
  "Suppressed Pistol":         "d/de/Suppressed_Pistol_-_Weapon_-_Fortnite.png",
  "Lock On Pistol":            "e/eb/Lock_On_Pistol_-_Weapon_-_Fortnite.png",
  "Hunting Rifle":             "5/53/Hunting_Rifle_-_Weapon_-_Fortnite.png",
  "Rail Gun":                  "d/da/Rail_Gun_-_Weapon_-_Fortnite.png",
  "Explosive Repeater Rifle":  "7/77/Explosive_Repeater_Rifle_-_Weapon_-_Fortnite.png",
  "Typhoon Blade":             "2/2a/Typhoon_Blade_-_Weapon_-_Fortnite.png",
  "Kinetic Blade":             "f/f1/Kinetic_Blade_-_Weapon_-_Fortnite.png",
  "Void Oni Mask":             "d/db/Void_Oni_Mask_-_Item_-_Fortnite.png",
  "Fire Oni Mask":             "1/16/Fire_Oni_Mask_-_Item_-_Fortnite.png",
  "Shockwave Grenade":         "1/1c/Shockwave_Grenade_-_Item_-_Fortnite.png",
  "Shield Bubble":             "5/53/Shield_Bubble_-_Item_-_Fortnite.png",
  "Port-A-Bunker":             "6/67/Port-A-Bunker_-_Item_-_Fortnite.png",
  "Big Bush Bomb":             "c/c4/Big_Bush_Bomb_-_Item_-_Fortnite.png",
  "Shield Keg":                "5/5a/Shield_Keg_-_Item_-_Fortnite.png",
  "Chug Splash":               "7/73/Chug_Splash_-_Item_-_Fortnite.png",
  "Med Kit":                   "b/b1/Medkit_-_Item_-_Fortnite.png",
  "Shield Potion":             "9/90/Shield_Potion_%28v11.00%29_-_Item_-_Fortnite.png",
  "Small Shield Potion":       "4/44/Small_Shield_Potion_%28v11.00%29_-_Item_-_Fortnite.png"
};

const slug = (n, ext) => 't1-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.' + ext;

// The CDN answers the scaled variant in WebP rather than PNG, so the extension
// is taken from the bytes instead of from what the URL looks like.
function sniff(buf){
  const h = buf.slice(0, 12);
  if (h.slice(0, 4).toString('hex') === '89504e47') return 'png';
  if (h.slice(0, 4).toString('ascii') === 'RIFF' && h.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (h.slice(0, 2).toString('hex') === 'ffd8') return 'jpg';
  return null;
}

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (fncsdraft asset fetch)', 'Accept': 'image/*' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

(async () => {
  const map = {};
  let ok = 0, failed = [];
  for (const name of Object.keys(ART)) {
    const url = 'https://static.wikia.nocookie.net/fortnite/images/' + ART[name] + '/revision/latest/scale-to-width-down/256';
    try {
      const buf = await get(url);
      const ext = sniff(buf);
      if (buf.length < 400 || !ext) throw new Error('not an image (' + buf.length + ' bytes)');
      const file = slug(name, ext);
      fs.writeFileSync(path.join(OUT, file), buf);
      map[name] = 'items/' + file;
      ok++;
      process.stderr.write('.');
    } catch (e) {
      failed.push(name + ': ' + e.message);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  process.stderr.write('\n');
  console.error('downloaded ' + ok + '/' + Object.keys(ART).length);
  failed.forEach(f => console.error('  FAILED ' + f));
  console.log('const T1_ART={');
  console.log(Object.keys(map).map(n => '  ' + JSON.stringify(n) + ':' + JSON.stringify(map[n])).join(',\n'));
  console.log('};');
})();
