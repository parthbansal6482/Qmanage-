class AdminMenuItemManager {
  constructor() {
    this.form = document.getElementById('menuItemForm');
    this.formFeedback = document.getElementById('menuItemFormFeedback');
    this.resetButton = document.getElementById('menuItemFormReset');
    this.outletSelect = document.getElementById('menuItemOutlet');
    this.categoryInput = document.getElementById('menuItemCategory');
    this.tableBody = document.querySelector('#menuItemTable tbody');
    this.tableEmptyState = document.getElementById('menuItemTableEmptyState');
    this.searchInput = document.getElementById('menuItemSearch');
    this.filterOutlet = document.getElementById('menuItemFilterOutlet');

    this.items = [];
    this.outlets = [];
    this.filteredItems = [];
    this.currentEditId = null;

    this.bindEvents();
    this.loadInitialData();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveMenuItem();
    });

    this.resetButton.addEventListener('click', () => this.resetForm());
    this.searchInput.addEventListener('input', () => this.applyFilters());
    this.filterOutlet.addEventListener('change', () => this.applyFilters());

    this.tableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const row = button.closest('tr');
      const itemId = row?.dataset.itemId;
      if (!itemId) return;

      if (button.dataset.action === 'edit') {
        this.populateForm(itemId);
      } else if (button.dataset.action === 'delete') {
        this.deleteMenuItem(itemId);
      }
    });
  }

  async loadInitialData() {
    await Promise.all([this.loadOutlets(), this.loadMenuItems()]);
  }

  async loadOutlets() {
    try {
      const response = await fetch('/api/outlets');
      if (!response.ok) throw new Error('Failed to fetch outlets');
      const data = await response.json();
      this.outlets = data.outlets || [];
      this.populateOutletSelects();
    } catch (error) {
      console.error('Unable to load outlets', error);
      this.showFeedback('Unable to load outlets. Please refresh.', 'error');
    }
  }

  populateOutletSelects() {
    this.outletSelect.innerHTML = '<option value="">Select an outlet</option>';
    this.filterOutlet.innerHTML = '<option value="all">All outlets</option>';

    this.outlets.forEach((outlet) => {
      const option = document.createElement('option');
      option.value = outlet._id;
      option.textContent = outlet.name;
      this.outletSelect.appendChild(option);

      const filterOption = option.cloneNode(true);
      this.filterOutlet.appendChild(filterOption);
    });
  }

  async loadMenuItems() {
    try {
      const response = await fetch('/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      this.items = data.menuItems || [];
      this.applyFilters();
    } catch (error) {
      console.error('Unable to load menu items', error);
      this.showFeedback('Unable to load menu items. Please refresh.', 'error');
    }
  }

  applyFilters() {
    const query = this.searchInput.value.trim().toLowerCase();
    const outletFilter = this.filterOutlet.value;

    this.filteredItems = this.items.filter((item) => {
      const matchesQuery =
        !query ||
        `${item.name} ${item.category} ${item.outlet?.name || ''}`
          .toLowerCase()
          .includes(query);

      const matchesOutlet =
        outletFilter === 'all' || item.outlet?._id === outletFilter;

      return matchesQuery && matchesOutlet;
    });

    this.renderTable();
  }

  renderTable() {
    this.tableBody.innerHTML = '';
    if (this.filteredItems.length === 0) {
      this.tableEmptyState.hidden = false;
      return;
    }

    this.tableEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    this.filteredItems.forEach((item) => {
      const row = document.createElement('tr');
      row.dataset.itemId = item._id;
      row.innerHTML = `
        <td data-label="Name">${item.name}</td>
        <td data-label="Outlet">${item.outlet?.name || '—'}</td>
        <td data-label="Category">${item.category}</td>
        <td data-label="Price">₹${Number(item.price || 0).toFixed(2)}</td>
        <td data-label="Availability">
          <span class="status-badge status-${item.isAvailable ? 'success' : 'warning'}">
            ${item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </td>
        <td data-label="Actions" class="table-actions">
          <button class="btn-link" data-action="edit">Edit</button>
          <button class="btn-link text-danger" data-action="delete">Delete</button>
        </td>
      `;
      fragment.appendChild(row);
    });
    this.tableBody.appendChild(fragment);
  }

  populateForm(itemId) {
    const item = this.items.find((entry) => entry._id === itemId);
    if (!item) return;
    this.currentEditId = itemId;
    this.form.querySelector('#menuItemId').value = itemId;
    this.outletSelect.value = item.outlet?._id || '';
    this.form.querySelector('#menuItemName').value = item.name || '';
    this.categoryInput.value = item.category || '';
    this.form.querySelector('#menuItemPrice').value = Number(item.price || 0);
    this.form.querySelector('#menuItemImage').value = item.image || '';
    this.form.querySelector('#menuItemDescription').value = item.description || '';
    this.form.querySelector('#menuItemAvailability').checked = Boolean(item.isAvailable);
  }

  async saveMenuItem() {
    const formData = new FormData(this.form);
    const payload = {
      outlet: (formData.get('menuItemOutlet') || '').trim(),
      name: (formData.get('menuItemName') || '').trim(),
      category: (formData.get('menuItemCategory') || '').trim(),
      price: Number(formData.get('menuItemPrice')),
      image: (formData.get('menuItemImage') || '').trim() || undefined,
      description: (formData.get('menuItemDescription') || '').trim(),
      isAvailable: formData.get('menuItemAvailability') === 'on',
    };

    if (
      !payload.outlet ||
      !payload.name ||
      !payload.category ||
      Number.isNaN(payload.price) ||
      payload.price <= 0
    ) {
      this.showFeedback('Please fill in all required fields.', 'error');
      return;
    }

    const isEditing = Boolean(this.currentEditId);
    try {
      const response = await fetch(
        isEditing ? `/api/menu-items/${this.currentEditId}` : '/api/menu-items',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error('Failed to save menu item');

      this.showFeedback(
        `Menu item ${isEditing ? 'updated' : 'created'} successfully.`,
        'success'
      );
      this.resetForm();
      await this.loadMenuItems();
    } catch (error) {
      console.error('Unable to save menu item', error);
      this.showFeedback('Unable to save menu item. Please try again.', 'error');
    }
  }

  async deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete menu item');
      this.showFeedback('Menu item deleted successfully.', 'success');
      await this.loadMenuItems();
    } catch (error) {
      console.error('Unable to delete menu item', error);
      this.showFeedback('Unable to delete menu item. Please try again.', 'error');
    }
  }

  resetForm() {
    this.form.reset();
    this.currentEditId = null;
    this.formFeedback.hidden = true;
    this.outletSelect.value = '';
  }

  showFeedback(message, type) {
    if (!this.formFeedback) return;
    this.formFeedback.hidden = false;
    this.formFeedback.textContent = message;
    this.formFeedback.className = `form-feedback form-feedback-${type}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-admin')) {
    new AdminMenuItemManager();
  }
});

