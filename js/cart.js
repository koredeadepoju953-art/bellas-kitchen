// Bella's Kitchen — cart.js
// Cart is stored in localStorage under "bellaCart" as an array of:
// { id, name, price, image, qty }
// Add-to-cart buttons on other pages should push/update entries in this
// same key so the cart persists across visits.

const CART_KEY = 'bellaCart';

// Demo seed so this page isn't empty on its own — remove once your
// delicacies/menu page is writing real items into bellaCart.
const DEMO_ITEMS = [
  { id: 'fried-rice-turkey', name: 'Fried Rice & Turkey', price: 2800, image: 'https://placehold.co/100x100/e8752b/fff?text=Food', qty: 2 },
  { id: 'jollof-chicken',    name: 'Jollof Rice & Chicken', price: 5000, image: 'https://placehold.co/100x100/e8752b/fff?text=Food', qty: 2 },
  { id: 'meat-pie',          name: 'Meat Pie',              price: 800,  image: 'https://placehold.co/100x100/e8752b/fff?text=Food', qty: 1 },
  { id: 'spring-rolls',      name: 'Spring Rolls',          price: 700,  image: 'https://placehold.co/100x100/e8752b/fff?text=Food', qty: 1 },
  { id: 'suya-platter',      name: "Chef's Suya Platter",   price: 3500, image: 'https://placehold.co/100x100/e8752b/fff?text=Food', qty: 1 },
];

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(CART_KEY, JSON.stringify(DEMO_ITEMS));
  return DEMO_ITEMS;
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatNaira(n) {
  return '₦' + n.toLocaleString('en-NG');
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function render() {
  const cart = getCart();
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const summaryEl = document.getElementById('cartSummary');
  const tableEl = document.getElementById('cartTable');

  if (cart.length === 0) {
    tableEl.hidden = true;
    summaryEl.hidden = true;
    emptyEl.hidden = false;
    updateBadge(cart);
    return;
  }

  tableEl.hidden = false;
  summaryEl.hidden = false;
  emptyEl.hidden = true;

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-row" data-id="${item.id}">
      <div class="item-cell">
        <img src="${item.image}" alt="${item.name}" />
        <span class="item-name">${item.name}</span>
      </div>
      <div class="qty-control">
        <button class="qty-decrease" aria-label="Decrease quantity">−</button>
        <span>${item.qty}</span>
        <button class="qty-increase" aria-label="Increase quantity">+</button>
      </div>
      <div class="price-cell">${formatNaira(item.price)}</div>
      <div class="subtotal-cell">${formatNaira(item.price * item.qty)}</div>
      <div class="action-cell">
        <button class="remove-btn">${trashIcon()} Remove</button>
      </div>
    </div>
  `).join('');

  document.getElementById('cartTotal').textContent = formatNaira(
    cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  updateBadge(cart);
}

function updateBadge(cart) {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    saveCart(cart.filter(i => i.id !== id));
  } else {
    saveCart(cart);
  }
  render();
}

function removeItem(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  render();
}

document.getElementById('cartItems')?.addEventListener('click', e => {
  const row = e.target.closest('.cart-row');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.closest('.qty-increase')) changeQty(id, 1);
  if (e.target.closest('.qty-decrease')) changeQty(id, -1);
  if (e.target.closest('.remove-btn')) removeItem(id);
});

render();
