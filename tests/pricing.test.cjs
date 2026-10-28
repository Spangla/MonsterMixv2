const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTS, calculateQuote, calculateVolume } = require('../pricing.js');
const quote = overrides => calculateQuote({ volume: 1, productId: 'c20', ...overrides });

test('all eleven grades match the supplied price list', () => {
  const expected = { c10: 13500, c15: 13500, c20: 13500, c25: 13500, c30: 14000, c35: 14500, c40: 15000, c45: 17000, c50: 18000, 'c30-no-fines': 14500, 'c35-no-fines': 14500 };
  assert.equal(PRODUCTS.length, 11);
  for (const [productId, price] of Object.entries(expected)) assert.equal(quote({ productId }).material, price);
});
test('delivery bands preserve every boundary, including free delivery over 30', () => {
  for (const [volume, price] of [[0.1,9000], [2,9000], [2.001,8000], [4,8000], [4.001,7000], [6,7000], [6.001,6000], [8,6000], [8.001,5000], [11,5000], [11.001,9000], [30,9000], [30.001,0]]) assert.equal(quote({ volume }).delivery, price);
});
test('waiting charges preserve confirmed boundaries for both volume allowances', () => {
  for (const [volume, allowance] of [[3,30], [3.001,45]]) {
    for (const [extra, cost] of [[0,0], [1,2500], [14,2500], [15,5000], [29,5000], [30,7500]]) assert.equal(quote({ volume, waitingMinutes: allowance + extra }).waiting, cost);
  }
});
test('full C50 example includes delivery, long run, waiting and VAT', () => {
  const result = quote({ volume: 5, productId: 'c50', pump: 'long', waitingMinutes: 60 });
  assert.deepEqual([result.material,result.delivery,result.pumpCost,result.waiting,result.subtotal,result.vat,result.total], [90000,7000,40000,5000,142000,28400,170400]);
});
test('standard pump and zero/custom delivery overrides', () => {
  assert.equal(quote({ pump: 'standard' }).pumpCost, 35000);
  assert.equal(quote({ customDelivery: 0 }).delivery, 0);
  assert.equal(quote({ customDelivery: 12345 }).delivery, 12345);
  assert.equal(quote({ volume: 4.5, productId: 'c45', pump: 'standard' }).total, 142200);
});
test('money rounds at line item and VAT level to whole pence', () => {
  const result = quote({ volume: 1.2345, productId: 'c35', customDelivery: 1234 });
  assert.equal(result.material, 17900);
  assert.equal(result.subtotal, 19134);
  assert.equal(result.vat, 3827);
  assert.equal(result.total, 22961);
});
test('invalid quantities and charges cannot produce a quote', () => {
  for (const volume of [0,-1,NaN,Infinity,Number.MAX_VALUE]) assert.throws(() => quote({ volume }), RangeError);
  for (const waitingMinutes of [-1,0.5,NaN,Infinity]) assert.throws(() => quote({ waitingMinutes }), RangeError);
  for (const customDelivery of [-1,0.5,NaN,Infinity]) assert.throws(() => quote({ customDelivery }), RangeError);
  assert.throws(() => quote({ productId: 'unknown' }), RangeError);
  assert.throws(() => quote({ pump: 'both' }), RangeError);
});
test('mixed measurement units and rounding are explicit', () => {
  assert.equal(calculateVolume([{ value: 5, unit: 'm' },{ value: 400, unit: 'cm' },{ value: 150, unit: 'mm' }]), 3);
  assert.equal(calculateVolume([{ value: 1, unit: 'm' },{ value: 1, unit: 'm' },{ value: 125, unit: 'mm' }]), 0.13);
  assert.throws(() => calculateVolume([{ value: 0, unit: 'm' },{ value: 1, unit: 'm' },{ value: 1, unit: 'm' }]), RangeError);
  assert.throws(() => calculateVolume([{ value: 1, unit: 'feet' },{ value: 1, unit: 'm' },{ value: 1, unit: 'm' }]), RangeError);
});
