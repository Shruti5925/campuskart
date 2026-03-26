const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find all support products (by subCategory OR by specific Title if it was created before)
    const supportProducts = await Product.find({ 
      $or: [
        { subCategory: 'support-marker' },
        { title: 'CampusKart Support' }
      ] 
    });
    console.log(`Found ${supportProducts.length} support products`);

    const supportProductIds = supportProducts.map(p => p._id);

    if (supportProductIds.length > 0) {
      // 2. Hide them from marketplace and fix their subCategory
      const updateResult = await Product.updateMany(
        { _id: { $in: supportProductIds } },
        { 
          status: 'support',
          subCategory: 'support-marker'
        }
      );
      console.log(`Updated ${updateResult.modifiedCount} products to status: "support" and subCategory: "support-marker"`);

      // 3. Find and delete ALL "pending" orders for these products
      const orderDeleteResult = await Order.deleteMany({
        'products.product': { $in: supportProductIds },
        status: 'pending'
      });
      console.log(`Deleted ${orderDeleteResult.deletedCount} erroneous pending orders`);
    }

    console.log('Cleanup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
};

cleanup();
