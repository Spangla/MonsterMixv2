/* Charges exclude VAT. Money is calculated in integer pence. */
(function (root) {
  'use strict';
  const PRODUCTS = Object.freeze([
    { id: 'c10', name: 'C10', rate: 13500 },
    { id: 'c15', name: 'C15', rate: 13500 },
    { id: 'c20', name: 'C20', rate: 13500 },
    { id: 'c25', name: 'C25', rate: 13500 },
    { id: 'c30', name: 'C30', rate: 14000 },
    { id: 'c35', name: 'C35', rate: 14500 },
    { id: 'c40', name: 'C40', rate: 15000 },
    { id: 'c45', name: 'C45', rate: 17000 },
    { id: 'c50', name: 'C50', rate: 18000 },
    { id: 'c30-no-fines', name: 'C30 no fines', rate: 14500 },
    { id: 'c35-no-fines', name: 'C35 no fines', rate: 14500 }
  ].map(Object.freeze));
  const PUMPS = Object.freeze({ none: 0, standard: 35000, long: 40000 });
  function calculateQuote({ volume, productId, pump = 'none', customDelivery = null, waitingMinutes = null }) {
    if (!Number.isFinite(volume) || volume <= 0) throw new RangeError('Enter a volume greater than zero.');
    const product = PRODUCTS.find(item => item.id === productId);
    if (!product) throw new RangeError('Choose a concrete grade.');
    if (!Object.prototype.hasOwnProperty.call(PUMPS, pump)) throw new RangeError('Choose a pump option.');
    if (customDelivery !== null && (!Number.isSafeInteger(customDelivery) || customDelivery < 0)) throw new RangeError('Enter a delivery charge of zero or more, with up to 2 decimal places.');
    if (waitingMinutes !== null && (!Number.isSafeInteger(waitingMinutes) || waitingMinutes < 0)) throw new RangeError('Enter time on site as zero or more whole minutes.');
    const material = Math.round(volume * product.rate);
    const delivery = customDelivery ?? (volume <= 2 ? 9000 : volume <= 4 ? 8000 : volume <= 6 ? 7000 : volume <= 8 ? 6000 : volume <= 11 ? 5000 : volume <= 30 ? 9000 : 0);
    const allowance = volume <= 3 ? 30 : 45;
    // Existing waiting rule, confirmed by Mike on 28 Oct 2026.
    const waiting = waitingMinutes !== null && waitingMinutes > allowance ? 2500 + Math.floor((waitingMinutes - allowance) / 15) * 2500 : 0;
    const pumpCost = PUMPS[pump];
    const subtotal = material + delivery + pumpCost + waiting;
    const vat = Math.round(subtotal * 0.2);
    const total = subtotal + vat;
    if (![material, delivery, waiting, subtotal, vat, total].every(Number.isSafeInteger)) throw new RangeError('This quantity is too large to calculate. Check your measurements.');
    return Object.freeze({ product, volume, pump, material, delivery, customDelivery: customDelivery !== null, pumpCost, waiting, waitingMinutes, allowance, subtotal, vat, total });
  }
  function calculateVolume(dimensions) {
    const factors = { m: 1, cm: 0.01, mm: 0.001 };
    if (!Array.isArray(dimensions) || dimensions.length !== 3) throw new RangeError('Enter length, width and depth.');
    const volume = dimensions.reduce((result, { value, unit }) => {
      if (!Number.isFinite(value) || value <= 0 || !Object.prototype.hasOwnProperty.call(factors, unit)) throw new RangeError('Enter a positive length, width and depth, with a unit for each.');
      return result * value * factors[unit];
    }, 1);
    const rounded = Math.round((volume + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(rounded) || rounded <= 0) throw new RangeError('The calculated volume is too small or too large. Check the measurements and units.');
    return rounded;
  }
  const api = Object.freeze({ PRODUCTS, calculateQuote, calculateVolume });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MonsterMixPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
