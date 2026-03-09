// ────────── Hero Explorer ──────────

(function() {
  const explorer = document.querySelector('.product-explorer');
  if (!explorer) return;

  const modules = explorer.querySelectorAll('.orbit-module');
  const tooltip = explorer.querySelector('.module-tooltip');
  const core = explorer.querySelector('.explorer-core');
  const explorerRect = () => explorer.getBoundingClientRect();

  const RADIUS = 140;
  let angleOffset = 0;
  let spinning = false;
  let autoRotate = true;
  let lastTime = performance.now();

  function positionModules() {
    const cx = explorer.offsetWidth / 2;
    const cy = explorer.offsetHeight / 2;

    modules.forEach((mod, i) => {
      const baseAngle = (i * 60);
      const angle = (baseAngle + angleOffset) * (Math.PI / 180);
      const x = cx + RADIUS * Math.cos(angle) - mod.offsetWidth / 2;
      const y = cy + RADIUS * Math.sin(angle) - mod.offsetHeight / 2;
      mod.style.left = x + 'px';
      mod.style.top = y + 'px';
    });
  }

  function animate(time) {
    if (autoRotate && !spinning) {
      const dt = time - lastTime;
      angleOffset += dt * 0.015;
    }
    lastTime = time;
    positionModules();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  modules.forEach(mod => {
    mod.addEventListener('mouseenter', () => {
      autoRotate = false;
      tooltip.textContent = mod.dataset.label;
      tooltip.classList.add('visible');
      const modRect = mod.getBoundingClientRect();
      const expRect = explorerRect();
      tooltip.style.left = (modRect.left - expRect.left + modRect.width / 2) + 'px';
      tooltip.style.top = (modRect.top - expRect.top - 32) + 'px';
    });

    mod.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      autoRotate = true;
    });

    mod.addEventListener('click', () => {
      mod.classList.remove('popped');
      void mod.offsetWidth;
      mod.classList.add('popped');
    });
  });

  core.addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    autoRotate = false;
    const start = performance.now();
    const startAngle = angleOffset;
    function spinAnim(time) {
      const progress = Math.min((time - start) / 800, 1);
      angleOffset = startAngle + 180 * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) requestAnimationFrame(spinAnim);
      else { spinning = false; autoRotate = true; }
    }
    requestAnimationFrame(spinAnim);
  });

  function createConnectors() {
    modules.forEach(() => {
      const line = document.createElement('div');
      line.classList.add('orbit-connector');
      explorer.appendChild(line);
    });
  }
  createConnectors();

  const connectors = explorer.querySelectorAll('.orbit-connector');
  function updateConnectors() {
    const cx = explorer.offsetWidth / 2;
    const cy = explorer.offsetHeight / 2;
    modules.forEach((mod, i) => {
      const mx = parseFloat(mod.style.left) + mod.offsetWidth / 2;
      const my = parseFloat(mod.style.top) + mod.offsetHeight / 2;
      const dx = mx - cx;
      const dy = my - cy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (connectors[i]) {
        connectors[i].style.width = length + 'px';
        connectors[i].style.transform = `rotate(${angle}deg)`;
      }
    });
    requestAnimationFrame(updateConnectors);
  }
  requestAnimationFrame(updateConnectors);
  positionModules();
})();

// ────────── Customizer ──────────

const BASE_PRICE = 12.99;
const MAX_SLOTS = 6;
const MIN_SLOTS = 3;

const moduleData = {
  spritz:     { icon: 'icon-spritz',     name: 'Spritz Bottle',   short: 'Spritz',  price: 4.99 },
  applicator: { icon: 'icon-applicator', name: 'Tube Applicator', short: 'Tube',    price: 3.99 },
  pump:       { icon: 'icon-pump',       name: 'Pump',            short: 'Pump',    price: 4.49 },
  stick:      { icon: 'icon-stick',      name: 'Twist Stick',     short: 'Stick',   price: 3.99 },
  spoolie:    { icon: 'icon-spoolie',    name: 'Spoolie',         short: 'Spoolie', price: 3.49 },
  pod:        { icon: 'icon-pod',        name: 'Mini Capsule',    short: 'Capsule', price: 2.99 },
};

let slotCount = 3;
let slots = [null, null, null];
let ownsKen = false;

const kenBody = document.getElementById('ken-body');
const ownKenToggle = document.getElementById('own-ken-toggle');
const coreLine = document.getElementById('core-line');
const addSlotBtn = document.getElementById('add-slot-btn');
const removeSlotBtn = document.getElementById('remove-slot-btn');
const slotCountLabel = document.getElementById('slot-count-label');
const summaryModules = document.querySelector('.summary-modules');
const totalPrice = document.querySelector('.total-price');
const toast = document.getElementById('cart-toast');

// ────────── Cart ──────────

let cart = JSON.parse(localStorage.getItem('kenCart') || '[]');

const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const cartBody = document.getElementById('cart-body');
const cartFooter = document.getElementById('cart-footer');
const cartTotal = document.getElementById('cart-total');

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function renderCart() {
  if (cart.length === 0) {
    cartBody.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartFooter.style.display = 'none';
    cartCount.classList.remove('visible');
    return;
  }

  cartCount.textContent = cart.length;
  cartCount.classList.add('visible');
  cartFooter.style.display = 'block';

  let total = 0;
  let html = '';

  cart.forEach((item, index) => {
    total += item.total;
    let modulesHtml = '';
    item.modules.forEach(mod => {
      const d = moduleData[mod];
      modulesHtml += `<span>${d.name}</span>`;
    });

    const label = item.includesCore
      ? `Custom KEN + ${item.modules.length} module${item.modules.length !== 1 ? 's' : ''}`
      : `${item.modules.length} module${item.modules.length !== 1 ? 's' : ''} only`;

    html += `
      <div class="cart-item">
        <div class="cart-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <path d="M12 8v8"/>
            <path d="M8 12h8"/>
          </svg>
        </div>
        <div class="cart-item-info">
          <h4>${label}</h4>
          <span>${item.modules.map(m => moduleData[m].name).join(', ')}</span>
        </div>
        <span class="cart-item-price">$${item.total.toFixed(2)}</span>
      </div>
    `;
  });

  cartBody.innerHTML = html;
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

// ────────── Dynamic Slots ──────────

function addSlot() {
  if (slotCount >= MAX_SLOTS) return;
  slotCount++;
  slots.push(null);
  rebuildSlots();
  updateSlotControls();
  renderSummary();
}

function removeSlot() {
  if (slotCount <= MIN_SLOTS) return;
  // Remove the last slot
  slotCount--;
  slots.pop();
  rebuildSlots();
  updateSlotControls();
  renderSummary();
}

function updateSlotControls() {
  slotCountLabel.textContent = `${slotCount} / ${MAX_SLOTS} slots`;
  addSlotBtn.disabled = slotCount >= MAX_SLOTS;
  removeSlotBtn.disabled = slotCount <= MIN_SLOTS;
}

function rebuildSlots() {
  // Keep the KEN label, clear slots, rebuild
  const label = kenBody.querySelector('.ken-body-label');
  kenBody.innerHTML = '';
  kenBody.appendChild(label);

  for (let i = 0; i < slotCount; i++) {
    const slot = document.createElement('div');
    slot.classList.add('drop-slot');
    slot.dataset.slot = i;

    if (slots[i]) {
      const d = moduleData[slots[i]];
      slot.classList.add('filled');
      slot.innerHTML = `
        <div class="slot-content">
          <svg class="slot-icon"><use href="#${d.icon}"/></svg>
          <span>${d.short}</span>
        </div>
        <div class="remove-hint">&times;</div>
      `;
    } else {
      slot.innerHTML = `<span class="slot-label">Slot ${i + 1}</span>`;
    }

    // Attach drag/drop and click listeners
    attachSlotListeners(slot);
    kenBody.appendChild(slot);
  }
}

function attachSlotListeners(slot) {
  slot.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    slot.classList.add('drag-over');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('drag-over');
  });

  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const mod = e.dataTransfer.getData('text/plain');
    const slotIndex = parseInt(slot.dataset.slot);
    if (!moduleData[mod]) return;
    slots[slotIndex] = mod;
    rebuildSlots();
    renderSummary();
  });

  slot.addEventListener('click', () => {
    const slotIndex = parseInt(slot.dataset.slot);
    if (slots[slotIndex] !== null) {
      slots[slotIndex] = null;
      rebuildSlots();
      renderSummary();
    }
  });
}

addSlotBtn.addEventListener('click', addSlot);
removeSlotBtn.addEventListener('click', removeSlot);

// ────────── Drag from tray ──────────

const dragModules = document.querySelectorAll('.drag-module');

dragModules.forEach(el => {
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', el.dataset.module);
    e.dataTransfer.effectAllowed = 'copy';
    el.style.opacity = '0.5';
  });

  el.addEventListener('dragend', () => {
    el.style.opacity = '';
  });
});

// ────────── Touch Support (Mobile) ──────────

let touchDragModule = null;
let touchGhost = null;

dragModules.forEach(el => {
  el.addEventListener('touchstart', e => {
    touchDragModule = el.dataset.module;
    const touch = e.touches[0];
    touchGhost = el.cloneNode(true);
    touchGhost.classList.add('drag-ghost');
    touchGhost.style.width = el.offsetWidth + 'px';
    touchGhost.style.left = (touch.clientX - 40) + 'px';
    touchGhost.style.top = (touch.clientY - 25) + 'px';
    document.body.appendChild(touchGhost);
    el.style.opacity = '0.4';
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (!touchGhost) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchGhost.style.left = (touch.clientX - 40) + 'px';
    touchGhost.style.top = (touch.clientY - 25) + 'px';

    document.querySelectorAll('.drop-slot').forEach(slot => {
      const rect = slot.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        slot.classList.add('drag-over');
      } else {
        slot.classList.remove('drag-over');
      }
    });
  }, { passive: false });

  el.addEventListener('touchend', e => {
    if (!touchGhost) return;
    const touch = e.changedTouches[0];

    document.querySelectorAll('.drop-slot').forEach(slot => {
      slot.classList.remove('drag-over');
      const rect = slot.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const slotIndex = parseInt(slot.dataset.slot);
        slots[slotIndex] = touchDragModule;
        rebuildSlots();
        renderSummary();
      }
    });

    el.style.opacity = '';
    touchGhost.remove();
    touchGhost = null;
    touchDragModule = null;
  });
});

// ────────── Render Summary ──────────

// Toggle: I already have a KEN
ownKenToggle.addEventListener('change', () => {
  ownsKen = ownKenToggle.checked;
  coreLine.classList.toggle('hidden', ownsKen);
  renderSummary();
});

function renderSummary() {
  let html = '';
  let total = ownsKen ? 0 : BASE_PRICE;
  const counts = {};

  slots.forEach(mod => {
    if (mod) {
      counts[mod] = (counts[mod] || 0) + 1;
    }
  });

  Object.keys(counts).forEach(mod => {
    const d = moduleData[mod];
    const qty = counts[mod];
    const lineTotal = d.price * qty;
    const qtyLabel = qty > 1 ? ` x${qty}` : '';
    html += `<div class="summary-line"><span>${d.name}${qtyLabel}</span><span>$${lineTotal.toFixed(2)}</span></div>`;
    total += lineTotal;
  });

  summaryModules.innerHTML = html;
  totalPrice.textContent = `$${total.toFixed(2)}`;
}

// ────────── Buttons ──────────

document.getElementById('add-to-cart').addEventListener('click', () => {
  const filledModules = slots.filter(s => s !== null);
  if (filledModules.length === 0) {
    toast.querySelector('span').textContent = 'Add at least one module first!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
    return;
  }

  let total = ownsKen ? 0 : BASE_PRICE;
  filledModules.forEach(mod => { total += moduleData[mod].price; });

  cart.push({
    modules: [...filledModules],
    includesCore: !ownsKen,
    total: total,
  });

  localStorage.setItem('kenCart', JSON.stringify(cart));
  renderCart();

  // Show toast then open cart
  toast.querySelector('span').textContent = 'Added to cart!';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    openCart();
  }, 1000);
});

document.getElementById('reset-btn').addEventListener('click', () => {
  for (let i = 0; i < slots.length; i++) slots[i] = null;
  rebuildSlots();
  renderSummary();
});

// ────────── Init ──────────

updateSlotControls();
rebuildSlots();
renderSummary();
renderCart();
