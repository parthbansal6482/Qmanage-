const Outlet = require('../models/Outlet');
const MenuItem = require('../models/MenuItem');

const handleError = (res, error) => {
  console.error('[OutletController]', error);
  return res
    .status(error.status || 500)
    .json({ message: error.message || 'Something went wrong' });
};

const normalizeOutletPayload = (body) => {
  const payload = { ...body };
  if (payload.categories) {
    if (!Array.isArray(payload.categories)) {
      payload.categories = String(payload.categories)
        .split(',')
        .map((cat) => cat.trim())
        .filter(Boolean);
    } else {
      payload.categories = payload.categories
        .map((cat) => String(cat).trim())
        .filter(Boolean);
    }
  }
  return payload;
};

exports.getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find().sort('name').lean();
    return res.json({ outlets });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getOutletById = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id).lean();
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    const menuItems = await MenuItem.find({ outlet: outlet._id }).lean();
    return res.json({ outlet, menuItems });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.createOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.create(normalizeOutletPayload(req.body));
    return res.status(201).json({ outlet });
  } catch (error) {
    if (error.code === 11000) {
      error.status = 400;
      error.message = 'Outlet with this name already exists';
    }
    return handleError(res, error);
  }
};

exports.updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      normalizeOutletPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    return res.json({ outlet });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    // Remove related menu items
    await MenuItem.deleteMany({ outlet: outlet._id });
    await outlet.deleteOne();

    return res.json({ message: 'Outlet deleted successfully' });
  } catch (error) {
    return handleError(res, error);
  }
};

