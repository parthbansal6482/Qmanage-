# JSON Data Files

This directory contains JSON data files that power the Qmanage food ordering website.

## File Structure

### restaurants.json
Contains information about all restaurants/cafes available on the platform.

**Structure:**
```json
{
  "restaurants": [
    {
      "id": "unique-id",
      "name": "Restaurant Name",
      "description": "Short description",
      "image": "URL to restaurant image",
      "banner": "URL to banner image",
      "promo": {
        "discount": "Discount percentage",
        "description": "Promo description"
      },
      "categories": ["Array", "of", "available", "categories"]
    }
  ]
}
```

### menu-items.json
Contains menu items for each restaurant organized by categories.

**Structure:**
```json
{
  "menuItems": {
    "Restaurant Name": {
      "Category Name": [
        {
          "id": "unique-item-id",
          "name": "Item Name",
          "price": 99.00,
          "img": "URL to item image",
          "featured": true/false,
          "rating": 4.5,
          "description": "Item description"
        }
      ]
    }
  }
}
```

### best-selling.json
Contains the best selling products displayed on the home page.

**Structure:**
```json
{
  "bestSelling": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "price": 12.00,
      "image": "URL to product image",
      "rating": 4.5,
      "description": "Product description",
      "featured": true/false
    }
  ]
}
```

### featured-products.json
Contains featured products displayed on the home page.

**Structure:**
```json
{
  "featuredProducts": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "price": 12.00,
      "image": "URL to product image",
      "rating": 4.5,
      "description": "Product description",
      "featured": true/false
    }
  ]
}
```

## Usage

The data is loaded dynamically using the `DataLoader` class in `js/data-loader.js`. This allows for:

1. **Easy content management** - Update content by editing JSON files
2. **Caching** - Data is cached for better performance
3. **Error handling** - Graceful fallbacks if data fails to load
4. **Modularity** - Each data type is in its own file

## Adding New Data

1. **New Restaurant**: Add to `restaurants.json` and create corresponding menu in `menu-items.json`
2. **New Menu Item**: Add to the appropriate restaurant section in `menu-items.json`
3. **New Product**: Add to `best-selling.json` or `featured-products.json`

## Data Validation

Ensure all JSON files are valid JSON format. You can validate using:
- Online JSON validators
- VS Code JSON validation
- Browser developer tools

## Performance Notes

- Data is cached after first load
- Use appropriate image sizes for web
- Keep descriptions concise for better UX
- Use consistent naming conventions
