import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/AddProduct.css";

const EditProduct = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "New",
    description: "",
    price: "",
    pickupPoint: ""
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {

    try {

      const res = await axios.get(
        `http://localhost:5001/api/products/${id}`
      );

      const product = res.data;

      setForm({
        title: product.title || "",
        category: product.category || "",
        condition: product.condition || "New",
        description: product.description || "",
        price: product.price || "",
        pickupPoint: product.pickupPoint || ""
      });

      if (product.image) {
       setPreview(product.image);
      }

    } catch (err) {
      console.error("Error loading product:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {

    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }

  };

  const updateProduct = async (e) => {

    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach(key =>
      formData.append(key, form[key])
    );

    if (image) formData.append("image", image);

    try {

      await axios.put(
        `http://localhost:5001/api/products/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Product updated successfully");

      navigate("/dashboard");

    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (

    <div className="list-item-container">

      <main className="list-item-content">

        <div className="content-left">

          {/* PAGE TITLE */}
          <div className="page-title">
            <h1>Edit Product</h1>
            <p>Update the details of your listing</p>
          </div>

          {/* PHOTO */}
          <div className="section-card upload-section">

            <h3>Photos</h3>

            <div
              className="upload-box"
              onClick={() =>
                document.getElementById("imageInput").click()
              }
            >

              <input
                id="imageInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="image-preview-large"
                />
              ) : (
                <>
                  <div className="upload-icon">📷</div>
                  <p><strong>Upload Photo</strong></p>
                </>
              )}

            </div>

          </div>

          {/* PRODUCT INFO */}
          <div className="section-card info-section">

            <h3>Product Information</h3>

            <div className="input-group">

              <label>Product Title</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
              />

            </div>

            <div className="row">

              <div className="input-group half">

                <label>Category</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fan">Fan</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Cycles">Cycles</option>
                </select>

              </div>

              <div className="input-group half">

                <label>Condition</label>

                <div className="condition-toggle">

                  {["New", "Like New", "Used"].map(c => (

                    <button
                      key={c}
                      type="button"
                      className={form.condition === c ? "active" : ""}
                      onClick={() =>
                        setForm({ ...form, condition: c })
                      }
                    >
                      {c}
                    </button>

                  ))}

                </div>

              </div>

            </div>

            <div className="input-group">

              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* PRICE */}
          <div className="section-card pricing-section">

            <h3>Pricing & Pickup</h3>

            <div className="row">

              <div className="input-group half">

                <label>Price (₹)</label>

                <div className="price-input">

                  <span>₹</span>

                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                  />

                </div>

              </div>

              <div className="input-group half">

                <label>Pickup Point</label>

                <input
                  name="pickupPoint"
                  value={form.pickupPoint}
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>

          {/* BUTTONS */}
          <div className="form-actions">

            <button
              className="continue-btn"
              onClick={updateProduct}
            >
              Save Changes
            </button>

            <button
              className="draft-btn"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

          </div>

        </div>

      </main>

    </div>
  );
};

export default EditProduct;