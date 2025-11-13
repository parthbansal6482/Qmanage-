const path = require('path');
const fs = require('fs/promises');

const jsonDir = path.join(__dirname, '..', 'public', 'json');

const readJson = async (filename, fallback = {}) => {
  try {
    const filePath = path.join(jsonDir, filename);
    const fileContents = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.warn(`⚠️ Could not load ${filename}, using fallback data`, error);
    return fallback;
  }
};

exports.getMenuSamples = async () =>
  readJson('menu-items.json', { menuItems: {} });

exports.getOutletSamples = async () =>
  readJson('restaurants.json', { restaurants: [] });

exports.getBestSellingSamples = async () =>
  readJson('best-selling.json', { bestSelling: [] });

exports.getFeaturedSamples = async () =>
  readJson('featured-products.json', { featuredProducts: [] });

