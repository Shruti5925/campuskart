const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const findProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({ title: /support/i });
    console.log('Products found:', products.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        subCategory: p.subCategory
    })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findProducts();
