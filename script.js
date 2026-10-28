function calculatem3() {
  const length = parseFloat(document.getElementById("length").value) || 0;
  const width = parseFloat(document.getElementById("width").value) || 0;
  const depth = parseFloat(document.getElementById("depth").value) || 0;

  const volume = length * width * depth;

  if (volume > 0) {
    document.getElementById("metres").value = volume.toFixed(2);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js') // adjust path if needed
      .then(reg => console.log('✅ Service Worker registered:', reg))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
}

function calculate() {
  const metres = parseFloat(document.getElementById("metres").value) || 0;
  const rate = parseFloat(document.getElementById("product").value);

  // Pump checkboxes
  const pumpRequired = document.getElementById("pump").checked;
  const pumpLongRequired = document.getElementById("pumpLong").checked;

  // Custom delivery + waiting time toggles
  const customDeliveryToggle = document.getElementById("customDeliveryToggle").checked;
  const customDelivery = parseFloat(document.getElementById("customDelivery").value) || 0;
  const waitingToggle = document.getElementById("waitingToggle").checked;
  const waitingMinutes = parseInt(document.getElementById("waitingMinutes").value) || 0;

  // Material cost
  let materialCost = metres * rate;

  // 🚚 Updated delivery cost bands (fixed regardless of pump)
  let deliveryCost = 0;
  if (customDeliveryToggle) {
    deliveryCost = customDelivery;
  } else {
    if (metres <= 2) deliveryCost = 90;
    else if (metres <= 4) deliveryCost = 80;
    else if (metres <= 6) deliveryCost = 70;
    else if (metres <= 8) deliveryCost = 60;
    else if (metres <= 11) deliveryCost = 50;
    else if (metres <= 30) deliveryCost = 90;
    else deliveryCost = 0; // Optional: free delivery if >10m³
  }

  // Pump costs
  let pumpCost = pumpRequired ? 350 : 0;
  let pumpCostLong = pumpLongRequired ? 400 : 0;

  // Waiting time
  let waitingCost = 0;
  if (waitingToggle) {
    if (metres <= 3) {
      if (waitingMinutes > 30) {
        waitingCost = 25 + Math.floor((waitingMinutes - 30) / 15) * 25;
      }
    } else {
      if (waitingMinutes > 45) {
        waitingCost = 25 + Math.floor((waitingMinutes - 45) / 15) * 25;
      }
    }
  }

  // Totals
  let subtotal = materialCost + deliveryCost + pumpCost + pumpCostLong + waitingCost;
  let vat = subtotal * 0.2;
  let total = subtotal + vat;

  // Display receipt
  let results = "----------------------------\n";
  results += `Material Cost: £${materialCost.toFixed(2)}\n`;
  results += `Delivery: £${deliveryCost.toFixed(2)}\n`;
  if (pumpRequired) results += `Pump: £${pumpCost.toFixed(2)}\n`;
  if (pumpLongRequired) results += `Long Run: £${pumpCostLong.toFixed(2)}\n`;
  if (waitingToggle) results += `Waiting Time: £${waitingCost.toFixed(2)}\n`;
  results += `Subtotal: £${subtotal.toFixed(2)}\n`;
  results += `VAT: £${vat.toFixed(2)}\n`;
  results += `Total: £${total.toFixed(2)}\n`;
  results += "----------------------------";

  document.getElementById("results").textContent = results;
}

// Toggle custom delivery visibility
document.getElementById("customDeliveryToggle").addEventListener("change", function () {
  document.getElementById("customDelivery").style.display = this.checked ? "block" : "none";
});

// Toggle waiting time visibility
document.getElementById("waitingToggle").addEventListener("change", function () {
  document.getElementById("waitingMinutes").style.display = this.checked ? "block" : "none";
});

// Ensure only one pump type can be active
document.getElementById("pump").addEventListener("change", function () {
  if (this.checked) {
    document.getElementById("pumpLong").checked = false;
  }
});
document.getElementById("pumpLong").addEventListener("change", function () {
  if (this.checked) {
    document.getElementById("pump").checked = false;
  }
});
