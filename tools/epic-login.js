// Один раз: меняет код авторизации Epic на постоянный device auth и кладёт его в ~/.fncsdraft/epic-device.json.
//
// 1. Войти на epicgames.com ОТДЕЛЬНЫМ аккаунтом (не основным).
// 2. В том же браузере открыть
//    https://www.epicgames.com/id/api/redirect?clientId=3f69e56c7649492c8cc29f1af08a8a12&responseType=code
//    и скопировать значение "authorizationCode" (живёт ~5 минут, одноразовый).
// 3. node tools/epic-login.js <authorizationCode>
//
// Дальше tools/epic-api.js входит сам. Отозвать ключ: удалить файл и сменить пароль аккаунта.
const fs = require('fs'), path = require('path');
const E = require('./epic-api');

(async () => {
  const code = (process.argv[2] || '').trim().replace(/^"|"$/g, '');
  if (!/^[0-9a-f]{32}$/i.test(code)) {
    console.log('Нужен authorizationCode (32 символа). Открой, войдя в отдельный аккаунт Epic:\n' +
      'https://www.epicgames.com/id/api/redirect?clientId=3f69e56c7649492c8cc29f1af08a8a12&responseType=code');
    process.exit(1);
  }
  const t = await E.oauth({ grant_type: 'authorization_code', code, token_type: 'eg1' });
  const r = await fetch(E.ACCOUNT + '/public/account/' + t.account_id + '/deviceAuth', {
    method: 'POST', headers: { Authorization: 'bearer ' + t.access_token, 'Content-Type': 'application/json' }, body: '{}',
  });
  const d = await r.json();
  if (!r.ok || !d.deviceId) throw new Error('deviceAuth: ' + (d.errorMessage || r.status));
  fs.mkdirSync(path.dirname(E.DEVICE_FILE), { recursive: true });
  fs.writeFileSync(E.DEVICE_FILE, JSON.stringify({ accountId: d.accountId, deviceId: d.deviceId, secret: d.secret, displayName: t.displayName }), { mode: 0o600 });
  console.log('Готово: вход за ' + (t.displayName || t.account_id) + ', ключ в ' + E.DEVICE_FILE);
  const check = await E.token();
  console.log('Проверка входа по ключу: ок (' + check.accountId + ')');
})().catch(e => { console.error(e.message); process.exit(1); });
