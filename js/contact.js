/**
 * Contact page JavaScript functionality
 * Contains form handling and contact page specific functionality
 */

class ContactPage {
    constructor() {
        this.form = document.querySelector('.contact-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.bindFormEvents();
        }
    }

    bindFormEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Add real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required.`;
        }

        // Email validation
        if (fieldName === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        }

        // Phone validation
        if (fieldName === 'phone' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number.';
            }
        }

        // Name validation
        if (fieldName === 'name' && value) {
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long.';
            }
        }

        // Message validation
        if (fieldName === 'message' && value) {
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters long.';
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    getFieldLabel(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent : field.name;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    handleFormSubmit() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input, textarea, select');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showFormError('Please correct the errors above.');
            return;
        }

        // Show loading state
        this.showLoadingState();

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            this.hideLoadingState();
            this.showSuccessMessage();
            this.form.reset();
        }, 2000);
    }

    showLoadingState() {
        const submitBtn = this.form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="loading-spinner"></span>
                Sending Message...
            `;
        }
    }

    hideLoadingState() {
        const submitBtn = this.form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                Send Message
                <span class="arrow-icon">→</span>
            `;
        }
    }

    showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'form-success';
        successMessage.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✓</span>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
            </div>
        `;
        
        this.form.parentNode.insertBefore(successMessage, this.form);
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 5000);
    }

    showFormError(message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'form-error';
        errorMessage.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠</span>
                <p>${message}</p>
            </div>
        `;
        
        this.form.parentNode.insertBefore(errorMessage, this.form);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
}

// Newsletter subscription functionality
class NewsletterSubscription {
    constructor() {
        this.newsletterForms = document.querySelectorAll('.newsletter-form');
        this.init();
    }

    init() {
        this.newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubscription(form);
            });
        });
    }

    handleNewsletterSubscription(form) {
        const emailInput = form.querySelector('.newsletter-input');
        const submitBtn = form.querySelector('.newsletter-btn');
        
        if (!emailInput || !submitBtn) return;

        const email = emailInput.value.trim();
        
        if (!this.validateEmail(email)) {
            this.showNewsletterError(form, 'Please enter a valid email address.');
            return;
        }

        // Show loading state
        this.showNewsletterLoading(submitBtn);

        // Simulate subscription (replace with actual API call)
        setTimeout(() => {
            this.hideNewsletterLoading(submitBtn);
            this.showNewsletterSuccess(form);
            emailInput.value = '';
        }, 1500);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNewsletterLoading(btn) {
        btn.disabled = true;
        btn.textContent = 'Subscribing...';
    }

    hideNewsletterLoading(btn) {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
    }

    showNewsletterSuccess(form) {
        const successMessage = document.createElement('div');
        successMessage.className = 'newsletter-success';
        successMessage.textContent = 'Successfully subscribed to newsletter!';
        
        form.appendChild(successMessage);
        
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 3000);
    }

    showNewsletterError(form, message) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'newsletter-error';
        errorMessage.textContent = message;
        
        form.appendChild(errorMessage);
        
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 3000);
    }
}

// Initialize contact page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize contact page functionality if we're on the contact page
    if (window.location.pathname.includes('contact.html')) {
        new ContactPage();
        new NewsletterSubscription();
    }
});
