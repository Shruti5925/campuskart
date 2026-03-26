const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

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
        productTitle: item.product.title,
        productImage: (item.product.images && item.product.images.length > 0) ? item.product.images[0] : item.product.image,
        quantity: item.quantity,
        priceAtPurchase: price
      };
    });

    const order = new Order({
      buyer: req.user.id,
      products: orderProducts,
      totalAmount,
      status: req.body.status || 'pending'
    });

    await order.save();

    // Notify sellers for each product in the order
    for (const item of validCart) {
        const product = await Product.findById(item.product._id);
        if (product && product.seller) {
            const sellerNotification = new Notification({
                user: product.seller,
                type: 'info',
                title: 'New Order Received! 📦',
                message: `You have a new order for "${product.title}". Check your dashboard for details.`,
                link: '/dashboard'
            });
            await sellerNotification.save();

            // Emit via socket if seller is online
            const sellerSocketId = req.users?.get(product.seller.toString());
            if (sellerSocketId && req.io) {
                req.io.to(sellerSocketId).emit('new_notification', sellerNotification);
            }
        }
    }

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
    const orders = await Order.find({ 
      buyer: req.user.id,
      'products.productTitle': { $ne: 'CampusKart Support' }
    })
      .populate("products.product")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

exports.returnOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure order belongs to the requester
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to return this order" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "Only completed orders can be returned" });
    }

    // Check if within 3 days (3 * 24 * 60 * 60 * 1000 ms)
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - new Date(order.createdAt).getTime();

    if (timeElapsed > threeDaysInMs) {
      return res.status(400).json({ message: "Return period (3 days) has expired" });
    }

    order.status = "returned";
    await order.save();

    res.json({ message: "Order returned successfully! 📦", order });
  } catch (err) {
    console.error("Return Order Error:", err);
    res.status(500).json({ message: "Server error during order return" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure order belongs to the requester
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    order.status = "cancelled";
    // Using schema's unstructured fields or just saving it inside order if valid
    order.cancellationReason = "Cancelled by buyer";
    await order.save();

    res.json({ message: "Order cancelled successfully! ❌", order });
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ message: "Server error during order cancellation" });
  }
};
