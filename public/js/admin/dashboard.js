class AdminDashboard {
  constructor() {
    this.pendingEl = document.getElementById('statPendingOrders');
    this.completedEl = document.getElementById('statCompletedOrders');
    this.loadStats();
    this.startAutoRefresh();
  }

  async loadStats() {
    try {
      const orders = await this.fetchOrders();
      const pending = orders.filter((order) => order.status !== 'completed').length;
      const completedToday = orders.filter((order) => {
        if (order.status !== 'completed') return false;
        const created = new Date(order.updatedAt || order.createdAt);
        const now = new Date();
        return created.toDateString() === now.toDateString();
      }).length;

      this.pendingEl.textContent = pending;
      this.completedEl.textContent = completedToday;
    } catch (error) {
      console.error('Unable to refresh dashboard stats', error);
    }
  }

  async fetchOrders() {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const data = await response.json();
    return data.orders || [];
  }

  startAutoRefresh() {
    setInterval(() => this.loadStats(), 60000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-admin')) {
    new AdminDashboard();
  }
});

