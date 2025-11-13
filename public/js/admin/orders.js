class AdminOrderManager {
  constructor() {
    this.tableBody = document.querySelector('#ordersTable tbody');
    this.tableEmptyState = document.getElementById('ordersTableEmptyState');
    this.filterStatus = document.getElementById('orderFilterStatus');
    this.filterOutlet = document.getElementById('orderFilterOutlet');
    this.searchInput = document.getElementById('orderSearch');
    this.modal = document.getElementById('orderDetailsModal');
    this.modalBody = document.getElementById('orderDetailsBody');
    this.modalTitle = document.getElementById('orderDetailsTitle');

    this.orders = [];
    this.filteredOrders = [];

    this.bindEvents();
    this.loadData();
    this.startAutoRefresh();
  }

  bindEvents() {
    this.filterStatus.addEventListener('change', () => this.applyFilters());
    this.filterOutlet.addEventListener('change', () => this.applyFilters());
    this.searchInput.addEventListener('input', () => this.applyFilters());

    this.tableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const row = button.closest('tr');
      const orderId = row?.dataset.orderId;
      if (!orderId) return;

      if (button.dataset.action === 'view') {
        this.openDetails(orderId);
      }
    });

    this.tableBody.addEventListener('change', (event) => {
      const select = event.target.closest('select[data-order-id]');
      if (!select) return;
      this.updateStatus(select.dataset.orderId, select.value);
    });

    this.modal
      .querySelectorAll('[data-dismiss="modal"]')
      .forEach((el) => el.addEventListener('click', () => this.closeModal()));
  }

  async loadData() {
    await Promise.all([this.loadOutlets(), this.loadOrders()]);
  }

  async loadOutlets() {
    try {
      const response = await fetch('/api/outlets');
      if (!response.ok) throw new Error('Failed to fetch outlets');
      const data = await response.json();
      const outlets = data.outlets || [];
      outlets.forEach((outlet) => {
        const option = document.createElement('option');
        option.value = outlet._id;
        option.textContent = outlet.name;
        this.filterOutlet.appendChild(option);
      });
    } catch (error) {
      console.error('Unable to load outlets for filter', error);
    }
  }

  async loadOrders() {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      this.orders = data.orders || [];
      this.applyFilters();
    } catch (error) {
      console.error('Unable to load orders', error);
      this.showToast('Unable to load orders. Please refresh.', 'error');
    }
  }

  applyFilters() {
    const statusFilter = this.filterStatus.value;
    const outletFilter = this.filterOutlet.value;
    const query = this.searchInput.value.trim().toLowerCase();

    this.filteredOrders = this.orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesOutlet =
        outletFilter === 'all' || order.outlet?._id === outletFilter;
      const matchesQuery =
        !query ||
        `${order._id} ${order.customer?.name || ''} ${order.outlet?.name || ''}`
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesOutlet && matchesQuery;
    });

    this.renderTable();
  }

  renderTable() {
    this.tableBody.innerHTML = '';
    if (this.filteredOrders.length === 0) {
      this.tableEmptyState.hidden = false;
      return;
    }

    this.tableEmptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    this.filteredOrders.forEach((order) => {
      const row = document.createElement('tr');
      row.dataset.orderId = order._id;
      row.innerHTML = `
        <td data-label="Order">${order._id}</td>
        <td data-label="Customer">${order.customer?.name || '—'}</td>
        <td data-label="Outlet">${order.outlet?.name || '—'}</td>
        <td data-label="Total">₹${Number(order.totalAmount || 0).toFixed(2)}</td>
        <td data-label="Status">
          <select data-order-id="${order._id}" class="control-input control-small">
            ${this.renderStatusOptions(order.status)}
          </select>
        </td>
        <td data-label="Updated">${new Date(order.updatedAt || order.createdAt).toLocaleString()}</td>
        <td data-label="Actions" class="table-actions">
          <button class="btn-link" data-action="view">Details</button>
        </td>
      `;
      fragment.appendChild(row);
    });
    this.tableBody.appendChild(fragment);
  }

  renderStatusOptions(selected) {
    const statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    return statuses
      .map(
        (status) =>
          `<option value="${status}" ${status === selected ? 'selected' : ''}>${status}</option>`
      )
      .join('');
  }

  async updateStatus(orderId, status) {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      this.showToast('Order status updated.', 'success');
      await this.loadOrders();
    } catch (error) {
      console.error('Unable to update order status', error);
      this.showToast('Unable to update order status.', 'error');
    }
  }

  openDetails(orderId) {
    const order = this.orders.find((entry) => entry._id === orderId);
    if (!order) return;
    this.modalTitle.textContent = `Order ${order._id}`;
    this.modalBody.innerHTML = `
      <div class="order-detail">
        <p><strong>Customer:</strong> ${order.customer?.name || '—'}</p>
        <p><strong>Email:</strong> ${order.customer?.email || '—'}</p>
        <p><strong>Phone:</strong> ${order.customer?.phone || '—'}</p>
        <p><strong>Outlet:</strong> ${order.outlet?.name || '—'}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> ₹${Number(order.totalAmount || 0).toFixed(2)}</p>
      </div>
      <h3>Items</h3>
      <ul class="order-items-list">
        ${(order.items || [])
          .map(
            (item) =>
              `<li>${item.quantity} × ${item.name} <span>₹${(item.price * item.quantity).toFixed(2)}</span></li>`
          )
          .join('')}
      </ul>
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
    `;
    this.modal.hidden = false;
    this.modal.setAttribute('aria-hidden', 'false');
  }

  closeModal() {
    this.modal.hidden = true;
    this.modal.setAttribute('aria-hidden', 'true');
  }

  showToast(message, type) {
    window.Utils.NotificationManager.show(message, type, 2000);
  }

  startAutoRefresh() {
    // Refresh orders every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.loadOrders();
    }, 5000);

    // Also refresh when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.loadOrders();
      }
    });
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-admin')) {
    new AdminOrderManager();
  }
});

