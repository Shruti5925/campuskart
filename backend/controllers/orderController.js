const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

exports.checkout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Filter out items where product might have been deleted
    const validCart = user.cart.filter(item => item.product);
    if (validCart.length === 0) {
      user.cart = [];
      await user.save();
      return res.status(400).json({ message: "No valid products in cart" });
    }

    let totalAmount = 0;
    const orderProducts = validCart.map(item => {
      const price = item.product.price || 0;
      totalAmount += price * item.quantity;
      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: price
      };
    });

    const order = new Order({
      buyer: req.user.id,
      products: orderProducts,
      totalAmount
    });

    await order.save();

    // Clear user cart
    user.cart = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully! 🎉", order });
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({ message: "Server error during checkout" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("products.product")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};
