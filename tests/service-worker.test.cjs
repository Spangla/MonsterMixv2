const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../service-worker.js'), 'utf8');
function setup() {
  const handlers = {};
  const state = { deleted:[], assets:[], opened:[], claimed:false, skipped:false };
  vm.runInNewContext(source, {
    Request, URL,
    self: {
      registration:{ scope:'https://spangla.github.io/MonsterMixv2/' },
      addEventListener:(name, fn) => handlers[name] = fn,
      skipWaiting:async () => { state.skipped = true; },
      clients:{ claim:async () => { state.claimed = true; } }
    },
    caches: {
      keys:async () => ['Testbedbeta-v3','unrelated','MonsterMixv2-v10','MonsterMixv2-v11'],
      delete:async key => state.deleted.push(key),
      open:async name => {
        state.opened.push(name);
        return { addAll:async assets => state.assets = Array.from(assets), match:async () => 'cached' };
      }
    },
    fetch:async () => 'network'
  });
  return { handlers, state };
}
test('install caches all referenced assets including pricing before activating', async () => {
  const { handlers, state } = setup(); let pending;
  handlers.install({ waitUntil:p => pending = p }); await pending;
  assert.ok(state.assets.some(asset => new URL(asset.url).pathname.endsWith('/pricing.js')));
  for (const asset of state.assets) {
    assert.equal(asset.cache,'reload','updates must bypass the HTTP cache');
    const file = new URL(asset.url).pathname.replace('/MonsterMixv2/','');
    if (file) assert.ok(fs.existsSync(path.join(__dirname,'..',file)));
  }
  assert.equal(state.skipped,true);
});
test('activation deletes only old V2 caches and preserves the live app', async () => {
  const { handlers, state } = setup(); let pending;
  handlers.activate({ waitUntil:p => pending = p }); await pending;
  assert.deepEqual(state.deleted,['MonsterMixv2-v10']);
  assert.equal(state.claimed,true);
});
test('every initial page asset matches a precached URL, including query versions', async () => {
  const {handlers,state} = setup(); let pending;
  handlers.install({waitUntil:p => pending=p}); await pending;
  const cached = new Set(state.assets.map(asset => asset.url));
  const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    assert.ok(cached.has(new URL(match[1],'https://spangla.github.io/MonsterMixv2/').href),`Not precached: ${match[1]}`);
  }
});
test('fetch serves its own cache and ignores other apps and non-GET requests', async () => {
  const { handlers, state } = setup(); let pending;
  handlers.fetch({ request:{ method:'GET',url:'https://spangla.github.io/MonsterMixv2/' },respondWith:p => pending = p });
  assert.equal(await pending,'cached');
  assert.deepEqual(state.opened,['MonsterMixv2-v11']);
  for (const request of [{ method:'GET',url:'https://spangla.github.io/Testbedbeta/' },{ method:'POST',url:'https://spangla.github.io/MonsterMixv2/' }]) handlers.fetch({ request,respondWith:() => assert.fail('intercepted unrelated request') });
});
