const moduleData = {
  spritz:     { icon: 'icon-spritz',     name: 'Spritz Bottle',    price: 4.99 },
  applicator: { icon: 'icon-applicator', name: 'Tube Applicator',  price: 3.99 },
  pump:       { icon: 'icon-pump',       name: 'Pump',             price: 4.49 },
  stick:      { icon: 'icon-stick',      name: 'Twist Stick',      price: 3.99 },
  spoolie:    { icon: 'icon-spoolie',    name: 'Spoolie',          price: 3.49 },
  pod:        { icon: 'icon-pod',        name: 'Mini Capsule', price: 2.99 },
};

const BASE_PRICE = 12.99;

let cart = JSON.parse(localStorage.getItem('kenCart') || '[]');

const checkoutCart = document.getElementById('checkout-cart');
const checkoutTotal = document.getElementById('checkout-total');
const confirmOverlay = document.getElementById('confirm-overlay');

function renderCheckout() {
  if (cart.length === 0) {
    checkoutCart.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="index.html#build">Build your KEN</a></p>';
    checkoutTotal.textContent = '$0.00';
    return;
  }

  let grandTotal = 0;
  let html = '';

  cart.forEach((item, index) => {
    grandTotal += item.total;

    const label = item.includesCore
      ? `Custom KEN + ${item.modules.length} module${item.modules.length !== 1 ? 's' : ''}`
      : `${item.modules.length} module${item.modules.length !== 1 ? 's' : ''} only`;

    // Count modules for display
    const counts = {};
    item.modules.forEach(mod => {
      counts[mod] = (counts[mod] || 0) + 1;
    });

    let tagsHtml = '';
    if (item.includesCore) {
      tagsHtml += `<span class="checkout-module-tag" style="background:var(--color-pink-light);color:#2c3e6b;">KEN Core</span>`;
    }
    Object.keys(counts).forEach(mod => {
      const d = moduleData[mod];
      const qty = counts[mod];
      const qtyLabel = qty > 1 ? ` x${qty}` : '';
      tagsHtml += `
        <span class="checkout-module-tag">
          <svg><use href="#${d.icon}"/></svg>
          ${d.name}${qtyLabel}
        </span>
      `;
    });

    html += `
      <div class="checkout-item">
        <div class="checkout-item-header">
          <h4>${label}</h4>
          <span class="checkout-item-price">$${item.total.toFixed(2)}</span>
        </div>
        <div class="checkout-item-modules">${tagsHtml}</div>
        <button class="checkout-item-remove" data-index="${index}">Remove from cart</button>
      </div>
    `;
  });

  checkoutCart.innerHTML = html;
  checkoutTotal.textContent = `$${grandTotal.toFixed(2)}`;

  // Attach remove listeners
  document.querySelectorAll('.checkout-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      cart.splice(idx, 1);
      localStorage.setItem('kenCart', JSON.stringify(cart));
      renderCheckout();
    });
  });
}

// Form submit
document.getElementById('checkout-form').addEventListener('submit', e => {
  e.preventDefault();

  if (cart.length === 0) return;

  // Clear cart
  cart = [];
  localStorage.setItem('kenCart', JSON.stringify(cart));

  // Show confirmation
  confirmOverlay.classList.add('show');
});

renderCheckout();
