/**
 * Database Seeding Script
 * Populates MongoDB with outlets and menu items from JSON files
 * 
 * Usage: node scripts/seed.js
 * Or: npm run seed (after adding script to package.json)
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const Outlet = require('../models/Outlet');
const MenuItem = require('../models/MenuItem');

// Database connection
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qmanage';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Read JSON file
const readJson = async (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'json', filename);
    const fileContents = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    throw error;
  }
};

// Seed Outlets
const seedOutlets = async () => {
  try {
    console.log('\n📦 Seeding Outlets...');
    
    const { restaurants } = await readJson('restaurants.json');
    
    // Clear existing outlets (optional - comment out if you want to keep existing data)
    // await Outlet.deleteMany({});
    // console.log('  Cleared existing outlets');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const restaurant of restaurants) {
      // Check if outlet already exists by name
      const existing = await Outlet.findOne({ name: restaurant.name });
      
      if (existing) {
        // Update existing outlet
        existing.location = restaurant.location || existing.location;
        existing.timings = restaurant.timings || existing.timings;
        existing.description = restaurant.description || existing.description;
        existing.image = restaurant.image || existing.image;
        existing.categories = restaurant.categories || existing.categories;
        await existing.save();
        updated++;
        console.log(`  ✓ Updated: ${restaurant.name}`);
      } else {
        // Create new outlet
        await Outlet.create({
          name: restaurant.name,
          location: restaurant.location || 'On campus',
          timings: restaurant.timings || '9:00 AM - 11:00 PM',
          description: restaurant.description || 'Serving fresh food daily.',
          image: restaurant.image || '/img/373.png',
          categories: restaurant.categories || [],
        });
        created++;
        console.log(`  ✓ Created: ${restaurant.name}`);
      }
    }
    
    console.log(`\n✅ Outlets seeded: ${created} created, ${updated} updated, ${skipped} skipped`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding outlets:', error.message);
    return false;
  }
};

// Seed Menu Items
const seedMenuItems = async () => {
  try {
    console.log('\n📦 Seeding Menu Items...');
    
    const { menuItems } = await readJson('menu-items.json');
    
    // Clear existing menu items (optional - comment out if you want to keep existing data)
    // await MenuItem.deleteMany({});
    // console.log('  Cleared existing menu items');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // Iterate through each outlet's menu
    for (const [outletName, categories] of Object.entries(menuItems)) {
      // Find the outlet by name
      const outlet = await Outlet.findOne({ name: outletName });
      
      if (!outlet) {
        console.log(`  ⚠️  Outlet "${outletName}" not found, skipping menu items`);
        skipped++;
        continue;
      }
      
      // Iterate through categories
      for (const [category, items] of Object.entries(categories)) {
        if (!Array.isArray(items)) continue;
        
        // Process each menu item
        for (const item of items) {
          // Check if menu item already exists (by name and outlet)
          const existing = await MenuItem.findOne({
            name: item.name,
            outlet: outlet._id
          });
          
          if (existing) {
            // Update existing item
            existing.price = item.price || existing.price;
            existing.category = category || existing.category;
            existing.description = item.description || existing.description;
            existing.image = item.img || item.image || existing.image;
            existing.isAvailable = item.isAvailable !== undefined ? item.isAvailable : true;
            await existing.save();
            updated++;
          } else {
            // Create new menu item
            await MenuItem.create({
              name: item.name,
              price: item.price || 0,
              category: category || 'General',
              description: item.description || 'Freshly prepared and ready to serve.',
              image: item.img || item.image || '/img/373.png',
              isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
              outlet: outlet._id,
            });
            created++;
          }
        }
      }
      
      console.log(`  ✓ Processed menu for: ${outletName}`);
    }
    
    console.log(`\n✅ Menu items seeded: ${created} created, ${updated} updated, ${skipped} skipped`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding menu items:', error.message);
    return false;
  }
};

// Main seeding function
const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Seed outlets first (menu items depend on outlets)
    const outletsSuccess = await seedOutlets();
    
    if (!outletsSuccess) {
      console.error('❌ Failed to seed outlets. Aborting.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    // Seed menu items
    const menuItemsSuccess = await seedMenuItems();
    
    if (!menuItemsSuccess) {
      console.error('❌ Failed to seed menu items.');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Seeding completed!');
    console.log('✅ MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeding
if (require.main === module) {
  seed();
}

module.exports = { seed, seedOutlets, seedMenuItems };

