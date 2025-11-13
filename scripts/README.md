# Database Seeding Scripts

This directory contains scripts to populate the MongoDB database with sample data.

## Seeding the Database

### Quick Start

1. **Make sure MongoDB is running** (local or remote)

2. **Run the seed script:**
   ```bash
   npm run seed
   ```
   
   Or directly:
   ```bash
   node scripts/seed.js
   ```

### What the Seed Script Does

The `seed.js` script will:

1. **Connect to MongoDB** (uses `MONGODB_URI` from `.env` or defaults to `mongodb://127.0.0.1:27017/qmanage`)

2. **Seed Outlets** from `public/json/restaurants.json`:
   - Creates outlets if they don't exist
   - Updates existing outlets if they already exist
   - Includes: name, location, timings, description, image, categories

3. **Seed Menu Items** from `public/json/menu-items.json`:
   - Creates menu items for each outlet
   - Links menu items to outlets by name
   - Includes: name, price, category, description, image, availability

### Environment Variables

You can set these in a `.env` file:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/qmanage
```

### Notes

- The script will **update** existing outlets/items if they already exist (by name)
- To **clear and reseed**, uncomment the `deleteMany()` lines in the script
- The script is **idempotent** - safe to run multiple times

### Troubleshooting

**Error: "MongoDB connection error"**
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env` or use the default local connection

**Error: "Outlet not found"**
- Make sure outlets are seeded before menu items (the script does this automatically)
- Check that outlet names in `menu-items.json` match outlet names in `restaurants.json`

**Error: "E11000 duplicate key"**
- This means an item with the same name already exists for that outlet
- The script handles this by updating existing items, but if you see this error, there might be a unique constraint issue

