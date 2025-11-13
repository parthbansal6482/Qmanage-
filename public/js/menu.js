/**
 * Menu page functionality with filtering, sorting, and search.
 */

class MenuItemModel {
  constructor(data) {
    this.id = data.id || data._id || `menu-${Date.now()}`;
    this.name = data.name;
    this.price = Number(data.price || 0);
    this.category = data.category || 'General';
    this.outletId =
      data.outletId ||
      data.outlet?._id ||
      data.outletId ||
      data.outletName?.toLowerCase();
    this.outletName =
      data.outletName ||
      data.outlet?.name ||
      'Outlet';
    this.description = data.description || '';
    this.image = data.image || data.img || '/img/373.png';
    this.rating = Number(data.rating || 4);
    this.featured = Boolean(data.featured);
    this.isAvailable =
      typeof data.isAvailable === 'boolean' ? data.isAvailable : true;
  }

  matchesQuery(query) {
    if (!query) return true;
    const searchable = `${this.name} ${this.category} ${this.outletName}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  }

  renderCard() {
    const template = document.getElementById('menuCardTemplate');
    const node = template.content.firstElementChild.cloneNode(true);

    node.dataset.itemId = this.id;
    node.querySelector('.food-img').src = this.image;
    node.querySelector('.food-img').alt = this.name;
    node.querySelector('.food-title').textContent = this.name;
    node.querySelector('.food-price').textContent = `₹${this.price.toFixed(2)}`;
    node.querySelector('.food-description').textContent =
      this.description || 'A delicious item from our menu.';
    node.querySelector('.food-outlet').textContent = this.outletName;
    node.querySelector('.food-rating').textContent = `⭐ ${this.rating.toFixed(1)}`;
    const tag = node.querySelector('.food-tag');
    if (this.featured) {
      tag.textContent = 'Popular';
      tag.classList.add('tag-featured');
    } else if (!this.isAvailable) {
      tag.textContent = 'Unavailable';
      tag.classList.add('tag-muted');
      node.querySelector('.add-to-cart').disabled = true;
    } else {
      tag.textContent = this.category;
    }

    return node;
  }
}

class MenuPage {
  constructor() {
    this.items = [];
    this.filteredItems = [];

    this.menuGrid = document.getElementById('menuGrid');
    this.menuCount = document.getElementById('menuCount');
    this.emptyState = document.getElementById('menuEmptyState');

    this.searchInput = document.getElementById('menuSearch');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.outletFilter = document.getElementById('outletFilter');
    this.sortSelect = document.getElementById('sortBy');
    this.dataLoader = window.dataLoader;

    this.init();
  }

  async init() {
    await this.loadMenuItems();
    this.populateFilters();
    this.bindEvents();
    this.applyFilters();
  }

  async loadMenuItems() {
    try {
      const result = await this.fetchFromApi('/api/menu-items');
      if (Array.isArray(result.menuItems) && result.menuItems.length) {
        this.items = result.menuItems.map((item) => new MenuItemModel({
          ...item,
          outletName: item.outlet?.name,
          outletId: item.outlet?._id,
        }));
        return;
      }
    } catch (error) {
      console.warn('API menu fetch failed, using JSON fallback', error);
    }

    const fallback = await this.dataLoader.loadMenuItems();
    this.items = this.flattenMenuJson(fallback.menuItems || {}).map(
      (item) => new MenuItemModel(item)
    );
  }

  async fetchFromApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  flattenMenuJson(menuByOutlet) {
    return Object.entries(menuByOutlet).flatMap(([outletName, categories]) =>
      Object.entries(categories || {}).flatMap(([categoryName, items]) =>
        (items || []).map((item) => ({
          ...item,
          outletName,
          category: categoryName,
        }))
      )
    );
  }

  populateFilters() {
    const uniqueOutlets = new Map();
    this.items.forEach((item) => {
      uniqueOutlets.set(item.outletName, item.outletId || item.outletName);
    });

    uniqueOutlets.forEach((value, name) => {
      const option = document.createElement('option');
      option.value = value || name;
      option.textContent = name;
      this.outletFilter.appendChild(option);
    });
  }

  bindEvents() {
    const debouncedSearch = this.debounce(() => this.applyFilters(), 250);
    this.searchInput.addEventListener('input', debouncedSearch);
    this.categoryFilter.addEventListener('change', () => this.applyFilters());
    this.outletFilter.addEventListener('change', () => this.applyFilters());
    this.sortSelect.addEventListener('change', () => this.applyFilters());
  }

  applyFilters() {
    const query = this.searchInput.value.trim();
    const selectedCategory = this.categoryFilter.value;
    const selectedOutlet = this.outletFilter.value;

    this.filteredItems = this.items
      .filter((item) => item.matchesQuery(query))
      .filter((item) => {
        if (selectedCategory === 'all') return true;
        return item.category === selectedCategory;
      })
      .filter((item) => {
        if (selectedOutlet === 'all') return true;
        return item.outletId === selectedOutlet || item.outletName === selectedOutlet;
      });

    this.sortItems(this.filteredItems);
    this.renderItems();
  }

  sortItems(items) {
    const sortBy = this.sortSelect.value;
    switch (sortBy) {
      case 'priceLow':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      default:
        items.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  }

  renderItems() {
    this.menuGrid.innerHTML = '';
    this.menuCount.textContent = `${this.filteredItems.length} item${
      this.filteredItems.length === 1 ? '' : 's'
    }`;

    if (this.filteredItems.length === 0) {
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    this.filteredItems.forEach((item) => {
      fragment.appendChild(item.renderCard());
    });
    this.menuGrid.appendChild(fragment);
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
  if (document.body.classList.contains('page-menu')) {
    new MenuPage();
  }
});

