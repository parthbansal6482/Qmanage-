/**
 * Cart page rendering and interactions.
 */

class CartPage {
  constructor() {
    this.listEl = document.getElementById('cartItemsList');
    this.emptyState = document.getElementById('cartEmptyState');
    this.subtotalEl = document.getElementById('cartSummarySubtotal');
    this.feesEl = document.getElementById('cartSummaryFees');
    this.totalEl = document.getElementById('cartSummaryTotal');
    this.checkoutButton = document.getElementById('proceedToCheckout');

    this.bindEvents();
    this.waitForCart();
  }

  bindEvents() {
    window.addEventListener('cart:updated', (event) => {
      this.render(event.detail.items, event.detail.total);
    });

    if (this.checkoutButton) {
      this.checkoutButton.addEventListener('click', () => {
        if (!window.cart || window.cart.items.length === 0) {
          window.Utils.NotificationManager.show('Add items before checking out.', 'warning');
          return;
        }
        // Check if all items have outlet and menuItem ID
        const items = window.cart.items;
        const outletId = window.cart.outletId || items[0]?.outletId;
        
        if (!outletId) {
          window.Utils.NotificationManager.show(
            'Please add items from an outlet first. Go to the Order page to select an outlet.',
            'warning'
          );
          return;
        }

        // Check if items have menuItem IDs
        const itemsWithoutMenuItemId = items.filter(item => !item.menuItemId);
        if (itemsWithoutMenuItemId.length > 0) {
          window.Utils.NotificationManager.show(
            'Some items are missing menu information. Please add items from the Order page.',
            'warning'
          );
          return;
        }

        // Redirect to checkout page
        window.location.href = '/checkout';
      });
    }

    this.listEl.addEventListener('click', (event) => {
      if (!window.cart) return;
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const itemId = button.closest('[data-item-id]')?.dataset.itemId;
      if (!itemId) return;

      switch (button.dataset.action) {
        case 'increase':
          window.cart.updateQuantity(Number(itemId), this.getItemQuantity(itemId) + 1);
          break;
        case 'decrease':
          window.cart.updateQuantity(Number(itemId), this.getItemQuantity(itemId) - 1);
          break;
        case 'remove':
          window.cart.removeItem(Number(itemId));
          break;
        default:
          break;
      }
    });
  }

  waitForCart() {
    if (window.cart) {
      this.render(window.cart.items, window.cart.getTotalAmount());
    } else {
      setTimeout(() => this.waitForCart(), 100);
    }
  }

  getItemQuantity(itemId) {
    const item = window.cart.items.find((cartItem) => cartItem.id === Number(itemId));
    return item ? item.quantity : 0;
  }

  render(items, total) {
    if (!items || items.length === 0) {
      this.listEl.innerHTML = '';
      this.emptyState.hidden = false;
      this.updateSummary(0, 0);
      return;
    }

    this.emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(this.renderItem(item));
    });
    this.listEl.innerHTML = '';
    this.listEl.appendChild(fragment);

    const fees = total * 0.05;
    this.updateSummary(total, fees);
  }

  renderItem(item) {
    const row = document.createElement('div');
    row.className = 'cart-page-item';
    row.dataset.itemId = item.id;
    row.innerHTML = `
      <div class="cart-item-info">
        <img src="${item.image}" alt="${item.name}" class="cart-page-thumb" loading="lazy">
        <div>
          <h3>${item.name}</h3>
          <p>₹${Number(item.price || 0).toFixed(2)} each</p>
        </div>
      </div>
      <div class="cart-item-controls">
        <div class="quantity-group">
          <button type="button" data-action="decrease">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase">+</button>
        </div>
        <span class="cart-item-total">₹${(item.price * item.quantity).toFixed(2)}</span>
        <button type="button" class="btn-link" data-action="remove">Remove</button>
      </div>
    `;
    return row;
  }

  updateSummary(subtotal, fees) {
    const total = subtotal + fees;
    this.subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    this.feesEl.textContent = `₹${fees.toFixed(2)}`;
    this.totalEl.textContent = `₹${total.toFixed(2)}`;
  }

}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-cart')) {
    new CartPage();
  }
});

