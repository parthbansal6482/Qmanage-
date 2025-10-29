/**
 * Order page JavaScript functionality
 * Contains menu data and order page specific functionality
 */

// Category metadata
const categoryMeta = {
    'Pizza': 'https://img.icons8.com/emoji/96/pizza-emoji.png',
    'Fruits': 'https://img.icons8.com/emoji/96/green-apple.png',
    'Snacks': 'https://img.icons8.com/?size=100&id=97192&format=png&color=000000',
    'Veggies': 'https://img.icons8.com/?size=100&id=20875&format=png&color=000000',
    'Hotdog': 'https://img.icons8.com/?size=100&id=2AIrctH82xog&format=png&color=000000',
    'Burger': 'https://img.icons8.com/?size=100&id=erEevcUCwAMR&format=png&color=000000',
    'Drink': 'https://img.icons8.com/?size=100&id=lyMuG44EXuxH&format=png&color=000000'
};

const DEFAULT_CATEGORIES = ['Pizza','Fruits','Snacks','Veggies','Hotdog','Burger','Drink'];

// Order page functionality
class OrderPage {
    constructor() {
        this.cafe = this.getCafeFromURL();
        this.menu = {};
        this.selectedCategory = DEFAULT_CATEGORIES[0];
        this.dataLoader = window.dataLoader;
        this.init();
    }

    getCafeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('cafe') || 'Cafe';
    }

    async init() {
        this.updatePageTitle();
        await this.loadMenuData();
        this.renderCategories();
        this.renderItems();
    }

    async loadMenuData() {
        try {
            this.menu = await this.dataLoader.getMenuForRestaurant(this.cafe);
            console.log('Menu loaded for', this.cafe, ':', this.menu);
        } catch (error) {
            console.error('Error loading menu data:', error);
            // Fallback to empty menu
            this.menu = {};
        }
    }

    updatePageTitle() {
        const title = document.getElementById('cafeName');
        if (title) {
            title.textContent = `"${this.cafe}"`;
            document.title = `Qmanage - ${this.cafe}`;
        }
    }

    renderCategories() {
        const categoryRow = document.getElementById('categoryRow');
        if (!categoryRow) return;

        categoryRow.innerHTML = '';
        DEFAULT_CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-chip' + (cat === this.selectedCategory ? ' selected' : '');
            
            const img = document.createElement('img');
            img.src = categoryMeta[cat];
            img.alt = cat;
            
            const label = document.createElement('span');
            label.textContent = cat;
            
            btn.appendChild(img);
            btn.appendChild(label);
            
            btn.addEventListener('click', () => {
                this.selectedCategory = cat;
                this.renderCategories();
                this.renderItems();
                document.getElementById('items').scrollIntoView({behavior:'smooth'});
            });
            
            categoryRow.appendChild(btn);
        });
    }

    starRating(n) {
        const full = Math.max(0, Math.min(5, Math.round(n || 4)));
        return '★★★★★☆☆☆☆☆'.slice(5-full, 10-full);
    }

    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) return;

        const items = (this.menu[this.selectedCategory] || []).slice(0);
        
        if (items.length === 0) {
            itemsGrid.innerHTML = '<p>No items found in this category.</p>';
            return;
        }
        
        itemsGrid.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'food-card' + (item.featured ? ' featured' : '');
            card.innerHTML = `
                <img class="food-img" src="${item.img}" alt="${item.name}">
                <h3 class="food-title">${item.name}</h3>
                <div class="food-rating">${this.starRating(item.rating)}</div>
                <div class="food-price">₹ ${item.price.toFixed(2)}</div>
                <button class="food-add add-to-cart">+</button>
            `;
            itemsGrid.appendChild(card);
        });
    }
}

// Initialize order page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize order page functionality if we're on the order page
    if (window.location.pathname.includes('order.html')) {
        new OrderPage();
    }
});
