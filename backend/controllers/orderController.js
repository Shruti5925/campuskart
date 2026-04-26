const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.checkout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "cart.product",
      populate: { path: "seller", select: "firstName lastName" }
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const productId = req.body.productId;
    
    // Filter out items where product might have been deleted or user is buying their own product
    let validCart = user.cart.filter(item => {
        if (!item.product) return false;
        if (item.product.seller && item.product.seller.toString() === req.user.id) return false;
        
        // If a specific productId is provided, only include that one
        if (productId && item.product._id.toString() !== productId) return false;
        
        return true;
    });

    if (validCart.length === 0) {
      if (productId) {
          return res.status(404).json({ message: "Product not found in your cart or is invalid" });
      }
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
        seller: item.product.seller?._id,
        sellerName: item.product.seller ? `${item.product.seller.firstName} ${item.product.seller.lastName}` : "Banasthali Student",
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

    // Remove only the purchased items from the cart
    const purchasedIds = validCart.map(item => item.product._id.toString());
    user.cart = user.cart.filter(item => 
        !item.product || !purchasedIds.includes(item.product._id.toString())
    );
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
      .populate({
        path: "products.product",
        populate: { path: "seller", select: "firstName lastName" }
      })
      .populate("products.seller", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

exports.returnOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("products.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure order belongs to the requester
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to return this order" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "Only completed orders can be returned" });
    }

    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - new Date(order.createdAt).getTime();

    if (timeElapsed > threeDaysInMs) {
      return res.status(400).json({ message: "Return period (3 days) has expired" });
    }

    order.status = "returned";
    await order.save();

    // -- AUTOMATION START --
    const buyer = await User.findById(req.user.id);
    const firstProductItem = order.products[0];
    const product = firstProductItem.product;
    const sellerId = product ? product.seller : firstProductItem.seller;

    if (sellerId) {
      // 1. Notify Seller
      const sellerNotification = new Notification({
        user: sellerId,
        type: "info",
        title: "Return Requested",
        message: `${buyer.firstName} has requested a return for "${firstProductItem.productTitle || product.title}". Please check your messages.`,
        link: `/messages`
      });
      await sellerNotification.save();

      // 2. Auto-Message the Seller
      const p0 = buyer._id.toString();
      const p1 = sellerId.toString();
      const interactionKey = p0 < p1 ? `${p0}_${p1}` : `${p1}_${p0}`;

      const conversation = await Conversation.findOneAndUpdate(
        { interactionKey },
        { 
          $setOnInsert: { 
            participants: [p0, p1],
            product: product ? product._id : null,
            status: 'active'
          } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const autoMessageContent = `Hi! I have initiated a return for the item "${firstProductItem.productTitle || product.title}". I would like to coordinate a meetup to return the item and finalize the refund. Please let me know when you're available!`;
      
      const message = new Message({
        conversationId: conversation._id,
        sender: buyer._id,
        content: autoMessageContent,
        type: 'text'
      });
      await message.save();

      conversation.lastMessage = autoMessageContent;
      conversation.lastMessageSender = buyer._id;
      await conversation.save();
    }
    // -- AUTOMATION END --

    res.json({ message: "Order returned successfully! 📦 Seller has been notified to coordinate the refund.", order });
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
