const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Outlet = require('../models/Outlet');

const handleError = (res, error) => {
  console.error('[MenuController]', error);
  return res
    .status(error.status || 500)
    .json({ message: error.message || 'Something went wrong' });
};

exports.getMenuItems = async (req, res) => {
  try {
    const filter = {};
    const { outlet: outletParam, category: categoryParam, limit } = req.query;

    if (outletParam) {
      let outletId = outletParam;
      if (!mongoose.Types.ObjectId.isValid(outletParam)) {
        const outletDoc = await Outlet.findOne({ name: outletParam })
          .select('_id')
          .lean();
        outletId = outletDoc?._id;
      }

      if (outletId) {
        filter.outlet = outletId;
      }
    }

    if (categoryParam) {
      filter.category = categoryParam;
    }

    let query = MenuItem.find(filter)
      .populate('outlet', 'name location')
      .sort('-updatedAt');

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      }
    }

    const menuItems = await query.lean();

    return res.json({ menuItems });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('outlet', 'name location')
      .lean();

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.json({ menuItem });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const outletExists = await Outlet.exists({ _id: req.body.outlet });
    if (!outletExists) {
      return res.status(400).json({ message: 'Invalid outlet' });
    }

    const menuItem = await MenuItem.create(req.body);
    return res.status(201).json({ menuItem });
  } catch (error) {
    if (error.code === 11000) {
      error.status = 400;
      error.message = 'Menu item already exists for this outlet';
    }
    return handleError(res, error);
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    if (req.body.outlet) {
      const outletExists = await Outlet.exists({ _id: req.body.outlet });
      if (!outletExists) {
        return res.status(400).json({ message: 'Invalid outlet' });
      }
    }

    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.json({ menuItem });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    return handleError(res, error);
  }
};

