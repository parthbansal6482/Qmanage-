/**
 * Data Loader utility for Qmanage Food Ordering Website
 * Handles loading and caching of JSON data files
 */

class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load JSON data from a file
     * @param {string} url - Path to JSON file
     * @param {boolean} useCache - Whether to use cached data if available
     * @returns {Promise} Promise that resolves with the JSON data
     */
    async loadJSON(url, useCache = true) {
        // Return cached data if available and cache is enabled
        if (useCache && this.cache.has(url)) {
            return this.cache.get(url);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        // Create new loading promise
        const promise = this._fetchJSON(url);
        this.loadingPromises.set(url, promise);

        try {
            const data = await promise;
            this.cache.set(url, data);
            this.loadingPromises.delete(url);
            return data;
        } catch (error) {
            this.loadingPromises.delete(url);
            throw error;
        }
    }

    /**
     * Fetch JSON data from server
     * @param {string} url - Path to JSON file
     * @returns {Promise} Promise that resolves with the JSON data
     */
    async _fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading JSON from ${url}:`, error);
            throw error;
        }
    }

    /**
     * Load restaurants data
     * @returns {Promise} Promise that resolves with restaurants data
     */
    async loadRestaurants() {
        return await this.loadJSON('/json/restaurants.json');
    }

    /**
     * Load menu items data
     * @returns {Promise} Promise that resolves with menu items data
     */
    async loadMenuItems() {
        return await this.loadJSON('/json/menu-items.json');
    }

    /**
     * Load best selling products data
     * @returns {Promise} Promise that resolves with best selling data
     */
    async loadBestSelling() {
        return await this.loadJSON('/json/best-selling.json');
    }

    /**
     * Load featured products data
     * @returns {Promise} Promise that resolves with featured products data
     */
    async loadFeaturedProducts() {
        return await this.loadJSON('/json/featured-products.json');
    }

    /**
     * Get restaurant by name
     * @param {string} name - Restaurant name
     * @returns {Promise} Promise that resolves with restaurant data
     */
    async getRestaurantByName(name) {
        const data = await this.loadRestaurants();
        return data.restaurants.find(restaurant => 
            restaurant.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Get menu for a specific restaurant
     * @param {string} restaurantName - Restaurant name
     * @returns {Promise} Promise that resolves with menu data
     */
    async getMenuForRestaurant(restaurantName) {
        const data = await this.loadMenuItems();
        return data.menuItems[restaurantName] || {};
    }

    /**
     * Clear cache for a specific URL or all URLs
     * @param {string} url - Optional URL to clear, if not provided clears all
     */
    clearCache(url = null) {
        if (url) {
            this.cache.delete(url);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Preload all data files
     * @returns {Promise} Promise that resolves when all data is loaded
     */
    async preloadAll() {
        try {
            const [restaurants, menuItems, bestSelling, featuredProducts] = await Promise.all([
                this.loadRestaurants(),
                this.loadMenuItems(),
                this.loadBestSelling(),
                this.loadFeaturedProducts()
            ]);

            console.log('All data preloaded successfully');
            return {
                restaurants,
                menuItems,
                bestSelling,
                featuredProducts
            };
        } catch (error) {
            console.error('Error preloading data:', error);
            throw error;
        }
    }
}

// Create global instance
window.dataLoader = new DataLoader();

// Export for use in other modules
window.DataLoader = DataLoader;
