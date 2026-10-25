// Свой доступ к API Epic для вкладки Competitive (26.10, его выбор: «свой аккаунт Epic»): календарь, выплаты и
// таблицы мест прямо у Epic, без eucompetitive и Tracker.
//
// Вход — device auth отдельного аккаунта Epic. Ключ лежит у него в профиле (~/.fncsdraft/epic-device.json, вне репо,
// на сайт не едет); путь можно переопределить EPIC_DEVICE_AUTH. Получить один раз: node tools/epic-login.js <код>.
// Клиент — fortniteAndroidGameClient (iOS-клиент, привычный для device auth, Epic отключил 26.10).
const fs = require('fs'), path = require('path'), os = require('os');
const CLIENT = '3f69e56c7649492c8cc29f1af08a8a12:b51ee9cb12234f50a69efa67ef53812e';   // fortniteAndroidGameClient: iOS-клиент Epic отключил (26.10, «client has been disabled»)
const BASIC = 'basic ' + Buffer.from(CLIENT).toString('base64');
const ACCOUNT = 'https://account-public-service-prod.ol.epicgames.com/account/api';
const EVENTS = 'https://events-public-service-live.ol.epicgames.com/api/v1';
const DEVICE_FILE = process.env.EPIC_DEVICE_AUTH || path.join(os.homedir(), '.fncsdraft', 'epic-device.json');

async function oauth(body) {
  const r = await fetch(ACCOUNT + '/oauth/token', {
    method: 'POST', headers: { Authorization: BASIC, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Epic oauth: ' + (j.errorMessage || j.errorCode || r.status));
  return j;
}

let TOKEN = null;
async function token() {
  if (TOKEN && TOKEN.until > Date.now() + 60e3) return TOKEN;
  if (!fs.existsSync(DEVICE_FILE)) throw new Error('нет ключа Epic: ' + DEVICE_FILE + ' (node tools/epic-login.js <код>)');
  const d = JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8'));
  const j = await oauth({ grant_type: 'device_auth', account_id: d.accountId, device_id: d.deviceId, secret: d.secret, token_type: 'eg1' });
  TOKEN = { access: j.access_token, accountId: j.account_id, until: Date.parse(j.expires_at) || Date.now() + 3600e3 };
  return TOKEN;
}

async function get(url, tries = 3) {
  for (let a = 0; a < tries; a++) {
    const t = await token();
    const r = await fetch(url, { headers: { Authorization: 'bearer ' + t.access } });
    if (r.ok) return r.json();
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 2000 * (a + 1))); continue; }
    const txt = await r.text();
    throw new Error('Epic ' + r.status + ' ' + url.replace(/\?.*/, '') + ': ' + txt.slice(0, 200));
  }
  throw new Error('Epic: не ответил ' + url.replace(/\?.*/, ''));
}

module.exports = { CLIENT, BASIC, ACCOUNT, EVENTS, DEVICE_FILE, oauth, token, get };
