const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Conversation = require('./models/Conversation');
require('dotenv').config();

const finalCleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all support products
    const productDeleteResult = await Product.deleteMany({ 
      $or: [
        { subCategory: 'support-marker' },
        { title: 'CampusKart Support' }
      ] 
    });
    console.log(`Deleted ${productDeleteResult.deletedCount} support products`);

    // 2. Delete ALL orders associated with support
    const orderDeleteResult = await Order.deleteMany({
      'products.productTitle': 'CampusKart Support'
    });
    console.log(`Deleted ${orderDeleteResult.deletedCount} redundant support orders`);

    // 3. Find conversations where product is missing/deleted and nullify the field
    const conversations = await Conversation.find().populate('product');
    let fixedConvs = 0;
    for (const conv of conversations) {
        if (conv.product === null && conv._id) {
            // This means the product reference is broken (meaning it WAS a support product we deleted)
            await Conversation.updateOne({ _id: conv._id }, { $set: { product: null } });
            fixedConvs++;
        }
    }
    console.log(`Fixed ${fixedConvs} conversations with broken product references`);

    console.log('Final Cleanup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
};

finalCleanup();
