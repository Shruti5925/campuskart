const Product = require("../models/Product");

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (req.file) {
      productData.image = `http://localhost:5001/${req.file.path.replace(/\\/g, "/")}`;
    }

    const product = new Product({
      ...productData,
      seller: req.user.id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ALL
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("seller", "firstName lastName email");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "firstName lastName email");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this product" });
    }

    const productData = { ...req.body };
    if (req.file) {
      productData.image = `http://localhost:5001/${req.file.path.replace(/\\/g, "/")}`;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
