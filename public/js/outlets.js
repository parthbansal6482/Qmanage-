/**
 * Outlets page interactions: filtering, searching, modal details.
 */

class OutletModel {
  constructor(data) {
    this.id = data._id || data.id || data.name?.toLowerCase().replace(/\s+/g, '-');
    this.name = data.name;
    this.location = data.location || 'On campus';
    this.timings = data.timings || '9:00 AM - 11:00 PM';
    this.description = data.description || 'Serving fresh food daily.';
    this.image = data.image || '/img/373.png';
    this.categories = Array.isArray(data.categories) ? data.categories : [];
    this.promo = data.promo || { discount: '10% off', description: 'On selected items' };
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  matchesQuery(query) {
    if (!query) return true;
    const target = `${this.name} ${this.location} ${this.description}`.toLowerCase();
    return target.includes(query.toLowerCase());
  }

  hasCategory(category) {
    if (!category || category === 'all') return true;
    return this.categories.some(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    );
  }

  renderCard() {
    const template = document.getElementById('outletCardTemplate');
    const node = template.content.firstElementChild.cloneNode(true);

    node.dataset.outletId = this.id;
    node.querySelector('.outlet-image').src = this.image;
    node.querySelector('.outlet-image').alt = this.name;
    node.querySelector('.outlet-title').textContent = this.name;
    node.querySelector('.outlet-description').textContent = this.description;
    node.querySelector('.outlet-location').textContent = `📍 ${this.location}`;
    node.querySelector('.outlet-timings').textContent = `🕒 ${this.timings}`;

    const categoriesContainer = node.querySelector('.outlet-categories');
    categoriesContainer.innerHTML = '';
    this.categories.forEach((category) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = category;
      categoriesContainer.appendChild(chip);
    });

    node.querySelector('.outlet-view-menu').addEventListener('click', () => {
      window.location.href = `/orders?outlet=${encodeURIComponent(this.name)}`;
    });
    node.querySelector('.outlet-more-info').addEventListener('click', () => {
      OutletModal.open(this);
    });

    return node;
  }
}

class OutletModal {
  static setup() {
    this.modal = document.getElementById('outletModal');
    this.body = document.getElementById('outletModalBody');
    this.title = document.getElementById('outletModalTitle');
    this.menuLink = document.getElementById('outletModalMenuLink');

    this.modal.querySelectorAll('[data-dismiss="modal"]').forEach((element) => {
      element.addEventListener('click', () => this.close());
    });
  }

  static open(outlet) {
    if (!this.modal) this.setup();
    this.title.textContent = outlet.name;
    this.body.innerHTML = `
      <p><strong>Location:</strong> ${outlet.location}</p>
      <p><strong>Timings:</strong> ${outlet.timings}</p>
      <p>${outlet.description}</p>
      <p><strong>Categories:</strong> ${outlet.categories.join(', ')}</p>
    `;
    this.menuLink.href = `/orders?outlet=${encodeURIComponent(outlet.name)}`;
    this.modal.hidden = false;
    this.modal.setAttribute('aria-hidden', 'false');
  }

  static close() {
    if (!this.modal) return;
    this.modal.hidden = true;
    this.modal.setAttribute('aria-hidden', 'true');
  }
}

class OutletPage {
  constructor() {
    this.grid = document.getElementById('outletGrid');
    this.emptyState = document.getElementById('outletEmptyState');
    this.categoryChips = document.getElementById('outletCategoryFilters');
    this.searchInput = document.getElementById('outletSearch');
    this.sortSelect = document.getElementById('outletSort');
    this.items = [];
    this.filteredItems = [];
    this.selectedCategory = 'all';

    this.dataLoader = window.dataLoader;
    OutletModal.setup();
    this.init();
  }

  async init() {
    await this.loadOutlets();
    this.populateCategories();
    this.bindEvents();
    this.applyFilters();
  }

  async loadOutlets() {
    try {
      const { outlets = [] } = await this.fetchFromApi('/api/outlets');
      if (outlets.length) {
        this.items = outlets.map((outlet) => new OutletModel(outlet));
        return;
      }
    } catch (error) {
      console.warn('API outlet fetch failed, using JSON fallback', error);
    }

    const fallback = await this.dataLoader.loadRestaurants();
    this.items = (fallback.restaurants || []).map((outlet) => new OutletModel({
      ...outlet,
      location: outlet.location || 'On campus',
      timings: outlet.timings || '9:00 AM - 11:00 PM',
    }));
  }

  async fetchFromApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  populateCategories() {
    const categories = new Set();
    this.items.forEach((outlet) => {
      outlet.categories.forEach((category) => categories.add(category));
    });

    const allChip = this.createChip('All', 'all', true);
    this.categoryChips.appendChild(allChip);

    Array.from(categories)
      .sort()
      .forEach((category) => {
        this.categoryChips.appendChild(
          this.createChip(category, category, false)
        );
      });
  }

  createChip(label, value, selected) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${selected ? 'chip-active' : ''}`;
    chip.dataset.value = value;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      this.categoryChips
        .querySelectorAll('.chip')
        .forEach((node) => node.classList.remove('chip-active'));
      chip.classList.add('chip-active');
      this.selectedCategory = value;
      this.applyFilters();
    });
    return chip;
  }

  bindEvents() {
    const debouncedSearch = this.debounce(() => this.applyFilters(), 300);
    this.searchInput.addEventListener('input', debouncedSearch);
    this.sortSelect.addEventListener('change', () => this.applyFilters());
  }

  applyFilters() {
    const query = this.searchInput.value.trim();

    this.filteredItems = this.items
      .filter((outlet) => outlet.matchesQuery(query))
      .filter((outlet) => outlet.hasCategory(this.selectedCategory));

    this.sortOutlets(this.filteredItems);
    this.renderOutlets();
  }

  sortOutlets(outlets) {
    const sortValue = this.sortSelect.value;
    switch (sortValue) {
      case 'recent':
        outlets.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'popular':
        outlets.sort((a, b) => b.categories.length - a.categories.length);
        break;
      default:
        outlets.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  renderOutlets() {
    this.grid.innerHTML = '';
    if (this.filteredItems.length === 0) {
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    this.filteredItems.forEach((outlet) => {
      fragment.appendChild(outlet.renderCard());
    });
    this.grid.appendChild(fragment);
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
  if (document.body.classList.contains('page-outlets')) {
    new OutletPage();
  }
});

