'use strict';
const { PRODUCTS, calculateQuote, calculateVolume } = MonsterMixPricing;
const byId = id => document.getElementById(id);
const moneyFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const volumeFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 });
const money = pence => moneyFormat.format(pence / 100);
const number = value => volumeFormat.format(value);
const form = byId('quote-form');
let currentQuote = null;
let quoteStarted = false;
let imageSequence = 0;
let priceImageFile = null;
let priceImageUrl = null;
function clearPriceImage() {
  imageSequence++;
  priceImageFile = null;
  if (priceImageUrl) URL.revokeObjectURL(priceImageUrl);
  priceImageUrl = null;
  byId('share-image').disabled = true;
  byId('share-image').textContent = 'Preparing image…';
  byId('save-image').hidden = true;
  byId('save-image').removeAttribute('href');
  byId('image-preview').hidden = true;
  byId('image-preview').open = false;
  byId('price-image-preview').removeAttribute('src');
}
async function preparePriceImage(quote) {
  const sequence = imageSequence;
  try {
    const file = await MonsterMixPriceImage.create(quote);
    if (sequence !== imageSequence || quote !== currentQuote) return;
    priceImageFile = file;
    priceImageUrl = URL.createObjectURL(file);
    byId('save-image').href = priceImageUrl;
    byId('save-image').download = file.name;
    byId('save-image').hidden = false;
    byId('price-image-preview').src = priceImageUrl;
    byId('image-preview').hidden = false;
    byId('share-image').textContent = 'Forward as quote';
    byId('share-image').disabled = false;
  } catch (error) {
    if (sequence !== imageSequence || quote !== currentQuote) return;
    byId('share-image').textContent = 'Forward as quote';
    byId('share-image').disabled = false;
    byId('quote-status').textContent = 'Could not prepare the quote image. Tap Forward as quote to try again.';
    console.error('Price image failed:', error);
  }
}
for (const product of PRODUCTS) {
  const option = document.createElement('option');
  option.value = product.id;
  option.textContent = `${product.name} — ${money(product.rate)} / m³`;
  option.defaultSelected = product.id === 'c20';
  byId('product').append(option);
  const row = document.createElement('tr');
  const nameCell = document.createElement('td');
  const rateCell = document.createElement('td');
  nameCell.textContent = product.name;
  rateCell.textContent = money(product.rate);
  row.append(nameCell, rateCell);
  byId('rate-table').append(row);
}
function readNumber(id, label, { positive = false, integer = false, currency = false } = {}) {
  const input = byId(id);
  const value = input.valueAsNumber;
  let message;
  if (!input.value.trim() || !Number.isFinite(value)) message = `Enter ${label}.`;
  else if (positive ? value <= 0 : value < 0) message = `${label} must be ${positive ? 'greater than zero' : 'zero or more'}.`;
  else if (integer && !Number.isSafeInteger(value)) message = `${label} must be a whole number.`;
  else if (currency && Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) message = 'Use up to 2 decimal places for the delivery charge.';
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    const error = new RangeError(message);
    error.input = input;
    throw error;
  }
  input.removeAttribute('aria-invalid');
  return currency ? Math.round(value * 100) : value;
}
function clearErrors() {
  byId('form-error').hidden = true;
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}
function setExtras() {
  for (const [toggle, container, input] of [['customDeliveryToggle', 'delivery-field', 'customDelivery'], ['waitingToggle', 'waiting-field', 'waitingMinutes']]) {
    const enabled = byId(toggle).checked;
    byId(container).hidden = !enabled;
    byId(input).disabled = !enabled;
    byId(input).required = enabled;
  }
}
function renderQuote(quote) {
  byId('quote-empty').hidden = true;
  byId('quote-result').hidden = false;
  byId('quote-description').textContent = `${quote.product.name} · ${number(quote.volume)} m³`;
  byId('quote-rate').textContent = `${number(quote.volume)} m³ × ${money(quote.product.rate)}`;
  byId('delivery-description').textContent = quote.customDelivery ? 'Custom charge' : 'Automatic volume band';
  for (const [id, value] of Object.entries({ 'material-cost': quote.material, 'delivery-cost': quote.delivery, 'pump-cost': quote.pumpCost, 'waiting-cost': quote.waiting, subtotal: quote.subtotal, vat: quote.vat, total: quote.total })) byId(id).textContent = money(value);
  byId('pump-line').hidden = quote.pump === 'none';
  byId('pump-description').textContent = quote.pump === 'long' ? 'Long run pump' : 'Standard pump';
  byId('waiting-line').hidden = quote.waitingMinutes === null;
  byId('waiting-description').textContent = `${quote.waitingMinutes ?? 0} min on site · ${quote.allowance} min included`;
  byId('waiting-hint').textContent = `${quote.allowance} minutes included for this volume. Charges follow the existing waiting-time bands.`;
  preparePriceImage(quote);
}
function updateQuote({ submitted = false } = {}) {
  clearErrors();
  clearPriceImage();
  byId('quote-status').textContent = '';
  try {
    const quote = calculateQuote({
      volume: readNumber('metres', 'Volume', { positive: true }),
      productId: byId('product').value,
      pump: form.querySelector('input[name="pump"]:checked').value,
      customDelivery: byId('customDeliveryToggle').checked ? readNumber('customDelivery', 'Delivery charge', { currency: true }) : null,
      waitingMinutes: byId('waitingToggle').checked ? readNumber('waitingMinutes', 'Time on site', { integer: true }) : null
    });
    currentQuote = quote;
    renderQuote(quote);
    if (submitted) {
      byId('quote-status').textContent = 'Price calculated. Updates as you edit.';
      if (window.matchMedia('(max-width: 760px)').matches) byId('quote-card').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      byId('quote-card').focus({ preventScroll: true });
    }
  } catch (error) {
    currentQuote = null;
    byId('quote-result').hidden = true;
    byId('quote-empty').hidden = false;
    byId('quote-status').textContent = 'Complete the fields to calculate the price.';
    if (submitted) {
      byId('form-error').textContent = error.message;
      byId('form-error').hidden = false;
      error.input?.focus();
    }
  }
}
form.addEventListener('submit', event => { event.preventDefault(); quoteStarted = true; updateQuote({ submitted: true }); });
form.addEventListener('input', event => {
  if (event.target.closest('.dimension-tool')) { byId('dimension-status').textContent = 'Dimensions changed. Use calculated volume to apply them.'; return; }
  setExtras();
  if (quoteStarted) updateQuote();
});
form.addEventListener('change', event => { setExtras(); if (quoteStarted && !event.target.closest('.dimension-tool')) updateQuote(); });
byId('use-volume').addEventListener('click', () => {
  clearErrors();
  try {
    const volume = calculateVolume(['length', 'width', 'depth'].map(id => ({ value: readNumber(id, id[0].toUpperCase() + id.slice(1), { positive: true }), unit: byId(`${id}-unit`).value })));
    byId('metres').value = volume.toFixed(2);
    byId('dimension-status').textContent = `${number(volume)} m³ applied. Rounded to 2 decimal places; no wastage allowance added.`;
    if (quoteStarted) updateQuote();
  } catch (error) { byId('dimension-status').textContent = error.message; error.input?.focus(); }
});
form.addEventListener('reset', () => {
  quoteStarted = false; currentQuote = null;
  clearPriceImage();
  clearErrors();
  byId('quote-result').hidden = true;
  byId('quote-empty').hidden = false;
  byId('quote-status').textContent = '';
  byId('dimension-status').textContent = 'Volume rounds to 2 decimal places. No wastage allowance is added.';
  byId('waiting-hint').textContent = '30 minutes included up to 3 m³; 45 minutes above 3 m³.';
  // Native reset applies defaults after the reset event (and after microtasks in Safari).
  setTimeout(() => { setExtras(); byId('metres').focus(); }, 0);
});
byId('share-image').addEventListener('click', async () => {
  if (!currentQuote) return;
  if (!priceImageFile) { clearPriceImage(); preparePriceImage(currentQuote); return; }
  const file = priceImageFile;
  const sequence = imageSequence;
  const data = { files: [file] };
  byId('share-image').disabled = true;
  try {
    if (!navigator.share || !navigator.canShare || !navigator.canShare(data)) {
      byId('image-preview').open = true;
      byId('quote-status').textContent = 'This browser cannot forward images directly. Touch and hold the preview for your phone’s image options.';
      return;
    }
    // The file is prepared before the tap, preserving mobile share-menu activation.
    await navigator.share(data);
    if (sequence === imageSequence) byId('quote-status').textContent = 'Share menu closed. You can forward the image again if needed.';
  } catch (error) {
    if (sequence !== imageSequence) return;
    if (error.name === 'AbortError') {
      byId('quote-status').textContent = 'Sharing cancelled. The quote is still ready.';
    } else {
      byId('image-preview').open = true;
      byId('quote-status').textContent = 'Sharing was unavailable. Touch and hold the preview for your phone’s image options.';
    }
  } finally {
    if (sequence === imageSequence) byId('share-image').disabled = false;
  }
});
setExtras();
if ('serviceWorker' in navigator) {
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wasControlled) byId('update-notice').hidden = false; });
  byId('refresh-app').addEventListener('click', () => window.location.reload());
  window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js').catch(error => console.error('Offline setup failed:', error)); });
}
