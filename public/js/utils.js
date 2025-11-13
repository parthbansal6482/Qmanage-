/**
 * Utility functions for Qmanage Food Ordering Website
 * Contains shared functionality like dropdowns, animations, and common utilities
 */

// Dropdown functionality
class DropdownManager {
    constructor() {
        this.dropdowns = document.querySelectorAll('.dropdown');
        this.init();
    }

    init() {
        this.dropdowns.forEach(dropdown => {
            this.setupDropdown(dropdown);
        });
    }

    setupDropdown(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (!toggle || !content) return;

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown(dropdown, content);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                this.closeDropdown(content);
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown(content);
            }
        });
    }

    toggleDropdown(dropdown, content) {
        const isOpen = content.classList.contains('show');
        
        // Close all other dropdowns
        this.closeAllDropdowns();
        
        if (!isOpen) {
            content.classList.add('show');
            dropdown.classList.add('active');
        }
    }

    closeDropdown(content) {
        content.classList.remove('show');
        const dropdown = content.closest('.dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }

    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            if (content) {
                this.closeDropdown(content);
            }
        });
    }
}

// Smooth scrolling utility
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                this.scrollToTarget(link.getAttribute('href'));
            }
        });
    }

    scrollToTarget(target) {
        // Validate target is a valid selector
        if (!target || target === '#' || target.length <= 1) {
            return;
        }
        
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Animation utilities
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll('.product-card, .feature-item, .contact-card, .faq-item');
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }

    setupHoverAnimations() {
        // Add hover effects to interactive elements
        const interactiveElements = document.querySelectorAll('.product-card, .category-item, .contact-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.classList.add('hover-effect');
            });
            
            element.addEventListener('mouseleave', () => {
                element.classList.remove('hover-effect');
            });
        });
    }
}

// Form validation utilities
class FormValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    static validateMinLength(value, minLength) {
        return value && value.trim().length >= minLength;
    }
}

// Local storage utilities
class StorageManager {
    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
}

// Notification system
class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-text">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });
        
        // Auto hide after duration
        setTimeout(() => {
            this.hide(notification);
        }, duration);
    }

    static hide(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    static getIcon(type) {
        const icons = {
            success: '✓',
            error: '⚠',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// URL utilities
class URLManager {
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setQueryParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    }

    static removeQueryParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    }
}

// Initialize all utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new DropdownManager();
    new SmoothScroll();
    new AnimationManager();
});

// Export utilities for use in other modules
window.Utils = {
    FormValidator,
    StorageManager,
    NotificationManager,
    URLManager
};
