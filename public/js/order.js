/**
 * Order page functionality: browse menu by outlet, filter categories, search.
 */

const CATEGORY_META = {
  Pizza: 'https://img.icons8.com/emoji/96/pizza-emoji.png',
  Fruits: 'https://img.icons8.com/emoji/96/green-apple.png',
  Snacks: 'https://img.icons8.com/?size=100&id=97192&format=png&color=000000',
  Veggies: 'https://img.icons8.com/?size=100&id=20875&format=png&color=000000',
  Hotdog: 'https://img.icons8.com/?size=100&id=2AIrctH82xog&format=png&color=000000',
  Burger: 'https://img.icons8.com/?size=100&id=erEevcUCwAMR&format=png&color=000000',
  Drink: 'https://img.icons8.com/?size=100&id=lyMuG44EXuxH&format=png&color=000000',
};

class OrderMenuItem {
  constructor(data) {
    this.id = data.id || data._id || `order-${Date.now()}`;
    this._id = data._id || this.id; // Store MongoDB _id
    this.name = data.name;
    this.category = data.category || 'Menu';
    this.price = Number(data.price || 0);
    this.description = data.description || 'Freshly prepared and ready to serve.';
    this.image = data.image || data.img || '/img/373.png';
    this.rating = Number(data.rating || 4.5);
    this.featured = Boolean(data.featured);
  }

  renderCard() {
    const card = document.createElement('article');
    card.className = `food-card${this.featured ? ' featured' : ''}`;
    card.innerHTML = `
      <div class="food-image-wrapper">
        <img class="food-img" src="${this.image}" alt="${this.name}" loading="lazy">
        <span class="food-category">${this.category}</span>
      </div>
      <div class="food-content">
        <h3 class="food-title">${this.name}</h3>
        <p class="food-description">${this.description}</p>
        <div class="food-meta">
          <span class="food-rating">⭐ ${this.rating.toFixed(1)}</span>
          <span class="food-price">₹${this.price.toFixed(2)}</span>
        </div>
        <button class="add-to-cart" data-item-id="${this.id}" data-menu-item-id="${this._id}">Add to Cart</button>
      </div>
    `;
    return card;
  }
}

class OrderPage {
  constructor() {
    this.outlets = window.__OUTLETS__ || [];
    this.dataLoader = window.dataLoader;

    this.outletSelect = document.getElementById('orderOutletSelect');
    this.categorySelect = document.getElementById('orderCategorySelect');
    this.searchInput = document.getElementById('orderSearch');
    this.categoryRow = document.getElementById('categoryRow');
    this.itemsGrid = document.getElementById('itemsGrid');
    this.categoriesSection = document.getElementById('categoriesSection');
    this.itemsSection = document.getElementById('itemsSection');
    this.emptyState = document.getElementById('orderEmptyState');

    this.heroTitle = document.getElementById('orderOutletName');
    this.heroBadge = document.getElementById('orderHeroBadge');
    this.heroBanner = document.getElementById('orderOutletBanner');
    this.promoImage = document.getElementById('orderPromoImage');
    this.promoCard = document.getElementById('orderPromoCard');
    this.promoDiscount = document.getElementById('orderPromoDiscount');
    this.promoText = document.getElementById('orderPromoText');

    this.selectedOutlet = null;
    this.selectedCategory = null;
    this.menuByCategory = {};

    this.init();
  }

  init() {
    this.populateOutletSelect();
    this.bindEvents();
    const initialOutlet = window.Utils.URLManager.getQueryParam('outlet');
    if (initialOutlet) {
      this.selectOutletByName(initialOutlet);
    }
  }

  populateOutletSelect() {
    this.outletSelect.innerHTML = '<option value="">Select an outlet</option>';
    this.outlets.forEach((outlet) => {
      const option = document.createElement('option');
      option.value = outlet._id || outlet.name;
      option.textContent = outlet.name;
      option.dataset.name = outlet.name;
      this.outletSelect.appendChild(option);
    });
  }

  bindEvents() {
    this.outletSelect.addEventListener('change', async (event) => {
      const selectedValue = event.target.value;
      const option = this.outletSelect.querySelector(
        `option[value="${CSS.escape(selectedValue)}"]`
      );
      const outletName = option?.dataset.name || selectedValue;
      if (!outletName) return;
      
      // Find the actual outlet object to get the _id
      const outlet = this.outlets.find(o => o._id === selectedValue || o.name === selectedValue);
      if (outlet && outlet._id) {
        // Update selectedOutlet with the full outlet object
        this.selectedOutlet = outlet;
      }
      
      await this.loadOutletMenu(outletName, outlet?._id || selectedValue);
      window.Utils.URLManager.setQueryParam('outlet', outletName);
    });

    this.categorySelect.addEventListener('change', () => {
      this.selectedCategory = this.categorySelect.value || null;
      this.renderCategoryChips();
      this.renderItems();
    });

    const debouncedSearch = this.debounce(() => this.renderItems(), 250);
    this.searchInput.addEventListener('input', debouncedSearch);

    // Handle add to cart from order page
    this.itemsGrid.addEventListener('click', (event) => {
      const button = event.target.closest('.add-to-cart');
      if (!button) return;
      
      event.preventDefault();
      const menuItemId = button.dataset.menuItemId;
      const itemId = button.dataset.itemId;
      
      // Find the item in menuByCategory
      let menuItem = null;
      for (const category in this.menuByCategory) {
        menuItem = this.menuByCategory[category].find(item => item.id === itemId || item._id === menuItemId);
        if (menuItem) break;
      }
      
      if (!menuItem) return;
      
      // Get outlet ID - ensure it's the MongoDB _id, not the name
      let outletId = this.selectedOutlet?._id;
      
      // If we don't have _id from selectedOutlet, try to find it from outlets array
      if (!outletId) {
        const selectedValue = this.outletSelect.value;
        // Try to find outlet by _id first
        const outletById = this.outlets.find(outlet => outlet._id === selectedValue);
        if (outletById) {
          outletId = outletById._id;
        } else {
          // Try to find by name
          const outletByName = this.outlets.find(outlet => outlet.name === selectedValue);
          if (outletByName && outletByName._id) {
            outletId = outletByName._id;
          } else {
            // Last resort: use the value if it looks like an ObjectId
            if (selectedValue && /^[0-9a-fA-F]{24}$/.test(selectedValue)) {
              outletId = selectedValue;
            }
          }
        }
      }
      
      if (!outletId) {
        window.Utils.NotificationManager.show('Please select an outlet first.', 'warning');
        return;
      }
      
      console.log('Using outlet ID:', outletId);
      
      // Add to cart with full information
      if (window.cart) {
        window.cart.addItem({
          id: menuItem.id,
          menuItemId: menuItem._id, // MongoDB _id
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity: 1,
          outletId: outletId // Store outlet ID (MongoDB _id)
        });
        
        // Store outlet ID in cart for reference (addItem should handle this, but ensure it's set)
        if (!window.cart.outletId) {
          window.cart.outletId = outletId;
          window.cart.saveCart(); // Ensure it's saved
        }
        
        window.Utils.NotificationManager.show(`${menuItem.name} added to cart!`, 'success');
      } else {
        window.Utils.NotificationManager.show('Cart not initialized. Please refresh the page.', 'error');
      }
    });
  }

  async selectOutletByName(name) {
    const match = this.outlets.find(
      (outlet) => outlet.name.toLowerCase() === name.toLowerCase()
    );
    if (match) {
      const value = match._id || match.name;
      this.outletSelect.value = value;
      await this.loadOutletMenu(match.name, value);
    }
  }

  async loadOutletMenu(outletName, outletId) {
    // Find outlet with _id
    const outletMatch = this.outlets.find(
      (outlet) => outlet.name.toLowerCase() === outletName.toLowerCase() || outlet._id === outletId
    );
    
    this.selectedOutlet = outletMatch || {
      name: outletName,
      _id: outletId,
      promo: { discount: 'Special', description: 'Chef curated menu' },
      banner:
        'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1170&auto=format&fit=crop',
    };
    
    // Ensure _id is set
    if (!this.selectedOutlet._id && outletId) {
      this.selectedOutlet._id = outletId;
    }

    this.updateHero();
    this.itemsSection.hidden = true;
    this.categoriesSection.hidden = true;
    this.categorySelect.disabled = true;
    this.searchInput.disabled = true;

    try {
      const query = outletId ? `?outlet=${encodeURIComponent(outletId)}` : '';
      const { menuItems = [] } = await this.fetchFromApi(
        `/api/menu-items${query}`
      );
      if (menuItems.length > 0) {
        this.menuByCategory = this.groupByCategory(menuItems);
        this.afterMenuLoad();
        return;
      }
    } catch (error) {
      console.warn('API menu fetch failed, using JSON fallback', error);
    }

    await this.loadMenuFromJson(outletName);
    this.afterMenuLoad();
  }

  async loadMenuFromJson(outletName) {
    const data = await this.dataLoader.getMenuForRestaurant(outletName);
    this.menuByCategory = Object.entries(data || {}).reduce(
      (acc, [category, items]) => {
        acc[category] = items.map(
          (item) =>
            new OrderMenuItem({
              ...item,
              category,
              _id: item._id || item.id
            })
        );
        return acc;
      },
      {}
    );
  }

  groupByCategory(items) {
    const grouped = {};
    items.forEach((item) => {
      const category = item.category || 'Menu';
      // Ensure _id is preserved
      const menuItem = new OrderMenuItem({
        ...item,
        _id: item._id || item.id
      });
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(menuItem);
    });
    return grouped;
  }

  afterMenuLoad() {
    const categories = Object.keys(this.menuByCategory);
    if (categories.length === 0) {
      this.itemsGrid.innerHTML =
        '<p class="muted">Menu data is not available for this outlet.</p>';
      return;
    }
    this.categorySelect.innerHTML =
      '<option value="">All categories</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      this.categorySelect.appendChild(option);
    });

    this.categorySelect.disabled = false;
    this.searchInput.disabled = false;
    this.categoriesSection.hidden = false;
    this.itemsSection.hidden = false;
    this.selectedCategory = null;
    this.renderCategoryChips();
    this.renderItems();
  }

  renderCategoryChips() {
    this.categoryRow.innerHTML = '';
    const categories = Object.keys(this.menuByCategory);
    categories.forEach((category) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `cat-chip${
        this.selectedCategory === category ? ' selected' : ''
      }`;
      chip.innerHTML = `
        <img src="${CATEGORY_META[category] || CATEGORY_META.Snacks}" alt="${category}">
        <span>${category}</span>
      `;
      chip.addEventListener('click', () => {
        if (this.selectedCategory === category) {
          this.selectedCategory = null;
        } else {
          this.selectedCategory = category;
        }
        this.categorySelect.value = this.selectedCategory || '';
        this.renderCategoryChips();
        this.renderItems();
        this.itemsSection.scrollIntoView({ behavior: 'smooth' });
      });
      this.categoryRow.appendChild(chip);
    });
  }

  renderItems() {
    this.itemsGrid.innerHTML = '';
    const searchTerm = this.searchInput.value.trim().toLowerCase();
    const categoriesToInclude = this.selectedCategory
      ? [this.selectedCategory]
      : Object.keys(this.menuByCategory);

    const items = categoriesToInclude.flatMap(
      (category) => this.menuByCategory[category] || []
    );

    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );

    if (filteredItems.length === 0) {
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    filteredItems.forEach((item) => {
      fragment.appendChild(item.renderCard());
    });
    this.itemsGrid.appendChild(fragment);
  }

  updateHero() {
    const outlet = this.selectedOutlet;
    if (!outlet) return;

    this.heroTitle.textContent = outlet.name;
    this.heroBadge.textContent = outlet.promo?.discount || 'Featured outlet';
    this.heroBanner.src =
      outlet.banner ||
      outlet.image ||
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1170&auto=format&fit=crop';
    this.promoImage.src =
      outlet.promoImage ||
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop&crop=center';
    this.promoDiscount.textContent = outlet.promo?.discount || 'Special offer';
    this.promoText.textContent =
      outlet.promo?.description || 'Enjoy freshly prepared meals at great prices.';
  }

  async fetchFromApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-orders')) {
    new OrderPage();
  }
});
