/* Draw the price breakdown locally: no uploads, external fonts or screenshot library. */
(function (root) {
  'use strict';
  const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  const volumeFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 });
  const money = value => currency.format(value / 100);
  let logoPromise;
  function loadLogo() {
    if (!logoPromise) {
      logoPromise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => { logoPromise = null; reject(new Error('Company logo could not be loaded.')); };
        image.src = './icon-512-beta.png';
      });
    }
    return logoPromise;
  }
  function fitText(context, text, x, y, maxWidth, size, weight = 400, align = 'left') {
    context.textAlign = align;
    context.font = `${weight} ${size}px Arial, sans-serif`;
    while (context.measureText(text).width > maxWidth && size > 12) {
      size--;
      context.font = `${weight} ${size}px Arial, sans-serif`;
    }
    context.fillText(text, x, y);
  }
  async function create(quote) {
    const logo = await loadLogo();
    const lines = [
      { label: 'Concrete', detail: `${volumeFormat.format(quote.volume)} m³ × ${money(quote.product.rate)} / m³`, amount: quote.material },
      { label: 'Delivery', amount: quote.delivery }
    ];
    if (quote.pump !== 'none') lines.push({ label: quote.pump === 'long' ? 'Long run pump' : 'Standard pump', amount: quote.pumpCost });
    if (quote.waitingMinutes !== null) lines.push({ label: 'Waiting time', detail: `${quote.waitingMinutes} minutes on site · ${quote.allowance} included`, amount: quote.waiting });
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 860 + lines.length * 100;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image creation is unavailable.');
    const width = canvas.width;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, canvas.height);
    context.fillStyle = '#003366';
    context.fillRect(0, 0, width, 224);
    context.drawImage(logo, 48, 16, 192, 192);
    context.fillStyle = '#ffffff';
    fitText(context, 'CONCRETE & PUMPS', 288, 84, 720, 25, 700);
    fitText(context, 'Price breakdown', 288, 144, 720, 46, 700);
    context.fillStyle = '#075188';
    context.fillRect(0, 224, width, 8);
    context.fillStyle = '#003366';
    fitText(context, `${quote.product.name} · ${volumeFormat.format(quote.volume)} m³`, 64, 308, 952, 36, 700);
    context.fillStyle = '#536d80';
    fitText(context, 'All line items below exclude VAT', 64, 354, 952, 24);
    let y = 408;
    for (const line of lines) {
      context.fillStyle = '#16364e';
      fitText(context, line.label, 64, y + 28, 490, 30, 600);
      fitText(context, money(line.amount), width - 64, y + 28, 400, 32, 700, 'right');
      if (line.detail) {
        context.fillStyle = '#536d80';
        fitText(context, line.detail, 64, y + 68, 952, 24);
      }
      y += 100;
    }
    context.fillStyle = '#d4e0eb';
    context.fillRect(64, y, width - 128, 2);
    context.fillStyle = '#16364e';
    fitText(context, 'Subtotal', 64, y + 58, 400, 30, 600);
    fitText(context, money(quote.subtotal), width - 64, y + 58, 500, 32, 700, 'right');
    fitText(context, 'VAT (20%)', 64, y + 116, 400, 30);
    fitText(context, money(quote.vat), width - 64, y + 116, 500, 32, 600, 'right');
    context.fillStyle = '#003366';
    context.fillRect(48, y + 154, width - 96, 152);
    context.fillStyle = '#ffffff';
    fitText(context, 'TOTAL', 76, y + 212, 250, 26, 700);
    fitText(context, 'including VAT', 76, y + 260, 250, 24);
    fitText(context, money(quote.total), width - 76, y + 254, 650, 68, 700, 'right');
    context.fillStyle = '#536d80';
    fitText(context, 'V2 TEST CALCULATION', 64, y + 359, 952, 23, 700);
    fitText(context, 'Not a payment receipt', 64, y + 398, 952, 23);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image creation failed.')), 'image/png'));
    return new File([blob], `MonsterMix-price-${quote.product.id}-${quote.volume}m3.png`, { type: 'image/png' });
  }
  root.MonsterMixPriceImage = Object.freeze({ create });
})(globalThis);
