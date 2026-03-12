const Product = require("../models/Product");

// ==============================
// CREATE PRODUCT
// ==============================
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle image upload
    if (req.file) {
      productData.image = `http://localhost:5001/${req.file.path.replace(/\\/g, "/")}`;
    }

    const product = new Product({
      ...productData,
      seller: req.user.id   // Logged-in user ID
    });

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==============================
// GET ALL PRODUCTS
// ==============================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("seller", "-password -securityAnswer"); 
      // 👆 fetch ALL seller fields except sensitive ones

    res.status(200).json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==============================
// GET SINGLE PRODUCT
// ==============================
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "-password -securityAnswer");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==============================
// UPDATE PRODUCT
// ==============================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to update this product"
      });
    }

    const productData = { ...req.body };

    // If new image uploaded
    if (req.file) {
      productData.image = `http://localhost:5001/${req.file.path.replace(/\\/g, "/")}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    ).populate("seller", "-password -securityAnswer");

    res.status(200).json({
      message: "Product updated successfully",
      updatedProduct
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==============================
// DELETE PRODUCT
// ==============================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Not authorized to delete this product"
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//EDIT PRODUCTS
exports.updateProduct = async (req, res) => {
  try {

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};