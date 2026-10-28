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
    self: {
      registration:{ scope:'https://spangla.github.io/MonsterMixv2/' },
      addEventListener:(name, fn) => handlers[name] = fn,
      skipWaiting:async () => { state.skipped = true; },
      clients:{ claim:async () => { state.claimed = true; } }
    },
    caches: {
      keys:async () => ['Testbedbeta-v3','unrelated','MonsterMixv2-v4','MonsterMixv2-v5'],
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
  assert.ok(state.assets.includes('./pricing.js'));
  for (const asset of state.assets) if (asset !== './') assert.ok(fs.existsSync(path.join(__dirname,'..',asset)));
  assert.equal(state.skipped,true);
});
test('activation deletes only old V2 caches and preserves the live app', async () => {
  const { handlers, state } = setup(); let pending;
  handlers.activate({ waitUntil:p => pending = p }); await pending;
  assert.deepEqual(state.deleted,['MonsterMixv2-v4']);
  assert.equal(state.claimed,true);
});
test('fetch serves its own cache and ignores other apps and non-GET requests', async () => {
  const { handlers, state } = setup(); let pending;
  handlers.fetch({ request:{ method:'GET',url:'https://spangla.github.io/MonsterMixv2/' },respondWith:p => pending = p });
  assert.equal(await pending,'cached');
  assert.deepEqual(state.opened,['MonsterMixv2-v5']);
  for (const request of [{ method:'GET',url:'https://spangla.github.io/Testbedbeta/' },{ method:'POST',url:'https://spangla.github.io/MonsterMixv2/' }]) handlers.fetch({ request,respondWith:() => assert.fail('intercepted unrelated request') });
});
