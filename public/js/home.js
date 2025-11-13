/**
 * Home page specific functionality
 * Handles best selling, featured products, and category slider interactions
 */

class FoodItem {
  constructor(data) {
    this.id = data.id || data._id || `food-${Date.now()}`;
    this.name = data.name;
    this.price = Number(data.price || 0);
    this.image = data.image || '/img/373.png';
    this.description = data.description || '';
    this.featured = Boolean(data.featured);
  }

  renderCard() {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (this.featured) {
      card.classList.add('featured');
    }
    card.innerHTML = `
      <img src="${this.image}" alt="${this.name}" class="product-img" loading="lazy">
      <h3 class="product-name">${this.name}</h3>
      <p class="product-price">₹${this.price.toFixed(2)}</p>
      <button class="add-to-cart" data-product-id="${this.id}">+</button>
    `;
    return card;
  }
}

class OutletCategory {
  constructor(outlet) {
    this.name = outlet.name || 'Outlet';
    this.description = outlet.description || 'Popular dishes available';
    this.image = outlet.image || '/img/373.png';
    this.id = outlet._id || outlet.id || this.name.toLowerCase().replace(/\s+/g, '-');
  }

  renderLink() {
    const anchor = document.createElement('a');
    anchor.className = 'category-item';
    anchor.href = `/orders?outlet=${encodeURIComponent(this.name)}`;
    anchor.innerHTML = `
      <img src="${this.image}" alt="${this.name}" class="category-img" loading="lazy">
      <h3 class="category-title">${this.name}</h3>
      <p class="category-desc">${this.description}</p>
    `;
    return anchor;
  }
}

class HomePage {
  constructor() {
    this.dataLoader = window.dataLoader;
    this.categoryContainer = document.querySelector('.category-items');
    this.bestSellingContainer = document.querySelector('.best-selling .product-grid');
    this.featuredContainer = document.querySelector('.featured-products .featured-grid');
    this.init();
  }

  async init() {
    await Promise.all([
      this.loadAndRenderCategories(),
      this.loadAndRenderBestSelling(),
      this.loadAndRenderFeaturedProducts(),
    ]);
    this.setupCategorySlider();
  }

  async loadAndRenderBestSelling() {
    if (!this.bestSellingContainer) return;
    try {
      const { menuItems = [] } = await this.fetchFromApi('/api/menu-items?limit=8');
      if (menuItems.length > 0) {
        this.renderProductSection(menuItems, this.bestSellingContainer);
        return;
      }
    } catch (error) {
      console.warn('Falling back to JSON for best selling items', error);
    }

    try {
      const data = await this.dataLoader.loadBestSelling();
      this.renderProductSection(data.bestSelling || [], this.bestSellingContainer);
    } catch (error) {
      console.error('Error loading best selling data:', error);
    }
  }

  async loadAndRenderFeaturedProducts() {
    if (!this.featuredContainer) return;
    try {
      const { menuItems = [] } = await this.fetchFromApi('/api/menu-items?limit=6');
      if (menuItems.length > 0) {
        this.renderProductSection(menuItems.slice(0, 6), this.featuredContainer);
        return;
      }
    } catch (error) {
      console.warn('Falling back to JSON for featured items', error);
    }

    try {
      const data = await this.dataLoader.loadFeaturedProducts();
      this.renderProductSection(data.featuredProducts || [], this.featuredContainer);
    } catch (error) {
      console.error('Error loading featured products data:', error);
    }
  }

  async loadAndRenderCategories() {
    if (!this.categoryContainer) return;

    try {
      const { outlets = [] } = await this.fetchFromApi('/api/outlets');
      if (outlets.length > 0) {
        this.renderCategories(outlets);
        return;
      }
    } catch (error) {
      console.warn('Falling back to JSON for outlets', error);
    }

    try {
      const data = await this.dataLoader.loadRestaurants();
      this.renderCategories(data.restaurants || []);
    } catch (error) {
      console.error('Error loading outlets data:', error);
    }
  }

  renderProductSection(items, container) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="muted">No items available right now. Please check back soon.</p>';
      return;
    }

    items.forEach((item) => {
      const foodItem = new FoodItem(item);
      container.appendChild(foodItem.renderCard());
    });
  }

  renderCategories(outlets) {
    this.categoryContainer.innerHTML = '';
    outlets.forEach((outlet) => {
      const category = new OutletCategory(outlet);
      this.categoryContainer.appendChild(category.renderLink());
    });
  }

  async fetchFromApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  setupCategorySlider() {
    const container = document.querySelector('.category-items');
    const leftArrow = document.querySelector('.nav-arrow.left');
    const rightArrow = document.querySelector('.nav-arrow.right');

    if (!container || !leftArrow || !rightArrow) {
      return;
    }

    const scrollAmount = 240;
    leftArrow.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    rightArrow.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }
}

window.FoodItem = FoodItem;
window.OutletCategory = OutletCategory;

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-home')) {
    new HomePage();
  }
});

