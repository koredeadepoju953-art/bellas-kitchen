// ============================================
// BELLA'S KITCHEN — MAIN SCRIPT
// Handles: menu rendering, category filtering, cart management, checkout
// Runs across all pages
// ============================================

// ---- CART UTILITIES (Used everywhere) ----
function getCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading cart from localStorage:", e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (e) {
    console.error("Error saving cart to localStorage:", e);
  }
  updateCartBadge();
}

// Update the badge on navigation across any page
function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badges = document.querySelectorAll(".cart-badge");

  badges.forEach(badge => {
    badge.textContent = totalCount;
    if (totalCount > 0) {
      badge.classList.remove("zero");
      badge.style.display = "inline-flex";
    } else {
      badge.classList.add("zero");
      badge.style.display = "none";
    }
  });
}

// Helper to resolve dish image if not already saved in cart item
function getDishImage(item) {
  if (item.image) return item.image;
  if (typeof menuItems !== "undefined" && Array.isArray(menuItems)) {
    const found = menuItems.find(m => m.id === item.id);
    if (found && found.image) return found.image;
  }
  return "img/meat-pie.jpg";
}

// Adds a dish to the cart, or increases its quantity if it's already there
function addToCart(itemId) {
  if (typeof menuItems === "undefined") return;

  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  const cart = getCart();
  const existing = cart.find(i => i.id === itemId);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
    if (!existing.image) existing.image = item.image;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
  }

  saveCart(cart);
  showToast(`${item.name} added to cart!`);
}

// Toast notification for smooth UX
function showToast(message) {
  let toast = document.getElementById("bella-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "bella-toast";
    toast.className = "bella-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast.dismissTimeout);
  toast.dismissTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Global click listener for any .add-to-cart button
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (btn) {
    const itemId = Number(btn.dataset.id);
    if (itemId) addToCart(itemId);
  }
});


// ---- MENU PAGE LOGIC ----
const menuGrid = document.getElementById("menu-items-grid");

if (menuGrid) {
  // Builds and injects dish cards into the grid
  function renderMenuItems(items) {
    menuGrid.innerHTML = "";

    if (!items || items.length === 0) {
      menuGrid.innerHTML = "<p class='empty-msg'>No dishes found in this category.</p>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "dish-card";
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        <div class="dish-card-body">
          <h3>${item.name}</h3>
          <p class="category-tag">${item.category}</p>
          <p class="price">₦${item.price.toLocaleString()}</p>
          <button class="btn add-to-cart" data-id="${item.id}">Add to Cart</button>
        </div>
      `;
      menuGrid.appendChild(card);
    });
  }

  // Filters menuItems by category, re-renders, and highlights the active filter button
  function filterAndRender(category) {
    if (typeof menuItems === "undefined") return;

    const filtered = (category === "All" || !category)
      ? menuItems
      : menuItems.filter(item => item.category.toLowerCase() === category.toLowerCase());

    renderMenuItems(filtered);

    document.querySelectorAll(".filter-btn").forEach(btn => {
      const btnCat = btn.dataset.category || "All";
      btn.classList.toggle("active", btnCat.toLowerCase() === (category || "All").toLowerCase());
    });
  }

  // Wire up dynamic filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category || "All";
      // Update browser URL without full reload for shareability
      const newUrl = category === "All" ? window.location.pathname : `${window.location.pathname}?category=${encodeURIComponent(category)}`;
      window.history.replaceState({}, "", newUrl);
      filterAndRender(category);
    });
  });

  // Check URL query param on page load
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || "All";
  filterAndRender(initialCategory);
}


// ---- CART PAGE LOGIC ----
const cartItemsContainer = document.getElementById("cart-items");

if (cartItemsContainer) {
  function renderCart() {
    const cart = getCart();
    const emptyState = document.getElementById("cart-empty");
    const summarySection = document.getElementById("cart-summary-section");
    const cartTotalEl = document.getElementById("cart-total");

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (summarySection) summarySection.style.display = "none";
      if (cartTotalEl) cartTotalEl.textContent = "₦0";
      updateCartBadge();
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (summarySection) summarySection.style.display = "flex";

    let total = 0;

    cart.forEach(item => {
      const quantity = item.quantity || 1;
      const subtotal = item.price * quantity;
      total += subtotal;
      const imageUrl = getDishImage(item);

      const row = document.createElement("div");
      row.className = "cart-row";
      row.dataset.id = item.id;
      row.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">₦${item.price.toLocaleString()} each</span>
        </div>
        <div class="cart-qty-controls">
          <button class="qty-btn decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="cart-qty-val">${quantity}</span>
          <button class="qty-btn increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
        <span class="cart-item-subtotal">₦${subtotal.toLocaleString()}</span>
        <button class="remove-item" data-id="${item.id}" title="Remove item">Remove</button>
      `;
      cartItemsContainer.appendChild(row);
    });

    if (cartTotalEl) {
      cartTotalEl.textContent = `₦${total.toLocaleString()}`;
    }

    updateCartBadge();
  }

  // Handle quantity changes and removal via event delegation
  cartItemsContainer.addEventListener("click", (e) => {
    const target = e.target;
    const btn = target.closest(".qty-btn, .remove-item");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!id) return;

    let cart = getCart();
    const item = cart.find(i => i.id === id);

    if (btn.classList.contains("increase")) {
      if (item) item.quantity = (item.quantity || 1) + 1;
    } else if (btn.classList.contains("decrease")) {
      if (item) {
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          cart = cart.filter(i => i.id !== id);
        }
      }
    } else if (btn.classList.contains("remove-item")) {
      cart = cart.filter(i => i.id !== id);
    }

    saveCart(cart);
    renderCart();
  });

  renderCart();
}


// ---- CHECKOUT PAGE LOGIC ----
const checkoutSummary = document.getElementById("checkout-summary");
const checkoutForm = document.getElementById("checkout-form");
const checkoutEmpty = document.getElementById("checkout-empty");

if (checkoutSummary) {
  function renderCheckoutSummary() {
    const cart = getCart();
    let total = 0;

    if (cart.length === 0) {
      if (checkoutEmpty) checkoutEmpty.style.display = "block";
      if (checkoutForm) checkoutForm.style.display = "none";
      checkoutSummary.innerHTML = `
        <div class="cart-empty-state">
          <p>Your cart is empty. Please add delicious items before checking out.</p>
          <a href="menu.html" class="btn">Explore Our Menu</a>
        </div>
      `;
      return;
    }

    if (checkoutEmpty) checkoutEmpty.style.display = "none";
    if (checkoutForm) checkoutForm.style.display = "block";

    let summaryHTML = "<ul class='checkout-list'>";
    cart.forEach(item => {
      const quantity = item.quantity || 1;
      const subtotal = item.price * quantity;
      total += subtotal;
      const imageUrl = getDishImage(item);

      summaryHTML += `
        <li class="checkout-item">
          <div class="checkout-item-details">
            <img src="${imageUrl}" alt="${item.name}" class="checkout-thumb">
            <div>
              <strong>${item.name}</strong>
              <div class="checkout-item-meta">Qty: ${quantity} × ₦${item.price.toLocaleString()}</div>
            </div>
          </div>
          <span class="checkout-item-price">₦${subtotal.toLocaleString()}</span>
        </li>
      `;
    });
    summaryHTML += "</ul>";
    summaryHTML += `
      <div class="checkout-total-row">
        <span>Order Total:</span>
        <span class="checkout-total-amount">₦${total.toLocaleString()}</span>
      </div>
    `;
    checkoutSummary.innerHTML = summaryHTML;
  }

  renderCheckoutSummary();

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const cart = getCart();
      if (cart.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
      }

      const name = document.getElementById("customer-name").value.trim();
      const phone = document.getElementById("customer-phone").value.trim();
      const address = document.getElementById("customer-address").value.trim();
      const notes = document.getElementById("customer-notes") ? document.getElementById("customer-notes").value.trim() : "";

      let total = 0;
      let orderLines = "";
      cart.forEach((item, idx) => {
        const quantity = item.quantity || 1;
        const subtotal = item.price * quantity;
        total += subtotal;
        orderLines += `${idx + 1}. ${item.name} (x${quantity}) — ₦${subtotal.toLocaleString()}\n`;
      });

      // Construct clean, formatted WhatsApp message
      const message =
        `🍽️ *NEW ORDER — Bella's Kitchen*\n\n` +
        `👤 *Customer:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📍 *Delivery Address:* ${address}\n` +
        (notes ? `📝 *Notes:* ${notes}\n` : "") +
        `\n🛒 *Ordered Items:*\n${orderLines}\n` +
        `💰 *Total Amount: ₦${total.toLocaleString()}*\n\n` +
        `Thank you for ordering with Bella's Kitchen!`;

      const yourWhatsAppNumber = "2349056637999";
      const whatsappURL = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      window.open(whatsappURL, "_blank");

      // Clear the cart
      localStorage.removeItem("cart");
      updateCartBadge();

      // Show in-page confirmation
      const successBox = document.getElementById("checkout-success");
      if (successBox) {
        successBox.style.display = "block";
        checkoutForm.style.display = "none";
        checkoutSummary.style.display = "none";
      } else {
        renderCheckoutSummary();
        alert("Order placed successfully! Redirecting to WhatsApp...");
      }
    });
  }
}

// Run badge update on every page load
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});
updateCartBadge();