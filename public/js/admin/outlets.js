class AdminOutletManager {
  constructor() {
    this.form = document.getElementById('outletForm');
    this.formFeedback = document.getElementById('outletFormFeedback');
    this.resetButton = document.getElementById('outletFormReset');
    this.tableBody = document.querySelector('#outletTable tbody');
    this.tableEmptyState = document.getElementById('outletTableEmptyState');
    this.searchInput = document.getElementById('outletAdminSearch');

    this.outlets = [];
    this.filteredOutlets = [];
    this.currentEditId = null;

    this.bindEvents();
    this.loadOutlets();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveOutlet();
    });

    this.resetButton.addEventListener('click', () => this.resetForm());
    this.searchInput.addEventListener('input', () => this.applyFilter());

    this.tableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const row = button.closest('tr');
      const outletId = row?.dataset.outletId;
      if (!outletId) return;

      if (button.dataset.action === 'edit') {
        this.populateForm(outletId);
      } else if (button.dataset.action === 'delete') {
        this.deleteOutlet(outletId);
      }
    });
  }

  async loadOutlets() {
    try {
      const response = await fetch('/api/outlets');
      if (!response.ok) throw new Error('Failed to fetch outlets');
      const data = await response.json();
      this.outlets = data.outlets || [];
      this.applyFilter();
    } catch (error) {
      console.error('Unable to load outlets', error);
      this.showFeedback('Unable to load outlets. Please try again.', 'error');
    }
  }

  applyFilter() {
    const query = this.searchInput.value.trim().toLowerCase();
    this.filteredOutlets = this.outlets.filter((outlet) => {
      if (!query) return true;
      const target = `${outlet.name} ${outlet.location} ${outlet.timings}`.toLowerCase();
      return target.includes(query);
    });
    this.renderTable();
  }

  renderTable() {
    this.tableBody.innerHTML = '';
    if (this.filteredOutlets.length === 0) {
      this.tableEmptyState.hidden = false;
      return;
    }

    this.tableEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    this.filteredOutlets.forEach((outlet) => {
      const row = document.createElement('tr');
      row.dataset.outletId = outlet._id;
      row.innerHTML = `
        <td data-label="Name">${outlet.name}</td>
        <td data-label="Location">${outlet.location}</td>
        <td data-label="Timings">${outlet.timings}</td>
        <td data-label="Actions" class="table-actions">
          <button class="btn-link" data-action="edit">Edit</button>
          <button class="btn-link text-danger" data-action="delete">Delete</button>
        </td>
      `;
      fragment.appendChild(row);
    });
    this.tableBody.appendChild(fragment);
  }

  populateForm(outletId) {
    const outlet = this.outlets.find((item) => item._id === outletId);
    if (!outlet) return;
    this.currentEditId = outletId;
    this.form.querySelector('#outletId').value = outletId;
    this.form.querySelector('#outletName').value = outlet.name;
    this.form.querySelector('#outletLocation').value = outlet.location || '';
    this.form.querySelector('#outletTimings').value = outlet.timings || '';
    this.form.querySelector('#outletDescription').value = outlet.description || '';
    this.form.querySelector('#outletImage').value = outlet.image || '';
    this.form.querySelector('#outletCategories').value = (outlet.categories || []).join(', ');
  }

  async saveOutlet() {
    const formData = new FormData(this.form);
    const payload = {
      name: (formData.get('outletName') || '').trim(),
      location: (formData.get('outletLocation') || '').trim(),
      timings: (formData.get('outletTimings') || '').trim(),
      description: (formData.get('outletDescription') || '').trim(),
      image: (formData.get('outletImage') || '').trim() || undefined,
      categories: (formData.get('outletCategories') || '')
        .split(',')
        .map((cat) => cat.trim())
        .filter(Boolean),
    };

    if (!payload.name || !payload.location || !payload.timings) {
      this.showFeedback('Name, location, and timings are required.', 'error');
      return;
    }

    const isEditing = Boolean(this.currentEditId);

    try {
      const response = await fetch(
        isEditing ? `/api/outlets/${this.currentEditId}` : '/api/outlets',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save outlet');
      }

      this.showFeedback(
        `Outlet ${isEditing ? 'updated' : 'created'} successfully.`,
        'success'
      );
      this.resetForm();
      await this.loadOutlets();
    } catch (error) {
      console.error('Unable to save outlet', error);
      this.showFeedback('Unable to save outlet. Please try again.', 'error');
    }
  }

  async deleteOutlet(outletId) {
    if (!confirm('Are you sure you want to delete this outlet?')) return;
    try {
      const response = await fetch(`/api/outlets/${outletId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete outlet');
      this.showFeedback('Outlet deleted successfully.', 'success');
      await this.loadOutlets();
    } catch (error) {
      console.error('Unable to delete outlet', error);
      this.showFeedback('Unable to delete outlet. Please try again.', 'error');
    }
  }

  resetForm() {
    this.form.reset();
    this.currentEditId = null;
    this.formFeedback.hidden = true;
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
    new AdminOutletManager();
  }
});

