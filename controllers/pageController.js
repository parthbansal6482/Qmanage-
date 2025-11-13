const Outlet = require('../models/Outlet');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const {
  getMenuSamples,
  getOutletSamples,
  getBestSellingSamples,
  getFeaturedSamples,
} = require('../utils/sampleData');

const fetchWithFallback = async (fetcher, fallback) => {
  try {
    const result = await fetcher();
    if (!result || result.length === 0) {
      throw new Error('Empty result');
    }
    return result;
  } catch (error) {
    return fallback();
  }
};

const buildCategoryFallback = async () => {
  const { menuItems } = await getMenuSamples();
  const categorySet = new Set();
  Object.values(menuItems || {}).forEach((outletMenu) => {
    Object.keys(outletMenu || {}).forEach((category) =>
      categorySet.add(category)
    );
  });
  return Array.from(categorySet).sort();
};

exports.renderHome = async (req, res, next) => {
  try {
    const [featuredProductsJson, bestSellingJson, outletsJson] =
      await Promise.all([
        fetchWithFallback(
          async () =>
            MenuItem.find({ isAvailable: true })
              .sort('-updatedAt')
              .limit(6)
              .lean(),
          async () => {
            const { featuredProducts } = await getFeaturedSamples();
            return featuredProducts;
          }
        ),
        fetchWithFallback(
          async () =>
            MenuItem.find({ isAvailable: true })
              .sort('-createdAt')
              .limit(8)
              .lean(),
          async () => {
            const { bestSelling } = await getBestSellingSamples();
            return bestSelling;
          }
        ),
        fetchWithFallback(
          async () => Outlet.find().sort('name').limit(8).lean(),
          async () => {
            const { restaurants } = await getOutletSamples();
            return restaurants;
          }
        ),
      ]);

    res.render('home', {
      title: 'Home',
      bodyClass: 'page-home',
      scripts: ['/js/home.js'],
      featuredProducts: featuredProductsJson,
      bestSelling: bestSellingJson,
      outlets: outletsJson,
    });
  } catch (error) {
    next(error);
  }
};

exports.renderMenu = async (req, res, next) => {
  try {
    const categories = await MenuItem.find()
      .distinct('category')
      .then(async (cats) => {
        if (cats && cats.length > 0) {
          return cats.sort();
        }
        return buildCategoryFallback();
      })
      .catch(async () => buildCategoryFallback());

    res.render('menu', {
      title: 'Menu',
      bodyClass: 'page-menu',
      scripts: ['/js/menu.js'],
      categories,
    });
  } catch (error) {
    next(error);
  }
};

exports.renderOutlets = async (req, res, next) => {
  try {
    res.render('outlets', {
      title: 'Outlets',
      bodyClass: 'page-outlets',
      scripts: ['/js/outlets.js'],
    });
  } catch (error) {
    next(error);
  }
};

exports.renderContact = (req, res) => {
  res.render('contact', {
    title: 'Contact',
    bodyClass: 'page-contact',
    scripts: ['/js/contact.js'],
  });
};

exports.renderCart = (req, res) => {
  res.render('cart', {
    title: 'Cart',
    bodyClass: 'page-cart',
    scripts: ['/js/cart.js'],
  });
};

exports.renderCheckout = async (req, res, next) => {
  try {
    const outlets = await fetchWithFallback(
      async () => Outlet.find().sort('name').lean(),
      async () => {
        const { restaurants } = await getOutletSamples();
        return restaurants;
      }
    );

    res.render('checkout', {
      title: 'Checkout',
      bodyClass: 'page-checkout',
      scripts: ['/js/checkout.js'],
      outlets,
    });
  } catch (error) {
    next(error);
  }
};

exports.renderOrder = async (req, res, next) => {
  try {
    const outlets = await fetchWithFallback(
      async () => Outlet.find().sort('name').lean(),
      async () => {
        const { restaurants } = await getOutletSamples();
        return restaurants;
      }
    );

    res.render('order', {
      title: 'Order',
      bodyClass: 'page-orders',
      scripts: ['/js/order.js'],
      outlets,
    });
  } catch (error) {
    next(error);
  }
};

exports.renderAdminDashboard = async (req, res, next) => {
  try {
    const [totalOutlets, totalMenuItems, recentOrders] = await Promise.all([
      Outlet.countDocuments().catch(() => 0),
      MenuItem.countDocuments().catch(() => 0),
      Order.find()
        .sort('-createdAt')
        .limit(5)
        .populate('outlet', 'name')
        .lean()
        .catch(() => []),
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      bodyClass: 'page-admin',
      scripts: ['/js/admin/dashboard.js'],
      stats: {
        totalOutlets,
        totalMenuItems,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.renderAdminOutlets = (req, res) => {
  res.render('admin/outlets', {
    title: 'Manage Outlets',
    bodyClass: 'page-admin',
    scripts: ['/js/admin/outlets.js'],
  });
};

exports.renderAdminMenu = (req, res) => {
  res.render('admin/menu-items', {
    title: 'Manage Menu Items',
    bodyClass: 'page-admin',
    scripts: ['/js/admin/menu-items.js'],
  });
};

exports.renderAdminOrders = (req, res) => {
  res.render('admin/orders', {
    title: 'Manage Orders',
    bodyClass: 'page-admin',
    scripts: ['/js/admin/orders.js'],
  });
};

