const Order = require('../models/Order');
const Outlet = require('../models/Outlet');
const MenuItem = require('../models/MenuItem');

const handleError = (res, error) => {
  console.error('[OrderController]', error);
  return res
    .status(error.status || 500)
    .json({ message: error.message || 'Something went wrong' });
};

exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.outlet) {
      filter.outlet = req.query.outlet;
    }

    const orders = await Order.find(filter)
      .populate('outlet', 'name location')
      .populate('items.menuItem', 'name price')
      .sort('-createdAt')
      .lean();

    return res.json({ orders });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('outlet', 'name location')
      .populate('items.menuItem', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { outlet: outletId, items } = req.body;

    const outletExists = await Outlet.exists({ _id: outletId });
    if (!outletExists) {
      return res.status(400).json({ message: 'Invalid outlet' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) {
          throw new Error(`Menu item not found: ${item.menuItem}`);
        }

        return {
          menuItem: menuItem._id,
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price,
        };
      })
    );

    const totalAmount = populatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      ...req.body,
      items: populatedItems,
      totalAmount,
    });

    return res.status(201).json({ order });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('outlet', 'name location')
      .populate('items.menuItem', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
      .populate('outlet', 'name location')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    return handleError(res, error);
  }
};

