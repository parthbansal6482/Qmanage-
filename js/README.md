# JavaScript Files Structure

This directory contains the organized JavaScript files for the Qmanage Food Ordering Website.

## File Structure

### `main.js`
- **Purpose**: Core cart functionality and shared features
- **Contains**: 
  - Cart class with full cart management
  - Add to cart functionality
  - Cart display updates
  - Order placement
  - Notification system

### `order.js`
- **Purpose**: Order page specific functionality
- **Contains**:
  - Menu data for all cafes
  - Category management
  - Item rendering
  - Order page initialization

### `contact.js`
- **Purpose**: Contact page functionality
- **Contains**:
  - Form validation
  - Form submission handling
  - Newsletter subscription
  - Contact form features

### `utils.js`
- **Purpose**: Shared utilities and common functionality
- **Contains**:
  - Dropdown management
  - Smooth scrolling
  - Animation utilities
  - Form validation helpers
  - Local storage utilities
  - Notification system
  - URL management

## Usage

Each HTML file includes the necessary JavaScript files:

- **index.html**: `utils.js`, `main.js`
- **order.html**: `utils.js`, `main.js`, `order.js`
- **contact.html**: `utils.js`, `main.js`, `contact.js`

## Features

### Cart Functionality
- Add/remove items
- Update quantities
- Persistent storage
- Order placement
- Visual notifications

### Order Page
- Dynamic menu loading
- Category filtering
- Cafe-specific menus
- Item management

### Contact Page
- Form validation
- Real-time feedback
- Newsletter subscription
- Success/error handling

### Utilities
- Responsive dropdowns
- Smooth animations
- Form validation
- Local storage management
- Notification system

## Browser Compatibility

All JavaScript files use modern ES6+ features and are compatible with:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

No external dependencies required. All functionality is built with vanilla JavaScript.
